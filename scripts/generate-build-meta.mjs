import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.resolve(__dirname, '../public/build-meta.json');
const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

const payload = {
  buildId,
  generatedAt: new Date().toISOString(),
};

writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Generated build metadata: ${buildId}`);
