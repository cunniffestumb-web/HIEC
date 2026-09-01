const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...headers,
  });
  res.end(data);
}

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url);
    let pathname = decodeURIComponent(parsed.pathname || '/');

    // Prevent path traversal
    if (pathname.includes('..')) {
      return send(res, 400, 'Bad Request');
    }

    let filePath = path.join(ROOT, pathname);
    fs.stat(filePath, (err, stat) => {
      if (err) {
        return send(res, 404, 'Not Found');
      }
      if (stat.isDirectory()) {
        // Try index.html
        filePath = path.join(filePath, 'index.html');
        fs.stat(filePath, (e2, s2) => {
          if (e2 || !s2.isFile()) {
            return send(res, 403, 'Forbidden');
          }
          serveFile(filePath, res);
        });
      } else if (stat.isFile()) {
        serveFile(filePath, res);
      } else {
        send(res, 404, 'Not Found');
      }
    });
  } catch (e) {
    send(res, 500, 'Internal Server Error');
  }
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, 'Internal Server Error');
    send(res, 200, data, { 'Content-Type': mime });
  });
}

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

function printPreviewLogs(port) {
  const local = `http://localhost:${port}/`;
  const ip = getLocalIP();
  const network = ip ? `http://${ip}:${port}/` : null;

  const lines = [
    '',
    'Static server is running:',
    `  Local:   ${local}`,
    network ? `  Network: ${network}` : null,
    `  Hint:    ${local}history.html`,
    '',
  ].filter(Boolean);
  console.log(lines.join('\n'));
}

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use, trying a random available port...`);
    // Retry on a random available port
    server.listen(0);
  } else {
    console.error('Server error:', err);
  }
});

server.on('listening', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : PORT;
  printPreviewLogs(port);
});

// Start server with preferred port, fallback handled in 'error'
server.listen(PORT);