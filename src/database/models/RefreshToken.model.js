import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  { timestamps: true }
);

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
