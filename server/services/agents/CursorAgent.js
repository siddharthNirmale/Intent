import BaseAgent from './BaseAgent.js';

export class CursorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'cursor',
      name: 'Cursor',
      description: 'Optimized for Cursor AI editor context and .cursorrules rulesets.',
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
    const isFix = mode === 'fix';

    let steps = '';
    if (structuredPlan.length > 0) {
      steps = `// Execution Steps:\n` +
        structuredPlan
          .map((s) => `// ${s.stepNumber}. [${s.title}] (${(s.targetFiles || []).join(', ') || 'Editor'}) -> ${s.instructions}`)
          .join('\n');
    }

    return `/* Cursor Rules & Prompt */
/* Objective: ${primaryIntent} */
/* Mode: ${isFix ? 'FIX' : 'BUILD'} */

/* Guardrails */
${projectRules.map((r) => `// - ${r}`).join('\n')}

${steps ? steps + '\n\n' : ''}/* User Input */
${rawPrompt}
`;
  }
}

export default CursorAgent;
