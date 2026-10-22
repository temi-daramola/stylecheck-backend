import mongoose from 'mongoose';

const complianceCheckSchema = new mongoose.Schema(
  {
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supervisor',
      required: true,
      index: true,
    },
    studentName: { type: String, required: true, trim: true },
    chapterSection: { type: String, required: true, trim: true },
    documentFileName: { type: String, required: true },
    complianceScore: { type: Number, required: true, min: 0, max: 100 },
    complianceBand: {
      type: String,
      enum: ['Full Compliance', 'Partial Compliance', 'Non-Compliant'],
      required: true,
    },
    rulesPassed: { type: Number, required: true, min: 0 },
    rulesFailed: { type: Number, required: true, min: 0 },
    checkDate: { type: Date, default: Date.now },
    sharedWithStudent: { type: Boolean, default: false },
    studentEmail: { type: String, default: null },
  },
  { collection: 'complianceChecks', versionKey: false }
);

export const ComplianceCheck = mongoose.model('ComplianceCheck', complianceCheckSchema);
