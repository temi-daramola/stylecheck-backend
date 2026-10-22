import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    description: { type: String, required: true },
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
    rules: { type: [ruleSchema], default: [] },
  },
  { collection: 'styleManuals', versionKey: false }
);

export const StyleManual = mongoose.model('StyleManual', styleManualSchema);
