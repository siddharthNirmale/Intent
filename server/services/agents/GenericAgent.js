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

  getOptimizationGuidelines() {
    return `Agent: Universal AI Coding Agent.
Capabilities: Standard LLM-assisted coding workflow.
Structure requirements:
1. Executive Goal: Single sentence defining the expected outcome.
2. Context & Specifications: Functional requirements, dependencies, and architecture.
3. Execution Directives: Clear, numbered step-by-step implementation plan.
4. Constraints: Strict technical boundaries and preservation guardrails.
5. Verification: Concrete verification checks.`;
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

### TECHNICAL SPECIFICATION
${rawPrompt}

### CONSTRAINTS & REQUIREMENTS
${projectRules.map((r) => `- ${r}`).join('\n')}

${plan ? plan + '\n' : ''}`;
  }
}

export default GenericAgent;
