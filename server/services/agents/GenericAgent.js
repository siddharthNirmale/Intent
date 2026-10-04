import BaseAgent from './BaseAgent.js';

export class GenericAgent extends BaseAgent {
  constructor() {
    super({
      id: 'generic',
      name: 'Generic Agent',
      description: 'Universal prompt format compatible with any LLM or AI coding assistant.',
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
    let plan = '';
    if (structuredPlan.length > 0) {
      plan = `### EXECUTION PLAN\n` +
        structuredPlan
          .map((s) => `${s.stepNumber}. **${s.title}**: ${s.instructions}`)
          .join('\n');
    }

    return `### TASK OBJECTIVE
${primaryIntent}

### WORKFLOW MODE: ${mode.toUpperCase()}

### SPECIFICATION
${rawPrompt}

### CONSTRAINTS
${projectRules.map((r) => `- ${r}`).join('\n')}

${plan ? plan + '\n' : ''}`;
  }
}

export default GenericAgent;
