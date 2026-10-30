import { describe, expect, it } from 'vitest';
import { loadNight, readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads five jobs from runs/2026-10-28.jsonl', () => {
    const rows = readNight('runs', '2026-10-28');
    expect(rows.map((r) => r.job)).toEqual([
      'rig/rotate-logs',
      'lane/sync',
      'fixtures/refresh',
      'notes/backup',
      'digest/render',
    ]);
    expect(rows).toHaveLength(5);

    const rotate = rows[0]!;
    expect(rotate).toMatchObject({
      owner: 'lane-07',
      runs: 1,
      retries: 0,
      lastStatus: 'ok',
      lastError: null,
      firstAt: '2026-10-28T23:00:02+01:00',
      lastAt: '2026-10-28T23:00:02+01:00',
    });

    const sync = rows[1]!;
    expect(sync).toMatchObject({
      owner: 'rook',
      runs: 8,
      retries: 1,
      lastStatus: 'ok',
      lastError: null,
      firstAt: '2026-10-28T23:00:06+01:00',
      lastAt: '2026-10-29T05:00:04+01:00',
    });

    const refresh = rows[2]!;
    expect(refresh).toMatchObject({
      owner: 'rook',
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: null,
    });

    const backup = rows[3]!;
    expect(backup).toMatchObject({
      owner: 'lane-07',
      runs: 1,
      retries: 0,
      lastStatus: 'fail',
      lastError: 'quota exceeded',
    });

    const render = rows[4]!;
    expect(render).toMatchObject({
      owner: null,
      runs: 1,
      retries: 0,
      lastStatus: 'ok',
      lastError: null,
    });
  });

  it('counts a bad line and still returns the five jobs', () => {
    const night = loadNight('runs', '2026-10-28');
    expect(night.skipped).toBe(1);
    expect(night.rows).toHaveLength(5);
  });
});
