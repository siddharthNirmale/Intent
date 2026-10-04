import BaseAgent from './BaseAgent.js';

export class ClaudeCodeAgent extends BaseAgent {
  constructor() {
    super({
      id: 'claude-code',
      name: 'Claude Code',
      description: 'Optimized for Anthropic Claude Code terminal CLI and tool calling.',
      supportedModes: ['build', 'fix'],
    });
  }

  getDirectives(mode) {
    if (mode === 'fix') {
      return [
        'Diagnose the exact failure origin before making edits',
        'Apply surgical, minimal patches without refactoring unrelated files',
        'Verify with direct terminal command and assert exit code 0',
      ];
    }
    return [
      'Scaffold files adhering to modular directory boundaries',
      'Implement cleanly with minimal dependencies',
      'Validate feature end-to-end with real requests',
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
              `${step.stepNumber}. **${step.title}** [${(step.targetFiles || []).join(', ') || 'N/A'}]\n   - Directives: ${step.instructions}\n   - Verification: ${step.verificationCriteria || 'Assert clean exit'}`
          )
          .join('\n');
    }

    return `### AGENT TARGET: [CLAUDE CODE]
### WORKFLOW: ${isFix ? 'COMMAND FIX' : 'INITIAL BUILD'}
### OBJECTIVE
${primaryIntent}

### ${isFix ? 'ERROR / ISSUE SPECIFICATION' : 'SPECIFICATION'}
${rawPrompt}

### ARCHITECTURAL RULES & GUARDRAILS
${projectRules.map((r) => `- ${r}`).join('\n')}

${planSection ? planSection + '\n\n' : ''}### EXECUTION DIRECTIVES
${directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}
`;
  }
}

export default ClaudeCodeAgent;
