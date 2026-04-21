import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    anthropicApiKeyEncrypted: { type: String, default: '' },
    keyPreview: { type: String, default: '' }, // e.g. "••••••••abcd"
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);