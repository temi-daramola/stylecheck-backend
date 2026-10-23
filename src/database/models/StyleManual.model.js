import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    ruleId: { type: String, required: true },
    sourceRef: { type: String, default: '' },
    category: { type: String, default: 'content' },
    verifiability: { type: String, enum: ['formatting', 'text', 'both', 'not-verifiable'], default: 'both' },
    ruleName: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

// A newly uploaded manual waiting to be processed while the current one stays in use.
const pendingSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },
    fileSize: { type: Number, required: true, min: 0 },
    uploadDate: { type: Date, default: Date.now },
    // The manual's text can be large: never returned unless explicitly asked for.
    extractedText: { type: String, required: true, select: false },
  },
  { _id: false }
);

const styleManualSchema = new mongoose.Schema(
  {
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supervisor',
      required: true,
      unique: true,
    },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },
    fileSize: { type: Number, required: true, min: 0 },
    uploadDate: { type: Date, default: Date.now },
    // 'uploaded': the text is saved but no rules have been extracted yet. 'ready': rules are available.
    // Manuals saved before states existed already have rules, so they default to 'ready'.
    status: { type: String, enum: ['uploaded', 'ready'], default: 'ready' },
    rules: { type: [ruleSchema], default: [] },
    extractedText: { type: String, select: false },
    pending: { type: pendingSchema, default: null },
  },
  { collection: 'styleManuals', versionKey: false }
);

export const StyleManual = mongoose.model('StyleManual', styleManualSchema);
