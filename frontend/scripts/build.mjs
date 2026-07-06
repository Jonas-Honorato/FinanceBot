import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceBinary = path.join(root, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe');
const cacheDir = path.join(root, '.cache');
const localBinary = path.join(cacheDir, 'esbuild.exe');
const distDir = path.join(root, 'dist');
const assetsDir = path.join(distDir, 'assets');

async function ensureLocalEsbuild() {
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.copyFile(sourceBinary, localBinary);
  return localBinary;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with code ${code}`));
    });
  });
}

async function writeIndex() {
  const cssPath = path.join(assetsDir, 'main.css');
  const hasCss = await fs.stat(cssPath).then(() => true).catch(() => false);
  const stylesheet = hasCss ? '    <link rel="stylesheet" href="/assets/main.css" />\n' : '';

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
${stylesheet}    <title>FinanceBot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>
`;

  await fs.writeFile(path.join(distDir, 'index.html'), html);
}

await fs.mkdir(assetsDir, { recursive: true });

const esbuild = await ensureLocalEsbuild();
await run(esbuild, [
  'src/main.jsx',
  '--bundle',
  '--format=esm',
  '--outdir=dist/assets',
  '--entry-names=main',
  '--asset-names=[name]',
  '--loader:.js=jsx',
  '--loader:.jsx=jsx',
  '--minify',
  '--define:process.env.NODE_ENV="production"'
]);
await writeIndex();

console.log('Frontend build completed without esbuild service mode.');
