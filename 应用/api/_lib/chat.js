'use strict';

const DEEPSEEK_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 6000;

function aiMode() {
  const mode = String(process.env.HIEC_AI_MODE || 'offline').toLowerCase();
  return mode === 'deepseek' || mode === 'online' ? 'online' : 'offline';
}

function normaliseMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-MAX_MESSAGES)
    .filter(item => item && ['system', 'user', 'assistant'].includes(item.role))
    .map(item => ({
      role: item.role,
      content: String(item.content || '').slice(0, MAX_CONTENT_LENGTH),
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

async function onlineReply(messages) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const error = new Error('服务端尚未配置 DEEPSEEK_API_KEY');
    error.statusCode = 503;
    throw error;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(DEEPSEEK_URL, {
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
      signal: controller.signal,
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
  } finally {
    clearTimeout(timer);
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function handleChat(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const messages = normaliseMessages(body.messages);
    if (!messages.some(item => item.role === 'user')) {
      return sendJson(res, 400, { error: '至少需要一条用户消息' });
    }
    const result = aiMode() === 'online' ? await onlineReply(messages) : offlineReply(messages);
    return sendJson(res, 200, result);
  } catch (error) {
    console.error('[api/chat]', error.message);
    return sendJson(res, error.statusCode || 500, {
      error: error.name === 'AbortError' ? '模型服务请求超时' : error.message,
    });
  }
}

module.exports = {
  aiMode,
  handleChat,
};
