import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const PORT = Number(process.env.PORT) || 3007;
const HOST = process.env.HOST || '0.0.0.0';
const API_PROXY_TARGET = process.env.API_PROXY_TARGET || 'http://127.0.0.1:5001';

const app = express();

app.use(
  '/api',
  createProxyMiddleware({
    target: API_PROXY_TARGET,
    changeOrigin: true,
    pathRewrite: (path) => `/api${path}`,
  }),
);

app.use(
  '/uploads',
  createProxyMiddleware({
    target: API_PROXY_TARGET,
    changeOrigin: true,
    pathRewrite: (path) => `/uploads${path}`,
  }),
);

const distDir = path.join(root, 'dist');
app.use(express.static(distDir, { index: false }));

app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Admin panel: http://${HOST}:${PORT}`);
  console.log(`API proxy: ${API_PROXY_TARGET}`);
});
