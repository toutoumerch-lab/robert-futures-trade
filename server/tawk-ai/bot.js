/**
 * tawk-ai/bot.js
 * ───────────────────────────────────────────────────────────────
 * Tawk.to ↔ OpenAI AI Chatbot Webhook Service
 *
 * Flow:
 *   1. Tawk.to sends a webhook POST when a visitor sends a message
 *   2. This service receives it, enriches it with conversation memory
 *   3. Passes the full conversation to OpenAI chat completion API
 *   4. Sends the AI response back to the tawk.to chat via REST API
 *   5. Falls back to notifying human agent if OpenAI fails
 * ───────────────────────────────────────────────────────────────
 */

require('dotenv').config();

const express    = require('express');
const axios      = require('axios');
const { OpenAI } = require('openai');
const rateLimit  = require('express-rate-limit');
const crypto     = require('crypto');

// ─── Validate required env vars ────────────────────────────────
const REQUIRED_VARS = ['OPENAI_API_KEY', 'TAWK_API_KEY'];
const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length) {
  console.error('[FATAL] Missing env vars:', missing.join(', '));
  console.error('        Copy .env.example → .env and fill in your keys.');
  process.exit(1);
}

// ─── Config ────────────────────────────────────────────────────
const CONFIG = {
  port:           parseInt(process.env.PORT)           || 3500,
  openaiModel:    process.env.OPENAI_MODEL             || 'gpt-4o',
  maxTokens:      parseInt(process.env.OPENAI_MAX_TOKENS) || 400,
  memorySize:     parseInt(process.env.MEMORY_SIZE)    || 10,
  memoryTTL:      parseInt(process.env.MEMORY_TTL_MINUTES) || 60,
  webhookSecret:  process.env.WEBHOOK_SECRET           || '',
  tawkApiKey:     process.env.TAWK_API_KEY,
  systemPrompt:   process.env.SYSTEM_PROMPT            ||
    'You are a helpful support agent. Be concise, friendly, and professional.',
};

// ─── Clients ───────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Tawk.to REST API base (v2)
const tawkAPI = axios.create({
  baseURL: 'https://api.tawk.to/v1',
  auth: {
    username: CONFIG.tawkApiKey,
    password: CONFIG.tawkApiKey, // tawk.to uses the same key for both
  },
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// ─── In-memory conversation store ─────────────────────────────
/**
 * Map<visitorId, { messages: Array, lastActive: Date }>
 * Each message: { role: 'user'|'assistant', content: string }
 */
const memory = new Map();

function getHistory(visitorId) {
  const now = Date.now();
  const entry = memory.get(visitorId);

  // Expire if TTL exceeded
  if (entry) {
    const ageMinutes = (now - entry.lastActive) / 60_000;
    if (ageMinutes > CONFIG.memoryTTL) {
      memory.delete(visitorId);
      console.log(`[memory] Cleared expired session: ${visitorId}`);
      return [];
    }
    return entry.messages;
  }
  return [];
}

function addToHistory(visitorId, role, content) {
  const messages = getHistory(visitorId);
  messages.push({ role, content });

  // Keep only last N messages (sliding window)
  const trimmed = messages.slice(-CONFIG.memorySize);

  memory.set(visitorId, {
    messages: trimmed,
    lastActive: Date.now(),
  });
}

// Periodic cleanup of all expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of memory.entries()) {
    if ((now - entry.lastActive) / 60_000 > CONFIG.memoryTTL) {
      memory.delete(id);
    }
  }
}, 5 * 60_000); // every 5 minutes

// ─── OpenAI helper ─────────────────────────────────────────────
async function getAIReply(visitorId, userMessage) {
  // Add user message to memory first
  addToHistory(visitorId, 'user', userMessage);

  const messages = [
    { role: 'system', content: CONFIG.systemPrompt },
    ...getHistory(visitorId),
  ];

  const response = await openai.chat.completions.create({
    model:       CONFIG.openaiModel,
    messages,
    max_tokens:  CONFIG.maxTokens,
    temperature: 0.65,
  });

  const reply = response.choices[0]?.message?.content?.trim() || '';

  // Store AI reply in memory
  if (reply) addToHistory(visitorId, 'assistant', reply);

  return reply;
}

// ─── Tawk.to helpers ───────────────────────────────────────────
async function sendTawkMessage(chatId, text) {
  try {
    await tawkAPI.post(`/chat/${chatId}/message`, {
      type: 'msg',
      text,
    });
    console.log(`[tawk] Sent reply to chat ${chatId}`);
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data || err.message;
    console.error(`[tawk] Failed to send message (${status}):`, detail);
    throw err;
  }
}

async function transferToHuman(chatId, reason = 'AI failure') {
  try {
    // Send a soft message first
    await sendTawkMessage(
      chatId,
      '⚠️ I\'m having trouble processing your request right now. A human agent will be with you shortly — thank you for your patience!'
    );
    console.log(`[tawk] Transferred chat ${chatId} to human (reason: ${reason})`);
  } catch (err) {
    console.error('[tawk] Transfer to human also failed:', err.message);
  }
}

// ─── Signature verification ────────────────────────────────────
function verifyWebhookSignature(req) {
  if (!CONFIG.webhookSecret) return true; // Skip if no secret configured

  const signature = req.headers['x-tawk-signature'] || req.headers['x-hub-signature-256'] || '';
  const payload   = JSON.stringify(req.body);
  const expected  = 'sha256=' + crypto
    .createHmac('sha256', CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// ─── Express app ───────────────────────────────────────────────
const app = express();

// Parse raw body for signature verification BEFORE json middleware
app.use((req, res, next) => {
  express.json()(req, res, next);
});

// Rate limiter — max 30 webhook hits per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});
app.use('/webhook', limiter);

// ─── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tawk-ai-bot',
    model: CONFIG.openaiModel,
    activeSessions: memory.size,
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// ─── Main webhook endpoint ─────────────────────────────────────
/**
 * POST /webhook/tawk
 *
 * Tawk.to sends events here. We handle:
 *   - chat:msg_create  → new message from visitor
 *   - chat:start       → new conversation started
 *
 * Tawk.to webhook payload (chat:msg_create):
 * {
 *   event: "chat:msg_create",
 *   chatId: "abc123",
 *   message: {
 *     type: "msg",
 *     text: "Hello",
 *     sender: { type: "visitor", id: "vis_xyz" }
 *   }
 * }
 */
app.post('/webhook/tawk', async (req, res) => {
  const body = req.body;

  // Log all incoming events for debugging
  console.log('[webhook] Received event:', JSON.stringify(body, null, 2));

  // Verify signature (if secret is configured)
  if (CONFIG.webhookSecret && !verifyWebhookSignature(req)) {
    console.warn('[webhook] Invalid signature — rejected');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event   = body.event   || body.type;
  const chatId  = body.chatId  || body.id;
  const message = body.message || body.msg;

  // Acknowledge immediately (tawk.to expects fast response)
  res.status(200).json({ received: true });

  // Only process new visitor messages
  if (event !== 'chat:msg_create' && event !== 'new_message') {
    console.log(`[webhook] Skipped event: ${event}`);
    return;
  }

  // Ignore messages from agents (prevent infinite loop)
  const senderType = message?.sender?.type || message?.senderType || '';
  if (senderType !== 'visitor' && senderType !== 'user') {
    console.log(`[webhook] Skipped non-visitor message (sender: ${senderType})`);
    return;
  }

  // Skip non-text messages (files, emoji-only, etc.)
  const userText = (message?.text || message?.body || '').trim();
  if (!userText) {
    console.log('[webhook] Skipped empty message');
    return;
  }

  const visitorId = message?.sender?.id || chatId;

  console.log(`[chat] [${chatId}] Visitor (${visitorId}): "${userText}"`);

  // ── Get AI reply ─────────────────────────────────────────────
  try {
    const aiReply = await getAIReply(visitorId, userText);

    if (!aiReply) {
      throw new Error('OpenAI returned an empty response');
    }

    console.log(`[chat] [${chatId}] AI reply: "${aiReply}"`);
    await sendTawkMessage(chatId, aiReply);

  } catch (err) {
    console.error(`[chat] [${chatId}] AI error:`, err.message);

    // Fallback: transfer to human agent
    await transferToHuman(chatId, err.message);
  }
});

// ─── Debug endpoint — list active sessions ─────────────────────
app.get('/debug/sessions', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  const sessions = [];
  for (const [id, entry] of memory.entries()) {
    sessions.push({
      visitorId: id,
      messageCount: entry.messages.length,
      lastActive: new Date(entry.lastActive).toISOString(),
    });
  }
  res.json({ activeSessions: memory.size, sessions });
});

// ─── Debug endpoint — clear a session ─────────────────────────
app.delete('/debug/sessions/:visitorId', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  const { visitorId } = req.params;
  const existed = memory.has(visitorId);
  memory.delete(visitorId);
  res.json({ cleared: existed, visitorId });
});

// ─── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ──────────────────────────────────────────────
app.listen(CONFIG.port, () => {
  console.log('');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│        Tawk.to ↔ OpenAI Bot             │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  Webhook: http://localhost:${CONFIG.port}/webhook/tawk │`);
  console.log(`│  Health:  http://localhost:${CONFIG.port}/             │`);
  console.log(`│  Model:   ${CONFIG.openaiModel.padEnd(30)} │`);
  console.log(`│  Memory:  ${CONFIG.memorySize} msgs / ${CONFIG.memoryTTL} min TTL          │`);
  console.log('└─────────────────────────────────────────┘');
  console.log('');
  console.log('[bot] Waiting for tawk.to webhook events...');
  console.log('[bot] Run ngrok: ngrok http', CONFIG.port);
  console.log('');
});
