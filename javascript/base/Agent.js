/**
 * Base Agent Class
 * Provides common functionality for all JavaScript agents
 */

class BaseAgent {
  /**
   * Create a new agent
   * @param {Object} config - Configuration options
   * @param {string} name - Agent name (optional)
   */
  constructor(config = {}, name = null) {
    this.name = name || this.constructor.name;
    this.config = config;
    this.state = {};
    this._initialized = false;
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    this.log('info', `Initializing ${this.name}`);
    await this._initialize();
    this._initialized = true;
    this.log('info', `${this.name} initialized successfully`);
  }

  /**
   * Override this method for custom initialization
   */
  async _initialize() {
    // Override in subclass
  }

  /**
   * Main execution method - must be implemented by subclasses
   * @abstract
   */
  async execute(...args) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.log('info', `Cleaning up ${this.name}`);
    await this._cleanup();
    this._initialized = false;
  }

  /**
   * Override this method for custom cleanup
   */
  async _cleanup() {
    // Override in subclass
  }

  /**
   * Get current agent state
   * @returns {Object} Current state
   */
  getState() {
    return {
      name: this.name,
      initialized: this._initialized,
      state: this.state,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Save state to file
   * @param {string} filepath - Path to save state
   */
  async saveState(filepath) {
    const fs = require('fs').promises;
    await fs.writeFile(filepath, JSON.stringify(this.getState(), null, 2));
    this.log('info', `State saved to ${filepath}`);
  }

  /**
   * Load state from file
   * @param {string} filepath - Path to load state from
   */
  async loadState(filepath) {
    const fs = require('fs').promises;
    const data = await fs.readFile(filepath, 'utf8');
    const savedState = JSON.parse(data);
    this.state = savedState.state || {};
    this.log('info', `State loaded from ${filepath}`);
  }

  /**
   * Log a message
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Message to log
   */
  log(level, message) {
    const timestamp = new Date().toISOString();
    const logLevel = this.config.logLevel || 'info';

    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    if (levels[level] <= levels[logLevel]) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `${timestamp} - ${this.name} - ${level.toUpperCase()} - ${message}`
      );
    }
  }

  /**
   * Use agent with automatic cleanup (similar to Python's context manager)
   * @param {Function} callback - Function to execute with agent
   */
  async use(callback) {
    try {
      await this.initialize();
      return await callback(this);
    } finally {
      await this.cleanup();
    }
  }
}

module.exports = BaseAgent;
