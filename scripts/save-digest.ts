import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const night = process.argv[2] ?? '2026-10-28';
const out = process.argv[3] ?? join('var', `digest-${night}.html`);
const app = createApp(loadConfig());
const res = await app.request(`/digest/${night}`);
if (res.status !== 200) {
  throw new Error(`GET /digest/${night} → ${res.status}`);
}
mkdirSync('var', { recursive: true });
writeFileSync(out, await res.text());
console.log(out);
