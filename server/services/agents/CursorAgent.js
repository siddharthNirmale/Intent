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

  getOptimizationGuidelines() {
    return `Agent: Cursor AI (Composer & Chat).
Capabilities: IDE AI with Composer (Cmd+I) and Chat (Cmd+L) applying multi-file edits directly into the editor.
Structure requirements:
1. Context References: Use @filename syntax to specify context files.
2. Surgical Diff Focus: Specify exact function, component, or line targets. Instruct Cursor to make surgical diffs and keep surrounding code, comments, and imports intact.
3. Contracts & Signatures: Include clear type signatures (TypeScript / JSDoc) and props interfaces.
4. Diff Constraints: Instruct Cursor to preserve working code and avoid replacing entire files when modifying a function.`;
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

    const isFix = mode === 'fix';

    let steps = '';
    if (structuredPlan.length > 0) {
      steps = `// Execution Steps:\n` +
        structuredPlan
          .map((s) => `// ${s.stepNumber}. [${s.title}] (${(s.targetFiles || []).join(', ') || '@workspace'}) -> ${s.instructions}`)
          .join('\n');
    }

    return `/* Cursor Rules & Execution Prompt */
/* Objective: ${primaryIntent} */
/* Mode: ${isFix ? 'FIX' : 'BUILD'} */

/* Guardrails & Constraints */
${projectRules.map((r) => `// - ${r}`).join('\n')}

${steps ? steps + '\n\n' : ''}/* Implementation Specification */
${rawPrompt}
`;
  }
}

export default CursorAgent;
