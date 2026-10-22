import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor', required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { collection: 'passwordResetTokens', timestamps: true }
);

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
