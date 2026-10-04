import mongoose from 'mongoose';

const taskStepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  title: { type: String, required: true },
  targetFiles: [{ type: String }],
  instructions: { type: String, required: true },
  verificationCriteria: { type: String },
});

const intentTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Allows guest evaluation before login
    },
    rawPrompt: {
      type: String,
      required: [true, 'Please provide developer instructions to compile'],
      trim: true,
    },
    targetAgent: {
      type: String,
      enum: ['claude-code', 'cursor', 'cline', 'codex', 'gemini-cli', 'generic'],
      default: 'claude-code',
    },
    projectRules: [{ type: String }],
    status: {
      type: String,
      enum: ['raw', 'analyzing', 'compiled', 'dispatched'],
      default: 'compiled',
    },
    analysis: {
      primaryIntent: { type: String },
      detectedAmbiguities: [{ type: String }],
      detectedContradictions: [{ type: String }],
      confidenceScore: { type: Number, default: 0.95 },
    },
    structuredPlan: [taskStepSchema],
    compiledAgentPrompt: { type: String },
  },
  {
    timestamps: true,
  }
);

const IntentTask = mongoose.model('IntentTask', intentTaskSchema);

export default IntentTask;
