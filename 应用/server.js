'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');

loadDotEnv(path.join(__dirname, '.env'));

const PORT = Number.parseInt(process.env.PORT || '5173', 10);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.resolve(__dirname);
const AI_MODE = String(process.env.HIEC_AI_MODE || 'offline').toLowerCase();
const DEEPSEEK_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const MAX_BODY_BYTES = 1024 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
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

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

function send(res, status, body, headers = {}) {
  const payload = body === undefined || body === null ? '' : body;
  const responseHeaders = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  };
  if (!Object.hasOwn(responseHeaders, 'Content-Length')) {
    responseHeaders['Content-Length'] = Buffer.byteLength(payload);
  }
  res.writeHead(status, responseHeaders);
  res.end(payload);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload), {
    'Content-Type': 'application/json; charset=utf-8',
  });
}

function cacheControlFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (['.html', '.htm', '.json'].includes(extension) || path.basename(filePath) === 'sw.js') {
    return 'public, max-age=0, must-revalidate';
  }
  if (['.js', '.mjs', '.css'].includes(extension)) {
    return 'public, max-age=3600, stale-while-revalidate=86400';
  }
  if (['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf'].includes(extension)) {
    return 'public, max-age=604800, stale-while-revalidate=2592000';
  }
  return 'public, max-age=3600, stale-while-revalidate=86400';
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', chunk => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('请求体过大'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('请求不是有效的 JSON'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function normaliseMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-20)
    .filter(item => item && ['system', 'user', 'assistant'].includes(item.role))
    .map(item => ({
      role: item.role,
      content: String(item.content || '').slice(0, 6000),
    }))
    .filter(item => item.content.trim());
}

function getLastUserMessage(messages) {
  return [...messages].reverse().find(item => item.role === 'user')?.content || '';
}

function offlineReply(messages) {
  const question = getLastUserMessage(messages);
  let answer = '这是 HIEC 离线演示模式的示例回答。系统可以围绕学习目标、知识讲解、练习反馈和下一步建议组织教学流程。';

  if (/甲烷|分子|化学|键角|正四面体/.test(question)) {
    answer = '以甲烷为例：碳原子位于中心，四个氢原子分布在正四面体的四个顶点，H-C-H 键角约为 109.5°。在演示中可以旋转模型观察空间构型，再通过练习检查是否理解。';
  } else if (/天文|行星|太阳|轨道|宇宙/.test(question)) {
    answer = '天文场景适合先建立“尺度和轨道”的直观认识，再解释行星运动。建议先观察太阳、地球和轨道关系，然后提问“距离和周期有什么联系”，最后进入拓展内容。';
  } else if (/解剖|器官|人体|心脏|肺/.test(question)) {
    answer = '解剖场景可以按“系统总览 → 器官定位 → 功能解释 → 小测验”的顺序学习。演示页面支持切换人体系统并查看器官说明，适合展示空间化知识学习。';
  } else if (/历史|文明|朝代|场景/.test(question)) {
    answer = '历史场景可以把时间线、地点和事件串起来。建议先选择一个历史时期，再查看场景重现和事件说明，最后用时间顺序题检验理解。';
  }

  return {
    answer,
    mode: 'offline',
    source: 'HIEC 离线演示知识库',
  };
}

function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

async function onlineReply(messages) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const error = new Error('服务端尚未配置 DEEPSEEK_API_KEY');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetchWithTimeout(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      stream: false,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || `模型服务返回 ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  return {
    answer: payload.choices?.[0]?.message?.content || '模型没有返回可显示的内容。',
    mode: 'online',
    source: 'DeepSeek（服务端代理）',
  };
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'HIEC API',
      aiMode: AI_MODE === 'deepseek' || AI_MODE === 'online' ? 'online' : 'offline',
      websocket: true,
      time: new Date().toISOString(),
    });
  }

  if (req.method === 'GET' && pathname === '/api/config') {
    return sendJson(res, 200, {
      aiMode: AI_MODE === 'deepseek' || AI_MODE === 'online' ? 'online' : 'offline',
      model: AI_MODE === 'deepseek' || AI_MODE === 'online' ? DEEPSEEK_MODEL : 'offline-demo',
    });
  }

  if (req.method === 'POST' && pathname === '/api/chat') {
    try {
      const body = await readJson(req);
      const messages = normaliseMessages(body.messages);
      if (!messages.some(item => item.role === 'user')) {
        return sendJson(res, 400, { error: '至少需要一条用户消息' });
      }
      const result = AI_MODE === 'deepseek' || AI_MODE === 'online'
        ? await onlineReply(messages)
        : offlineReply(messages);
      return sendJson(res, 200, result);
    } catch (error) {
      console.error('[api/chat]', error.message);
      return sendJson(res, error.statusCode || 500, {
        error: error.name === 'AbortError' ? '模型服务请求超时' : error.message,
      });
    }
  }

  return sendJson(res, 404, { error: 'API endpoint not found' });
}

function safeFilePath(pathname) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, relativePath);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) return null;
  return filePath;
}

function serveStatic(req, res, pathname) {
  const filePath = safeFilePath(pathname);
  if (!filePath) return send(res, 400, 'Bad Request', { 'Content-Type': 'text/plain; charset=utf-8' });

  fs.stat(filePath, (statError, stat) => {
    if (statError) return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
    const finalPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    fs.stat(finalPath, (finalStatError, finalStat) => {
      if (finalStatError) return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
      fs.readFile(finalPath, (readError, data) => {
      if (readError) return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
      const mime = MIME_TYPES[path.extname(finalPath).toLowerCase()] || 'application/octet-stream';
      const headers = {
        'Content-Type': mime,
        'Cache-Control': cacheControlFor(finalPath),
      };
      if (req.method === 'HEAD') {
        return send(res, 200, '', { ...headers, 'Content-Length': finalStat.size });
      }
      send(res, 200, data, headers);
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (requestUrl.pathname.startsWith('/api/')) {
      return await handleApi(req, res, requestUrl.pathname);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
    }
    return serveStatic(req, res, decodeURIComponent(requestUrl.pathname));
  } catch (error) {
    console.error('[server]', error);
    return sendJson(res, 500, { error: 'Internal Server Error' });
  }
});

const rooms = new Map();
const websocketServer = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 64 * 1024,
});

function getRoom(roomName) {
  const name = String(roomName || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'default';
  if (!rooms.has(name)) rooms.set(name, new Set());
  return { name, clients: rooms.get(name) };
}

function broadcastPresence(room) {
  const message = JSON.stringify({ type: 'presence', count: room.clients.size });
  for (const client of room.clients) {
    if (client.readyState === 1) client.send(message);
  }
}

function broadcast(room, payload, sender) {
  const message = JSON.stringify(payload);
  for (const client of room.clients) {
    if (client !== sender && client.readyState === 1) client.send(message);
  }
}

websocketServer.on('connection', (socket, request) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const room = getRoom(requestUrl.searchParams.get('room'));
  const client = socket;
  client.hiecUser = String(requestUrl.searchParams.get('name') || '演示用户').slice(0, 40);
  client.hiecRoom = room;
  room.clients.add(client);
  broadcastPresence(room);

  socket.on('message', raw => {
    try {
      const data = JSON.parse(raw.toString('utf8'));
      if (data.type === 'join') {
        client.hiecUser = String(data.user || client.hiecUser).slice(0, 40);
        return broadcastPresence(room);
      }
      if (data.type === 'chat') {
        const text = String(data.text || '').trim().slice(0, 500);
        if (text) broadcast(room, { type: 'chat', user: client.hiecUser, text }, client);
      }
      if (data.type === 'operation') {
        const action = String(data.action || '').trim().slice(0, 120);
        if (action) broadcast(room, { type: 'operation', user: client.hiecUser, action }, client);
      }
    } catch (error) {
      console.warn('[ws] ignored invalid message:', error.message);
    }
  });

  socket.on('close', () => {
    room.clients.delete(client);
    if (room.clients.size === 0) rooms.delete(room.name);
    else broadcastPresence(room);
  });
});

function localIp() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  return null;
}

server.on('listening', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : PORT;
  console.log(`HIEC 2.0 已启动: http://localhost:${port}/`);
  console.log(`AI 模式: ${AI_MODE === 'deepseek' || AI_MODE === 'online' ? '服务端 DeepSeek' : '离线演示'}`);
  if (localIp()) console.log(`局域网访问: http://${localIp()}:${port}/`);
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，请设置 PORT 使用其他端口。`);
  } else {
    console.error('[server error]', error);
  }
  process.exitCode = 1;
});

server.listen(PORT, HOST);
