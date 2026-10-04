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
      default: 'claude-code',
      trim: true,
    },
    compilationSource: {
      type: String,
      enum: ['groq-ai', 'gemini-ai', 'rule-engine'],
      default: 'rule-engine',
    },
    projectRules: [{ type: String }],
    status: {
      type: String,
      enum: ['raw', 'analyzing', 'compiled', 'dispatched'],
      default: 'compiled',
    },
    analysis: {
      primaryIntent: { type: String },
      reasoning: {
        understoodGoal: { type: String },
        missingRequirementsIdentified: [{ type: String }],
        architecturalDecisions: [{ type: String }],
        agentOptimization: { type: String },
      },
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
