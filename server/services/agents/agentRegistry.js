import ClaudeCodeAgent from './ClaudeCodeAgent.js';
import AntigravityAgent from './AntigravityAgent.js';
import CursorAgent from './CursorAgent.js';
import CodexAgent from './CodexAgent.js';
import GenericAgent from './GenericAgent.js';

class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.defaultAgentId = 'claude-code';

    // Register built-in agents
    this.registerAgent(new ClaudeCodeAgent());
    this.registerAgent(new AntigravityAgent());
    this.registerAgent(new CursorAgent());
    this.registerAgent(new CodexAgent());
    this.registerAgent(new GenericAgent());
  }

  /**
   * Registers a new AI agent into the platform.
   * Enables seamless integration of future agents.
   * @param {BaseAgent} agent
   */
  registerAgent(agent) {
    if (!agent || !agent.id) {
      throw new Error('Cannot register agent without an id');
    }
    this.agents.set(agent.id.toLowerCase(), agent);
  }

  /**
   * Retrieves an agent by ID, falling back to GenericAgent if not found.
   * @param {string} id
   * @returns {BaseAgent}
   */
  getAgent(id) {
    if (!id || typeof id !== 'string') {
      return this.agents.get(this.defaultAgentId);
    }
    const cleanId = id.toLowerCase().trim();
    if (this.agents.has(cleanId)) {
      return this.agents.get(cleanId);
    }
    return this.agents.get('generic') || this.agents.get(this.defaultAgentId);
  }

  /**
   * Checks if an agent is registered
   * @param {string} id
   * @returns {boolean}
   */
  hasAgent(id) {
    if (!id) return false;
    return this.agents.has(id.toLowerCase().trim());
  }

  /**
   * Returns list of all available agents and metadata for frontend consumption
   * @returns {Array<{ id: string, name: string, description: string, supportedModes: string[] }>}
   */
  listAgents() {
    return Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      supportedModes: agent.supportedModes,
    }));
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();
export default agentRegistry;
