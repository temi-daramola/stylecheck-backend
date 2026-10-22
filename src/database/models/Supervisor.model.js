import mongoose from 'mongoose';

const supervisorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      showScoreOnDashboard: { type: Boolean, default: false },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'supervisors', versionKey: false }
);

export const Supervisor = mongoose.model('Supervisor', supervisorSchema);
