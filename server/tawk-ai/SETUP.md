# Tawk.to ↔ OpenAI AI Chatbot — Setup Guide

## What this does

```
Visitor types in tawk.to chat
        ↓
Tawk.to fires webhook → your bot (port 3500)
        ↓
Bot sends message + history → OpenAI GPT
        ↓
GPT replies → bot sends it back via tawk.to REST API
        ↓
Visitor sees the AI reply in their chat window
```

---

## Step 1 — Create your `.env` file

```bash
cd server/tawk-ai
copy .env.example .env
```

Then open `.env` and fill in:

| Variable | Where to find it |
|---|---|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `TAWK_API_KEY` | tawk.to → Admin → **Account** → **API Access** |
| `WEBHOOK_SECRET` | You create this string — you'll paste it in tawk.to later |
| `SYSTEM_PROMPT` | Customise the AI's personality |

---

## Step 2 — Start the bot

```bash
cd server/tawk-ai
npm start
```

You should see:

```
┌─────────────────────────────────────────┐
│        Tawk.to ↔ OpenAI Bot             │
├─────────────────────────────────────────┤
│  Webhook: http://localhost:3500/webhook/tawk │
│  Health:  http://localhost:3500/             │
└─────────────────────────────────────────┘
```

---

## Step 3 — Expose localhost with ngrok

### Install ngrok (one-time)
Download from https://ngrok.com/download and add to PATH.

### Run ngrok
```bash
ngrok http 3500
```

You'll get a public URL like:
```
Forwarding  https://abc-123-def.ngrok-free.app → http://localhost:3500
```

Copy the `https://...ngrok-free.app` URL — you need it for the next step.

---

## Step 4 — Configure tawk.to Webhook

1. Log in to your tawk.to dashboard → go to your property
2. Navigate to: **Administration → Integrations → Webhooks**
3. Click **Add Webhook**
4. Set:

| Field | Value |
|---|---|
| **Webhook URL** | `https://your-ngrok-url.ngrok-free.app/webhook/tawk` |
| **Secret** | The same value you put in `WEBHOOK_SECRET` in your `.env` |
| **Events** | ✅ `New message` (chat:msg_create) |

5. Click **Save**

---

## Step 5 — Get your tawk.to API Key

1. Go to tawk.to → click your **profile avatar** (top right)
2. Click **Profile** → scroll to **API Access**
3. Click **Generate Token** if you don't have one
4. Copy the token and paste it as `TAWK_API_KEY` in your `.env`
5. **Restart the bot** after updating `.env`

---

## Step 6 — Test it

1. Open your website (where the tawk.to widget is installed)
2. Send a test message in the chat widget
3. Watch the bot terminal — you should see:

```
[webhook] Received event: { event: "chat:msg_create", ... }
[chat] [abc123] Visitor (vis_xyz): "Hello!"
[chat] [abc123] AI reply: "Hi there! How can I help you today?"
[tawk] Sent reply to chat abc123
```

---

## Debug Endpoints (dev only)

| Endpoint | Description |
|---|---|
| `GET /` | Health check — shows uptime, model, active sessions |
| `GET /debug/sessions` | Lists all active conversation sessions |
| `DELETE /debug/sessions/:visitorId` | Clears a specific visitor's history |

---

## Troubleshooting

### Bot starts but tawk.to never sends events
- Check the webhook URL is correct (must be `https://`, not `http://`)
- Check ngrok is running and the URL matches
- Check "New message" event is enabled in tawk.to webhook settings

### 401 Invalid signature error
- Make sure `WEBHOOK_SECRET` in `.env` exactly matches what's in tawk.to dashboard
- Or set `WEBHOOK_SECRET=` (empty) to disable signature checking during testing

### OpenAI errors
- Check your `OPENAI_API_KEY` is correct and has billing enabled
- Watch for `429` (rate limit) or `insufficient_quota` errors in the terminal
- Try `OPENAI_MODEL=gpt-3.5-turbo` for lower cost during testing

### Tawk.to API 401/403
- Regenerate your tawk.to API token and update `.env`
- The bot restarts (Ctrl+C, then `npm start`) after any `.env` change

### AI replies to itself (infinite loop)
- The bot filters out messages where `sender.type !== "visitor"` to prevent loops ✅

---

## Customising the AI Personality

Edit `SYSTEM_PROMPT` in `.env`:

```env
SYSTEM_PROMPT=You are Alex, a friendly support agent for Robert Trades Futures. You specialise in futures trading education, ICT concepts, and prop firm strategies. Keep answers under 3 sentences unless asked for more detail. Never make up information — if unsure, say a human will follow up.
```

---

## Production Notes

- Replace ngrok with a real domain + reverse proxy (nginx/caddy)
- Store conversation memory in Redis instead of in-memory Map
- Add OpenAI streaming for faster perceived responses
- Rate limit per `visitorId` rather than IP for better accuracy
