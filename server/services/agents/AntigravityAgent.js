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
        'Inspect running workspace files and active process states before modifying',
        'Apply atomic, precise edits using file modification tools without rewriting whole files',
        'Verify fix via terminal commands and assert zero regression',
      ];
    }
    return [
      'Inspect existing directory boundaries and workspace conventions first',
      'Scaffold modular architecture adhering strictly to specified tech stack and design tokens',
      'Provide production-ready implementation with zero placeholders or incomplete stubs',
      'Verify execution end-to-end using terminal commands or browser testing',
    ];
  }

  getOptimizationGuidelines() {
    return `Agent: Google DeepMind Antigravity.
Capabilities: Autonomous agent with tools for workspace inspection, atomic multi-file replacement, terminal execution, browser subagents, and media generation.
Structure requirements:
1. Executive Goal: State the exact target deliverable in unambiguous terms.
2. Architecture & File Targets: Explicitly specify target files, module boundaries, and folder structure.
3. Implementation Directives: Clear, step-by-step instructions. Instruct Antigravity to inspect files first, perform atomic edits, and never use placeholders.
4. Technical Constraints: Strict technology stack, libraries, and design rules.
5. Autonomous Verification: Provide concrete shell commands (e.g. tests, lint, dev check) or browser checks with expected exit code 0 or observable outcomes.`;
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
              `Step ${step.stepNumber}: ${step.title}\n- Scope: ${(step.targetFiles || []).join(', ') || 'Workspace'}\n- Action: ${step.instructions}\n- Acceptance: ${step.verificationCriteria || 'Assert clean exit'}`
          )
          .join('\n\n');
    }

    return `### AGENT TARGET: [ANTIGRAVITY]
### WORKFLOW: ${isFix ? 'COMMAND FIX' : 'INITIAL BUILD'}
### PRIMARY OBJECTIVE
${primaryIntent}

### REFINED TECHNICAL SPECIFICATION
${rawPrompt}

### CONSTRAINTS & REQUIREMENTS
${projectRules.map((r) => `- ${r}`).join('\n')}

${planSection ? planSection + '\n\n' : ''}### AUTONOMOUS EXECUTION DIRECTIVES
${directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}
`;
  }
}

export default AntigravityAgent;
