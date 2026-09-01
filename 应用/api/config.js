'use strict';

const { aiMode } = require('./_lib/chat');

module.exports = function config(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const mode = aiMode();
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify({
    aiMode: mode,
    model: mode === 'online' ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat') : 'offline-demo',
  }));
};
