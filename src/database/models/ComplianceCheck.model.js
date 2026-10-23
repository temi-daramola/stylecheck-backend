import mongoose from 'mongoose';

// The score fields only exist once the analysis has finished.
const requiredWhenCompleted = function requiredWhenCompleted() {
  return this.status !== 'pending';
};

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
    // 'pending': the document was read but the AI analysis has not succeeded yet.
    // Checks saved before states existed are complete, so they default to 'completed'.
    status: { type: String, enum: ['pending', 'completed'], default: 'completed', index: true },
    complianceScore: { type: Number, required: requiredWhenCompleted, min: 0, max: 100 },
    complianceBand: {
      type: String,
      enum: ['Full Compliance', 'Partial Compliance', 'Non-Compliant'],
      required: requiredWhenCompleted,
    },
    rulesPassed: { type: Number, required: requiredWhenCompleted, min: 0 },
    rulesFailed: { type: Number, required: requiredWhenCompleted, min: 0 },
    // Rules the document could not show (excluded from the score). Older checks had none.
    rulesNotVerifiable: { type: Number, default: 0, min: 0 },
    checkDate: { type: Date, default: Date.now },
    sharedWithStudent: { type: Boolean, default: false },
    studentEmail: { type: String, default: null },
    // What a retry needs: the student's text and formatting, kept only while pending and never returned
    // to clients. Removed on completion, and a pending check expires on its own (TTL).
    pendingInput: {
      type: new mongoose.Schema(
        {
          documentText: { type: String, required: true },
          formattingProfile: { type: mongoose.Schema.Types.Mixed, required: true },
        },
        { _id: false }
      ),
      select: false,
    },
    pendingExpiresAt: { type: Date, index: { expires: 0 } },
  },
  { collection: 'complianceChecks', versionKey: false }
);

export const ComplianceCheck = mongoose.model('ComplianceCheck', complianceCheckSchema);
