import mongoose from 'mongoose';

const supervisorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Every account can run checks. An admin can additionally manage other accounts.
    role: { type: String, enum: ['supervisor', 'admin'], default: 'supervisor' },
    isActive: { type: Boolean, default: true },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      showScoreOnDashboard: { type: Boolean, default: false },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'supervisors', versionKey: false }
);

export const Supervisor = mongoose.model('Supervisor', supervisorSchema);
