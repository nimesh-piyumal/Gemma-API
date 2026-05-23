# 🤖 Gemma AI API — OpenAI-Compatible Cloudflare Worker

A free, OpenAI-compatible AI API powered by **Google Gemma 4 26B** running on **Cloudflare Workers AI** at the edge. Drop-in replacement for OpenAI's `/v1/chat/completions` endpoint — no credit card, no GPU needed.

> Built by [Nimesh Piyumal](https://ceylonnet.com)

---

## ✨ Features

- 🆓 **Free to run** — powered by Cloudflare Workers AI free tier (10,000 neurons/day)
- ⚡ **Edge inference** — runs on Cloudflare's 300+ global locations for ultra-low latency
- 🔌 **OpenAI-compatible** — works with any OpenAI SDK by just changing the `base_url`
- 🌊 **Streaming support** — real-time token streaming via Server-Sent Events (SSE)
- 🌍 **CORS enabled** — ready for browser-based frontends
- 🧠 **Powered by Gemma 4 26B** — Google's latest open model with reasoning capabilities

---

## 🚀 Quick Start

### Deploy Your Own

1. **Clone this repo**
   ```bash
   git clone https://github.com/nimesh-piyumal/Gemma-API.git
   cd Gemma-API
   ```

2. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Deploy to Cloudflare Workers**
   ```bash
   wrangler deploy
   ```

4. **Done!** Your API is live at `https://your-worker.your-subdomain.workers.dev`

---

## 📡 API Endpoints

### `GET /`
Returns API info.

```json
{
  "success": true,
  "creator": "Nimesh Piyumal",
  "website": "https://ceylonnet.com"
}
```

---

### `POST /v1/chat/completions`
OpenAI-compatible chat endpoint. Supports both streaming and non-streaming.

**Request**
```json
{
  "model": "gemma-4-26b-a4b-it",
  "messages": [
    { "role": "user", "content": "Explain quantum computing in one sentence." }
  ],
  "stream": false
}
```

**Response**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1779494702,
  "model": "gemma-4-26b-a4b-it",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing uses quantum mechanics to process information in multiple states simultaneously..."
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

### `GET /debug`
Returns the raw Cloudflare AI response object. Useful for debugging model output format.

---

## 🐍 Python Usage

```python
import requests
import json

BASE_URL = "https://your-worker.workers.dev"

# Non-streaming
response = requests.post(f"{BASE_URL}/v1/chat/completions", json={
    "model": "gemma-4-26b-a4b-it",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": False
})
print(response.json()["choices"][0]["message"]["content"])

# Streaming
with requests.post(f"{BASE_URL}/v1/chat/completions", json={
    "model": "gemma-4-26b-a4b-it",
    "messages": [{"role": "user", "content": "Count from 1 to 5."}],
    "stream": True
}, stream=True) as r:
    for line in r.iter_lines(decode_unicode=True):
        if line.startswith("data: ") and line != "data: [DONE]":
            data = json.loads(line[6:])
            delta = data["choices"][0].get("delta", {})
            if "content" in delta:
                print(delta["content"], end="", flush=True)
```

---

## 🔌 OpenAI SDK Usage

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://your-worker.workers.dev/v1",
    api_key="not-needed"  # Required by SDK but ignored by the worker
)

response = client.chat.completions.create(
    model="gemma-4-26b-a4b-it",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

```javascript
// Node.js
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://your-worker.workers.dev/v1",
  apiKey: "not-needed",
});

const response = await client.chat.completions.create({
  model: "gemma-4-26b-a4b-it",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);
```

---

## 🧠 Model Info

| Property | Value |
|---|---|
| Model | Google Gemma 4 26B Instruct |
| Model ID | `@cf/google/gemma-4-26b-a4b-it` |
| Provider | Cloudflare Workers AI |
| Context Window | Large |
| Capabilities | Text generation, reasoning, instruction following |
| Vision | ✅ Supported |
| Function Calling | ✅ Supported |

---

## 💸 Pricing

| Plan | Neurons/day | Cost |
|---|---|---|
| Free | 10,000 | $0 |
| Paid | Unlimited | $0.011 / 1,000 neurons |

> A typical ~500 token response costs roughly 400–600 neurons.

---

## ⚙️ Configuration

To swap the model, edit `worker.js`:

```javascript
const aiModel = '@cf/google/gemma-4-26b-a4b-it'; // Change this
```

Other free models you can use:
- `@cf/meta/llama-3.1-8b-instruct` — Fast, general purpose
- `@cf/meta/llama-3.3-70b-instruct-fp8-fast` — High quality
- `@cf/mistralai/mistral-7b-instruct-v0.2` — 32k context
- `@cf/zai-org/glm-4.7-flash` — Multilingual, tool calling

---

## 📄 License

MIT — free to use, modify, and deploy.

---

<p align="center">Made with ❤️ by <a href="https://ceylonnet.com">Nimesh Piyumal</a></p>
