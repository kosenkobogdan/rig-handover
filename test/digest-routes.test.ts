import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

function appFor(runsDir: string) {
  return createApp({ ...base, runsDir });
}

function tempRuns(): string {
  return mkdtempSync(join(tmpdir(), 'rig-runs-'));
}

const okLine = JSON.stringify({
  at: '2026-10-28T23:00:02+01:00',
  job: 'rig/rotate-logs',
  status: 'ok',
  owner: 'lane-07',
});

describe('digest routes', () => {
  it('returns 200 for a night with jobs, page and JSON in the same order', async () => {
    const dir = tempRuns();
    writeFileSync(join(dir, '2026-10-28.jsonl'), `${okLine}\n`);
    const app = appFor(dir);

    const page = await app.request('/digest/2026-10-28');
    const json = await app.request('/api/digest/2026-10-28');
    const rows = await json.json();

    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    expect(await page.text()).toContain('rig/rotate-logs');
    expect(rows).toEqual([
      {
        job: 'rig/rotate-logs',
        owner: 'lane-07',
        runs: 1,
        retries: 0,
        lastStatus: 'ok',
        lastError: null,
        firstAt: '2026-10-28T23:00:02+01:00',
        lastAt: '2026-10-28T23:00:02+01:00',
      },
    ]);
  });

  it('returns 404 for a night with no file', async () => {
    const app = appFor(tempRuns());
    expect((await app.request('/digest/2026-10-01')).status).toBe(404);
    expect((await app.request('/api/digest/2026-10-01')).status).toBe(404);
  });

  it('renders the empty night', async () => {
    const dir = tempRuns();
    writeFileSync(join(dir, '2026-10-28.jsonl'), '');
    const app = appFor(dir);

    const page = await app.request('/digest/2026-10-28');
    const json = await app.request('/api/digest/2026-10-28');

    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    expect(json.status).toBe(200);
    expect(await json.json()).toEqual([]);
  });

  it('renders a night with a bad line', async () => {
    const dir = tempRuns();
    writeFileSync(join(dir, '2026-10-28.jsonl'), `${okLine}\n{"at":"2026-10-29T05:59:58+01:00","job":"lane/sy\n`);
    const app = appFor(dir);

    const page = await app.request('/digest/2026-10-28');
    const json = await app.request('/api/digest/2026-10-28');
    const rows = (await json.json()) as { job: string }[];

    expect(page.status).toBe(200);
    expect(await page.text()).toContain('rig/rotate-logs');
    expect(json.status).toBe(200);
    expect(rows.map((r) => r.job)).toEqual(['rig/rotate-logs']);
  });
});
