import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema(
  {
    id: String,
    type: { type: String, default: 'image' },
    name: String,
    size: Number,
    mediaType: String,
    dataUrl: String,
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    attachments: { type: [AttachmentSchema], default: [] },
    createdAt: { type: Number, default: () => Date.now() },
    error: { type: Boolean, default: false },
  },
  { _id: false }
);

const ChatSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    chatId: { type: String, required: true },
    title: { type: String, default: 'New chat' },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

// One chat per (userId, chatId) pair
ChatSchema.index({ userId: 1, chatId: 1 }, { unique: true });
// Fast sorting of a user's chat list
ChatSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('Chat', ChatSchema);