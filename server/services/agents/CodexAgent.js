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

  formatPrompt({
    mode,
    primaryIntent,
    rawPrompt,
    projectRules = [],
    structuredPlan = [],
    config = {},
  }) {
    return `# CODEX TASK INSTRUCTION
# Objective: ${primaryIntent}
# Workflow: ${mode.toUpperCase()}

# Rules:
${projectRules.map((r) => `# - ${r}`).join('\n')}

# Target:
${rawPrompt}

# Action Plan:
${structuredPlan.map((s) => `# Step ${s.stepNumber}: ${s.title} -> ${s.instructions}`).join('\n')}
`;
  }
}

export default CodexAgent;
