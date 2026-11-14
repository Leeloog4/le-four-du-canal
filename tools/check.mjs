import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? walk(`${dir}/${entry.name}`)
    : /\.(js|mjs|ts)$/.test(entry.name) ? [`${dir}/${entry.name}`] : []);
}
for (const file of ['dist', 'supabase/functions', 'tests', 'tools'].flatMap(walk)) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('Syntaxe du site, de la PWA, des fonctions Supabase et des tests vérifiée.');
