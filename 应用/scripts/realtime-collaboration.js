'use strict';

// 轻量协作通道：当前仅同步讨论消息、操作提示和在线人数。
// 复杂文档冲突解决、权限和持久化仍属于后续服务端能力。
(function initRealtimeCollaboration() {
  if (!('WebSocket' in window) || window.location.protocol === 'file:') return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const room = 'chemistry-demo';
  const user = `演示用户-${Math.floor(Math.random() * 900 + 100)}`;
  let socket;
  let stopped = false;
  let reconnectTimer;

  function addRemoteChatMessage(sender, text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    const message = document.createElement('div');
    message.className = 'chat-message';
    const author = document.createElement('div');
    author.className = 'message-author';
    author.textContent = sender;
    const content = document.createElement('div');
    content.textContent = text;
    content.style.whiteSpace = 'pre-wrap';
    message.append(author, content);
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function send(payload) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  }

  function connect() {
    if (stopped) return;
    const query = new URLSearchParams({ room, name: user });
    socket = new WebSocket(`${protocol}//${window.location.host}/ws?${query}`);
    socket.addEventListener('open', () => {
      window.__hiecRealtimeConnected = true;
      send({ type: 'join', user });
    });
    socket.addEventListener('message', event => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence') {
          const count = document.getElementById('onlineCount');
          if (count) count.textContent = String(data.count);
        } else if (data.type === 'chat') {
          addRemoteChatMessage(data.user, data.text);
          window.addActivityRecord?.(data.user, '发送了讨论消息');
        } else if (data.type === 'operation') {
          window.showOperationIndicator?.(window.innerWidth * 0.5, window.innerHeight * 0.5, `${data.user} ${data.action}`, '#f39c12');
          window.addActivityRecord?.(data.user, data.action);
        }
      } catch (error) {
        console.warn('[realtime] ignored invalid server message:', error.message);
      }
    });
    socket.addEventListener('close', () => {
      window.__hiecRealtimeConnected = false;
      if (!stopped) reconnectTimer = window.setTimeout(connect, 3000);
    });
    socket.addEventListener('error', () => socket.close());
  }

  window.HIECRealtime = {
    sendChat(text) {
      send({ type: 'chat', text });
    },
    sendOperation(action) {
      send({ type: 'operation', action });
    },
  };

  window.addEventListener('beforeunload', () => {
    stopped = true;
    window.clearTimeout(reconnectTimer);
    socket?.close();
  });
  // 函数托管平台不能承载 WebSocket。先读健康接口，避免公网页面反复重连并刷出控制台错误。
  fetch('/api/health', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : null)
    .then(health => {
      if (health?.websocket === true) connect();
      else window.__hiecRealtimeUnavailable = true;
    })
    .catch(() => {
      window.__hiecRealtimeUnavailable = true;
    });
})();
