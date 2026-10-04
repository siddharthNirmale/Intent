import BaseAgent from './BaseAgent.js';

export class AntigravityAgent extends BaseAgent {
  constructor() {
    super({
      id: 'antigravity',
      name: 'Antigravity',
      description: 'Optimized for Google DeepMind Antigravity autonomous coding agent.',
      supportedModes: ['build', 'fix'],
    });
  }

  getDirectives(mode) {
    if (mode === 'fix') {
      return [
        'Inspect running workspace files before modifying',
        'Apply atomic, precise edits using file modification tools',
        'Verify fix via browser subagent or command execution',
      ];
    }
    return [
      'Scaffold architecture cleanly adhering to workspace conventions',
      'Maintain premium visual aesthetics and functional correctness',
      'Verify execution end-to-end',
    ];
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
    const directives = this.getDirectives(mode, config);

    let planSection = '';
    if (structuredPlan.length > 0) {
      planSection = `### STRUCTURED EXECUTION PLAN\n` +
        structuredPlan
          .map(
            (step) =>
              `Step ${step.stepNumber}: ${step.title}\n- Scope: ${(step.targetFiles || []).join(', ') || 'Global'}\n- Action: ${step.instructions}\n- Acceptance: ${step.verificationCriteria || 'Self-verified'}`
          )
          .join('\n\n');
    }

    return `### AGENT TARGET: [ANTIGRAVITY]
### WORKFLOW: ${isFix ? 'COMMAND FIX' : 'INITIAL BUILD'}
### PRIMARY GOAL
${primaryIntent}

### CONTEXT & INPUT
${rawPrompt}

### CONSTRAINTS
${projectRules.map((r) => `- ${r}`).join('\n')}

${planSection ? planSection + '\n\n' : ''}### AUTONOMOUS EXECUTION DIRECTIVES
${directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}
`;
  }
}

export default AntigravityAgent;
