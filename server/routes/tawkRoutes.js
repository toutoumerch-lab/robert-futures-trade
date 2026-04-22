/**
 * routes/tawkRoutes.js
 * ────────────────────────────────────────────────────────────────
 * Tawk.to ↔ OpenAI webhook — mounted inside your existing server
 * No separate process needed. Endpoint: POST /webhook/tawk
 * ────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const axios   = require('axios');

// ── Lazy-load openai so the server still boots without the key ──
let openaiClient = null;
function getOpenAI() {
  if (!openaiClient) {
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ── Config (all from existing .env) ────────────────────────────
const CFG = {
  openaiModel:   process.env.OPENAI_MODEL        || 'gpt-4o',
  maxTokens:     parseInt(process.env.OPENAI_MAX_TOKENS) || 400,
  memorySize:    parseInt(process.env.MEMORY_SIZE)       || 10,
  memoryTTL:     parseInt(process.env.MEMORY_TTL_MINUTES)|| 60,
  webhookSecret: process.env.TAWK_WEBHOOK_SECRET  || '',
  tawkApiKey:    process.env.TAWK_API_KEY          || '',
  systemPrompt:  process.env.TAWK_SYSTEM_PROMPT    ||
    `You are a helpful and professional support agent for Robert Trades Futures — 
a premium futures trading education platform. Help users with: course questions, 
account issues, prop firm guidance, and trading concepts. Be concise and friendly. 
If you cannot resolve an issue, say a human agent will follow up shortly.`,
};

// ── Tawk.to REST API client ─────────────────────────────────────
const tawkAPI = axios.create({
  baseURL: 'https://api.tawk.to/v1',
  auth:    { username: CFG.tawkApiKey, password: CFG.tawkApiKey },
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// ── In-memory conversation store ───────────────────────────────
const memory = new Map(); // visitorId → { messages[], lastActive }

function getHistory(visitorId) {
  const entry = memory.get(visitorId);
  if (!entry) return [];
  const ageMin = (Date.now() - entry.lastActive) / 60_000;
  if (ageMin > CFG.memoryTTL) { memory.delete(visitorId); return []; }
  return entry.messages;
}

function appendHistory(visitorId, role, content) {
  const msgs = getHistory(visitorId);
  msgs.push({ role, content });
  memory.set(visitorId, {
    messages:   msgs.slice(-CFG.memorySize),
    lastActive: Date.now(),
  });
}

// Expire stale sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, e] of memory.entries()) {
    if ((now - e.lastActive) / 60_000 > CFG.memoryTTL) memory.delete(id);
  }
}, 5 * 60_000);

// ── Helpers ─────────────────────────────────────────────────────
async function getAIReply(visitorId, userText) {
  appendHistory(visitorId, 'user', userText);
  const messages = [
    { role: 'system', content: CFG.systemPrompt },
    ...getHistory(visitorId),
  ];
  const res = await getOpenAI().chat.completions.create({
    model:       CFG.openaiModel,
    messages,
    max_tokens:  CFG.maxTokens,
    temperature: 0.65,
  });
  const reply = res.choices[0]?.message?.content?.trim() || '';
  if (reply) appendHistory(visitorId, 'assistant', reply);
  return reply;
}

async function sendTawkMessage(chatId, text) {
  await tawkAPI.post(`/chat/${chatId}/message`, { type: 'msg', text });
  console.log(`[tawk-ai] Replied to chat ${chatId}`);
}

async function humanFallback(chatId) {
  try {
    await sendTawkMessage(
      chatId,
      "I'm having trouble right now. A human agent will be with you shortly — thank you for your patience! 🙏"
    );
  } catch (e) {
    console.error('[tawk-ai] Fallback message failed:', e.message);
  }
}

function verifySignature(req) {
  if (!CFG.webhookSecret) return true;
  const sig      = req.headers['x-tawk-signature'] || '';
  const expected = 'sha256=' + crypto
    .createHmac('sha256', CFG.webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch { return false; }
}

// ── Routes ──────────────────────────────────────────────────────

/**
 * POST /webhook/tawk
 * Receives events from tawk.to and replies via OpenAI
 */
router.post('/tawk', async (req, res) => {
  const body = req.body;
  console.log('[tawk-ai] Event received:', body?.event || body?.type);

  if (!verifySignature(req)) {
    console.warn('[tawk-ai] Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Acknowledge immediately — tawk.to needs a fast response
  res.status(200).json({ ok: true });

  const event     = body.event || body.type;
  const chatId    = body.chatId || body.id;
  const message   = body.message || body.msg;
  const sender    = message?.sender;
  const userText  = (message?.text || message?.body || '').trim();
  const visitorId = sender?.id || chatId;

  // Only handle new visitor messages
  if (event !== 'chat:msg_create' && event !== 'new_message') return;
  if (sender?.type !== 'visitor' && sender?.type !== 'user') return;
  if (!userText) return;

  console.log(`[tawk-ai] [${chatId}] Visitor: "${userText}"`);

  try {
    if (!CFG.tawkApiKey) throw new Error('TAWK_API_KEY not configured');
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const reply = await getAIReply(visitorId, userText);
    if (!reply) throw new Error('Empty AI response');

    console.log(`[tawk-ai] [${chatId}] AI: "${reply}"`);
    await sendTawkMessage(chatId, reply);
  } catch (err) {
    console.error(`[tawk-ai] [${chatId}] Error:`, err.message);
    await humanFallback(chatId);
  }
});

/**
 * GET /webhook/status
 * Quick health check — shows if AI is configured
 */
router.get('/status', (req, res) => {
  res.json({
    service:        'tawk-ai-bot',
    openai:         !!process.env.OPENAI_API_KEY,
    tawk:           !!CFG.tawkApiKey,
    model:          CFG.openaiModel,
    activeSessions: memory.size,
  });
});

/**
 * GET /webhook/sessions  (dev only)
 * Lists active conversation sessions
 */
router.get('/sessions', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Unavailable in production' });
  }
  const sessions = [...memory.entries()].map(([id, e]) => ({
    visitorId:    id,
    messages:     e.messages.length,
    lastActive:   new Date(e.lastActive).toISOString(),
  }));
  res.json({ count: memory.size, sessions });
});

module.exports = router;
