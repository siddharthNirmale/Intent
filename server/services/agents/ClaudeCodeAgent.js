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
      'Validate feature end-to-end with real requests and automated tests',
    ];
  }

  getOptimizationGuidelines() {
    return `Agent: Anthropic Claude Code (CLI).
Capabilities: Terminal-based agent executing commands, file modifications, git operations, and test runs via bash.
Structure requirements:
1. Directive Objective: Concise, imperative command stating the goal.
2. Target File Paths: Exact relative paths for target files and directories.
3. Execution Tasks: Numbered, dense, actionable steps. Avoid conversational preamble.
4. CLI Verification: Exact bash commands to execute and assert exit code 0.
5. Strict Guardrails: Preservation rules (e.g. do not modify package.json unless required, preserve existing APIs).`;
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
    const directives = this.getDirectives(mode, config);

    let planSection = '';
    if (structuredPlan.length > 0) {
      planSection = `### STRUCTURED EXECUTION PLAN\n` +
        structuredPlan
          .map(
            (step) =>
              `${step.stepNumber}. **${step.title}** [${(step.targetFiles || []).join(', ') || 'N/A'}]\n   - Directives: ${step.instructions}\n   - Verification: ${step.verificationCriteria || 'Assert clean exit code 0'}`
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
