// Plan 2026-10-29-morning-digest. Types first so page, JSON, board link, and tests
// can start against this signature. Implementation is issue #2.

export type JobStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: JobStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type ReadNight = (runsDir: string, night: string) => DigestRow[];
