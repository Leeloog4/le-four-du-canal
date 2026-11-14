import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
function files(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(`${dir}/${e.name}`) : /\.(mjs|js)$/.test(e.name) ? [`${dir}/${e.name}`] : []); }
for (const file of ['src', 'public', 'scripts', 'tests', 'api'].flatMap(dir => { try { return files(dir); } catch { return []; } })) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('Syntaxe JavaScript vérifiée.');
