import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, JobStatus, ReadNight } from './types.js';

type Event = {
  at: string;
  job: string;
  status: JobStatus;
  owner: string | null;
  error: string | null;
};

function isStatus(v: unknown): v is JobStatus {
  return v === 'ok' || v === 'retry' || v === 'fail';
}

function parseLine(line: string): Event | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string' || !isStatus(o.status)) return null;
  const owner = o.owner === undefined || o.owner === null ? null : typeof o.owner === 'string' ? o.owner : null;
  const error = typeof o.error === 'string' ? o.error : null;
  return { at: o.at, job: o.job, status: o.status, owner, error };
}

function addEvent(row: DigestRow, ev: Event): void {
  row.runs += 1;
  if (ev.status === 'retry') row.retries += 1;
  row.lastStatus = ev.status;
  row.lastError = ev.error;
  row.lastAt = ev.at;
  row.owner = ev.owner;
}

export type NightRead = { rows: DigestRow[]; skipped: number };

export function loadNight(runsDir: string, night: string): NightRead {
  const text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  const rows = new Map<string, DigestRow>();
  const order: string[] = [];
  let skipped = 0;

  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const ev = parseLine(line);
    if (!ev) {
      skipped += 1;
      continue;
    }
    const existing = rows.get(ev.job);
    if (existing) {
      addEvent(existing, ev);
    } else {
      const row: DigestRow = {
        job: ev.job,
        owner: ev.owner,
        runs: 1,
        retries: ev.status === 'retry' ? 1 : 0,
        lastStatus: ev.status,
        lastError: ev.error,
        firstAt: ev.at,
        lastAt: ev.at,
      };
      rows.set(ev.job, row);
      order.push(ev.job);
    }
  }

  return { rows: order.map((job) => rows.get(job)).filter((r): r is DigestRow => r !== undefined), skipped };
}

export const readNight: ReadNight = (runsDir, night) => loadNight(runsDir, night).rows;

export function nightFile(runsDir: string, night: string): string {
  return join(runsDir, `${night}.jsonl`);
}

export function nightExists(runsDir: string, night: string): boolean {
  return existsSync(nightFile(runsDir, night));
}

export function sortDigest(rows: DigestRow[]): DigestRow[] {
  return [...rows].sort((a, b) => a.job.localeCompare(b.job));
}

export function rowsForNight(runsDir: string, night: string): DigestRow[] | null {
  if (!nightExists(runsDir, night)) return null;
  return sortDigest(readNight(runsDir, night));
}
