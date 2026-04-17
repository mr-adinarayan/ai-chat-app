import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ Root route (added)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const VALID_MODELS = new Set([
  'claude-haiku-4-5',
  'claude-sonnet-4-6',
  'claude-opus-4-7',
  // Fallbacks for commonly available model IDs
  'claude-3-5-haiku-latest',
  'claude-3-5-sonnet-latest',
  'claude-3-opus-latest',
]);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const selectedModel = VALID_MODELS.has(model) ? model : 'claude-haiku-4-5';

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const cleanedMessages = messages
      .filter((m) => m && m.content && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role, content: m.content }));

    const stream = anthropic.messages.stream({
      model: selectedModel,
      max_tokens: 4096,
      system:
        'You are Claude, a helpful, concise, and friendly AI assistant. Use Markdown formatting where appropriate, including code blocks with language tags.',
      messages: cleanedMessages,
    });

    stream.on('text', (textDelta) => {
      sendEvent('delta', { text: textDelta });
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      sendEvent('error', { message: err?.message || 'Stream error' });
      res.end();
    });

    const finalMessage = await stream.finalMessage();
    sendEvent('done', {
      usage: finalMessage.usage,
      model: finalMessage.model,
    });
    res.end();
  } catch (err) {
    console.error('API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Internal server error' });
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err?.message })}\n\n`);
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});