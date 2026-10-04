/**
 * Abstract Base Class for AI Coding Agents.
 * Standardizes format, directives, and metadata so new agents
 * can be integrated with minimal effort.
 */
export class BaseAgent {
  constructor({ id, name, description, supportedModes = ['build', 'fix'] }) {
    if (!id || !name) {
      throw new Error('Agent must specify id and name');
    }
    this.id = id;
    this.name = name;
    this.description = description || '';
    this.supportedModes = supportedModes;
  }

  /**
   * Returns agent-specific directives or rules.
   * Can be overridden by subclasses.
   */
  getDirectives(mode, config = {}) {
    return [];
  }

  /**
   * Formats the final compiled prompt for this specific agent's ingestion syntax.
   * Must be implemented by subclasses.
   */
  formatPrompt({
    mode,
    primaryIntent,
    rawPrompt,
    projectRules = [],
    structuredPlan = [],
    config = {},
  }) {
    throw new Error(`formatPrompt() must be implemented by ${this.constructor.name}`);
  }
}

export default BaseAgent;
