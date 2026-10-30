import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { nightExists, readNight, sortDigest } from './digest/read.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { DigestBoard } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!nightExists(config.runsDir, night)) return c.notFound();
    const rows = sortDigest(readNight(config.runsDir, night));
    return c.html(
      <Layout title={`digest ${night}`} lane={lane()}>
        <DigestBoard night={night} rows={rows} />
      </Layout>,
    );
  });

  return app;
}
