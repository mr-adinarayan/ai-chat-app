import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

import Chat from './models/Chat.js';
import User from './models/User.js';
import { encrypt, decrypt, maskKey } from './utils/crypto.js';

dotenv.config();

// ───────────────────────────────────────────────
// Env validation
// ───────────────────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'CLERK_SECRET_KEY', 'ENCRYPTION_KEY'];
for (const k of REQUIRED_ENV) {
  if (!process.env[k]) {
    console.error(`❌ FATAL: ${k} is missing from .env`);
    process.exit(1);
  }
}
if (process.env.ENCRYPTION_KEY.length !== 64) {
  console.error('❌ FATAL: ENCRYPTION_KEY must be 64 hex chars (32 bytes).');
  process.exit(1);
}

// ───────────────────────────────────────────────
// Mongo
// ───────────────────────────────────────────────
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ MongoDB connected');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const requireAuth = ClerkExpressRequireAuth();

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

// ───────────────────────────────────────────────
// Models / constants
// ───────────────────────────────────────────────
const VALID_MODELS = new Set([
  'claude-haiku-4-5',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
  'claude-3-5-haiku-latest',
  'claude-3-5-sonnet-latest',
  'claude-3-opus-latest',
]);

const VALID_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// Turn a frontend message into an Anthropic content payload.
// Supports plain text, embedded document text, and base64 images.
function buildApiMessage(msg) {
  const hasImages =
    Array.isArray(msg.attachments) && msg.attachments.length > 0;

  // Combine typed text + extracted document text (if any)
  let textContent = msg.content || '';
  if (Array.isArray(msg.documents) && msg.documents.length > 0) {
    const docBlocks = msg.documents
      .filter((d) => d && typeof d.text === 'string' && d.text.trim())
      .map(
        (d) => `[Document: ${d.name || 'file'}]\n${d.text}\n[End Document]`
      )
      .join('\n\n');
    textContent = docBlocks
      ? textContent
        ? `${docBlocks}\n\n${textContent}`
        : docBlocks
      : textContent;
  }

  if (!hasImages) {
    return { role: msg.role, content: textContent };
  }

  const blocks = [];
  for (const att of msg.attachments) {
    if (att?.kind && att.kind !== 'image') continue;
    if (typeof att?.dataUrl !== 'string') continue;
    const m = att.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) continue;
    const [, mediaType, data] = m;
    if (!VALID_IMAGE_MIMES.has(mediaType)) continue;
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data },
    });
  }
  if (textContent.trim()) {
    blocks.push({ type: 'text', text: textContent });
  }
  if (blocks.length === 0) {
    blocks.push({ type: 'text', text: textContent || '' });
  }
  return { role: msg.role, content: blocks };
}

// ───────────────────────────────────────────────
// Health
// ───────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// ───────────────────────────────────────────────
// User settings (API key)
// ───────────────────────────────────────────────
app.get('/api/user/settings', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ userId });
    res.json({
      hasApiKey: !!user?.anthropicApiKeyEncrypted,
      keyPreview: user?.keyPreview || '',
    });
  } catch (err) {
    console.error('[GET /user/settings]', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/user/settings', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { anthropicApiKey } = req.body || {};

    if (typeof anthropicApiKey !== 'string') {
      return res.status(400).json({ error: 'Invalid API key payload' });
    }

    const trimmed = anthropicApiKey.trim();

    // Empty → clear
    if (trimmed === '') {
      await User.findOneAndUpdate(
        { userId },
        { anthropicApiKeyEncrypted: '', keyPreview: '' },
        { upsert: true, new: true }
      );
      return res.json({ hasApiKey: false, keyPreview: '' });
    }

    if (!trimmed.startsWith('sk-ant-')) {
      return res
        .status(400)
        .json({ error: 'Invalid Anthropic API key format (must start with sk-ant-).' });
    }

    await User.findOneAndUpdate(
      { userId },
      {
        anthropicApiKeyEncrypted: encrypt(trimmed),
        keyPreview: maskKey(trimmed),
      },
      { upsert: true, new: true }
    );

    res.json({ hasApiKey: true, keyPreview: maskKey(trimmed) });
  } catch (err) {
    console.error('[POST /user/settings]', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ───────────────────────────────────────────────
// Chats CRUD  (unchanged from Phase 3)
// ───────────────────────────────────────────────
app.get('/api/chats', apiLimiter, requireAuth, async (req, res) => {
  const { userId } = req.auth;
  const chats = await Chat.find({ userId })
    .sort({ updatedAt: -1 })
    .select('chatId title updatedAt');
  res.json({ chats });
});

app.get('/api/chats/:chatId', apiLimiter, requireAuth, async (req, res) => {
  const { userId } = req.auth;
  const chat = await Chat.findOne({ userId, chatId: req.params.chatId });
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json({ chat });
});

app.patch('/api/chats/:chatId', apiLimiter, requireAuth, async (req, res) => {
  const { userId } = req.auth;
  const { title } = req.body;
  await Chat.findOneAndUpdate(
    { userId, chatId: req.params.chatId },
    { title: String(title || '').slice(0, 120) }
  );
  res.json({ ok: true });
});

app.delete('/api/chats/:chatId', apiLimiter, requireAuth, async (req, res) => {
  const { userId } = req.auth;
  await Chat.deleteOne({ userId, chatId: req.params.chatId });
  res.json({ ok: true });
});

// ───────────────────────────────────────────────
// Streaming /api/chat  (dynamic BYOK Anthropic client)
// ───────────────────────────────────────────────
app.post('/api/chat', chatLimiter, requireAuth, async (req, res) => {
  try {
    const { userId } = req.auth;
    const { messages, model, system, chatId, title } = req.body;

    // ---- Fetch user's API key
    const user = await User.findOne({ userId });
    if (!user?.anthropicApiKeyEncrypted) {
      return res
        .status(400)
        .json({ error: 'NO_API_KEY', message: 'Add your Anthropic API key in Settings.' });
    }

    let apiKey;
    try {
      apiKey = decrypt(user.anthropicApiKeyEncrypted);
    } catch (err) {
      console.error('[decrypt]', err);
      return res.status(500).json({
        error: 'DECRYPT_FAILED',
        message: 'Failed to decrypt API key — please re-save it in Settings.',
      });
    }
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: 'NO_API_KEY', message: 'Add your Anthropic API key in Settings.' });
    }

    // ---- Validate
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }
    const selectedModel = VALID_MODELS.has(model) ? model : 'claude-haiku-4-5';
    const systemPrompt =
      typeof system === 'string' && system.trim()
        ? system.trim()
        : 'You are Claude, a helpful, concise AI assistant. Use Markdown formatting including code blocks with language tags where appropriate.';

    const apiMessages = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .map(buildApiMessage)
      .filter((m) =>
        typeof m.content === 'string'
          ? m.content.length > 0
          : Array.isArray(m.content) && m.content.length > 0
      );

    if (apiMessages.length === 0) {
      return res.status(400).json({ error: 'No valid messages to send.' });
    }

    // ---- Init Anthropic per-user
    const anthropic = new Anthropic({ apiKey });

    // ---- SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const stream = anthropic.messages.stream({
      model: selectedModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
    });

    let fullText = '';
    stream.on('text', (delta) => {
      fullText += delta;
      sendEvent('delta', { text: delta });
    });
    stream.on('error', (err) => {
      console.error('[Stream error]', err);
      sendEvent('error', { message: err?.message || 'Stream error' });
      res.end();
    });

    req.on('close', () => {
      try {
        stream.controller?.abort?.();
      } catch {}
    });

    const finalMessage = await stream.finalMessage();

    // ---- Persist to MongoDB (mirror the client-side history)
    if (chatId && typeof chatId === 'string') {
      try {
        const assistantMsg = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          role: 'assistant',
          content: fullText,
          createdAt: new Date(),
        };
        await Chat.findOneAndUpdate(
          { userId, chatId },
          {
            userId,
            chatId,
            title:
              (title && String(title).slice(0, 120)) ||
              (messages[0]?.content?.slice(0, 50) || 'New chat'),
            messages: [...messages, assistantMsg],
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('[save chat]', err);
      }
    }

    sendEvent('done', { usage: finalMessage.usage, model: finalMessage.model });
    res.end();
  } catch (err) {
    console.error('[/api/chat]', err);
    const status = typeof err?.status === 'number' ? err.status : 500;
    const message =
      err?.error?.error?.message || err?.message || 'Unexpected server error.';
    if (!res.headersSent) {
      return res.status(status).json({ error: 'ANTHROPIC_ERROR', message });
    }
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    } catch {}
    res.end();
  }
});

// ───────────────────────────────────────────────
// Clerk / fallback error handler
// ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err?.status === 401 || err?.message?.includes('Unauthenticated')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.error('[error]', err);
  res.status(err?.status || 500).json({ error: err?.message || 'Server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));