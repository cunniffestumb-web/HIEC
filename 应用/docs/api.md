# HIEC API 快速说明

## 健康检查

```http
GET /api/health
```

返回服务状态、AI 模式和 WebSocket 是否启用。

## 获取前端配置

```http
GET /api/config
```

只返回 `aiMode` 和 `model`，不会返回模型密钥。

## AI 对话

```http
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "请解释甲烷的键角"}
  ]
}
```

默认模式为离线演示。服务端设置 `HIEC_AI_MODE=deepseek` 并配置 `DEEPSEEK_API_KEY` 后，接口会转发到 DeepSeek。

## 协作 WebSocket

```text
ws://localhost:5173/ws?room=chemistry-demo&name=演示用户
```

支持消息类型：`join`、`chat`、`operation`。服务端会限制消息长度和 WebSocket 单帧大小。
