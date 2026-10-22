import mongoose from 'mongoose';

const ruleResultSchema = new mongoose.Schema(
  {
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    status: { type: String, enum: ['Passed', 'Failed'], required: true },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const complianceCheckSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    chapter: {
      type: String,
      required: true,
      trim: true,
    },
    documentName: {
      type: String,
      required: true,
    },
    documentSize: {
      type: Number,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['Full Compliance', 'Partial Compliance', 'Non-Compliant'],
      default: 'Partial Compliance',
    },
    passedCount: {
      type: Number,
      required: true,
    },
    failedCount: {
      type: Number,
      required: true,
    },
    totalRules: {
      type: Number,
      required: true,
    },
    rulesBreakdown: [ruleResultSchema],
    checkedAt: {
      type: Date,
      default: Date.now,
    },
    sharedWithEmail: {
      type: String,
      default: null,
    },
    sharedMessage: {
      type: String,
      default: null,
    },
    sharedAt: {
      type: Date,
      default: null,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const ComplianceCheck = mongoose.model('ComplianceCheck', complianceCheckSchema);
