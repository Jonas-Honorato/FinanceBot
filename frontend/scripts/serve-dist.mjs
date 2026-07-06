import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const port = Number(process.env.FRONTEND_PORT || process.env.PORT || 5173);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function safePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const resolved = path.resolve(distDir, requested);
  return resolved.startsWith(distDir) ? resolved : path.join(distDir, 'index.html');
}

const server = http.createServer(async (req, res) => {
  const filePath = safePath(req.url || '/');
  const fallback = path.join(distDir, 'index.html');

  try {
    const data = await fs.readFile(filePath);
    res.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  } catch {
    const data = await fs.readFile(fallback);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(data);
  }
});

server.listen(port, () => {
  console.log(`FinanceBot frontend: http://localhost:${port}`);
});
