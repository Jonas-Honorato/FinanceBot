import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformAsync } from '@babel/core';
import transformReactJsxModule from '@babel/plugin-transform-react-jsx';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import { rollup } from 'rollup';
import tailwindcss from 'tailwindcss';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const assetsDir = path.join(distDir, 'assets');
const cssOutputPath = path.join(assetsDir, 'main.css');
const reactJsxTransform = transformReactJsxModule.default ?? transformReactJsxModule;

const cssImports = new Set();

function cssImportPlugin() {
  return {
    name: 'financebot-css-imports',
    resolveId(source, importer) {
      if (!source.endsWith('.css')) return null;
      return path.resolve(importer ? path.dirname(importer) : root, source);
    },
    load(id) {
      if (!id.endsWith('.css')) return null;
      cssImports.add(id);
      return 'export default undefined;';
    }
  };
}

function jsxPlugin() {
  return {
    name: 'financebot-jsx',
    async transform(code, id) {
      if (!/\.[cm]?[jt]sx?$/.test(id)) return null;

      const replacedCode = code.replace(/\bprocess\.env\.NODE_ENV\b/g, JSON.stringify('production'));
      const shouldTransformJsx = id.endsWith('.jsx') || id.startsWith(path.join(root, 'src'));

      if (!shouldTransformJsx) {
        return replacedCode === code ? null : { code: replacedCode, map: null };
      }

      const result = await transformAsync(replacedCode, {
        babelrc: false,
        configFile: false,
        filename: id,
        plugins: [[reactJsxTransform, { runtime: 'automatic' }]],
        sourceMaps: false
      });

      return result?.code ? { code: result.code, map: null } : null;
    }
  };
}

async function writeCss() {
  if (cssImports.size === 0) return;

  const css = await Promise.all(
    [...cssImports].map((filePath) => fs.readFile(filePath, 'utf8'))
  );
  const result = await postcss([
    tailwindcss({ config: path.join(root, 'tailwind.config.js') }),
    autoprefixer()
  ]).process(css.join('\n'), {
    from: path.join(root, 'src', 'styles.css'),
    to: cssOutputPath
  });

  await fs.writeFile(cssOutputPath, result.css);
}

async function writeIndex() {
  const hasCss = await fs.stat(cssOutputPath).then(() => true).catch(() => false);
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

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(assetsDir, { recursive: true });

const bundle = await rollup({
  input: path.join(root, 'src', 'main.jsx'),
  plugins: [
    cssImportPlugin(),
    jsxPlugin(),
    nodeResolve({
      browser: true,
      extensions: ['.mjs', '.js', '.jsx', '.json']
    }),
    commonjs()
  ],
  treeshake: true
});

await bundle.write({
  file: path.join(assetsDir, 'main.js'),
  format: 'esm',
  sourcemap: false
});
await bundle.close();

await writeCss();
await writeIndex();

console.log('Frontend build completed without esbuild service mode.');
