import mongoose from 'mongoose';

const ruleResultSchema = new mongoose.Schema(
  {
    checkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplianceCheck',
      required: true,
      index: true,
    },
    ruleId: { type: String, default: '' },
    ruleName: { type: String, required: true },
    sourceRef: { type: String, default: '' },
    status: { type: String, enum: ['Passed', 'Failed', 'Not verifiable'], required: true },
    reasoning: { type: String, default: '' },
  },
  { collection: 'ruleResults', versionKey: false }
);

export const RuleResult = mongoose.model('RuleResult', ruleResultSchema);
