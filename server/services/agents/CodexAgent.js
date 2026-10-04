import BaseAgent from './BaseAgent.js';

export class CodexAgent extends BaseAgent {
  constructor() {
    super({
      id: 'codex',
      name: 'Codex',
      description: 'Optimized for OpenAI Codex and command-line execution runtimes.',
      supportedModes: ['build', 'fix'],
    });
  }

  getOptimizationGuidelines() {
    return `Agent: OpenAI Codex / Programmatic Code Synthesizer.
Capabilities: Code generation model requiring deterministic input/output contracts, concrete signatures, and programmatic constraints.
Structure requirements:
1. Module / Function Contract: Explicit parameters, return types, and schema models.
2. Algorithmic Requirements: Bulleted logic sequence, state transitions, and edge cases.
3. Test Cases: Concrete test assertions verifying correctness.
4. Constraints: Dependency versions, runtime requirements, and zero conversational fluff.`;
  }

  formatPrompt({
    mode,
    primaryIntent,
    rawPrompt,
    refinedCommand,
    projectRules = [],
    structuredPlan = [],
    config = {},
  }) {
    if (refinedCommand && typeof refinedCommand === 'string' && refinedCommand.trim().length > 0) {
      return refinedCommand.trim();
    }

    return `# CODEX TASK INSTRUCTION
# Objective: ${primaryIntent}
# Workflow: ${mode.toUpperCase()}

# Constraints & Rules:
${projectRules.map((r) => `# - ${r}`).join('\n')}

# Specification:
${rawPrompt}

# Action Plan:
${structuredPlan.map((s) => `# Step ${s.stepNumber}: ${s.title} -> ${s.instructions}`).join('\n')}
`;
  }
}

export default CodexAgent;
