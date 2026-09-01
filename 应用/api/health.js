'use strict';

const { aiMode } = require('./_lib/chat');

module.exports = function health(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify({
    ok: true,
    service: 'HIEC API (托管函数)',
    aiMode: aiMode(),
    // Vercel 等函数托管不支持长连接；页面会自动使用本地演示降级。
    websocket: false,
    time: new Date().toISOString(),
  }));
};
