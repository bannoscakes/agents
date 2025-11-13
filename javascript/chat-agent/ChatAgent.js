/**
 * Chat Agent - LLM-powered conversational agent
 *
 * Features:
 * - Multi-turn conversations
 * - Context management
 * - Message history
 * - System prompts
 */

const BaseAgent = require('../base/Agent');

class ChatAgent extends BaseAgent {
  /**
   * Initialize chat agent
   */
  async _initialize() {
    this.state.messages = [];
    this.state.systemPrompt = this.config.systemPrompt || 'You are a helpful AI assistant.';
    this.state.maxHistory = this.config.maxHistory || 20;

    // Add system message
    if (this.state.systemPrompt) {
      this.state.messages.push({
        role: 'system',
        content: this.state.systemPrompt
      });
    }
  }

  /**
   * Send a message and get a response
   * @param {string} message - User message
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Agent response
   */
  async execute(message, options = {}) {
    if (!this._initialized) {
      await this.initialize();
    }

    // Add user message to history
    this.addMessage('user', message);

    // Generate response
    const response = await this._generateResponse(message, options);

    // Add assistant response to history
    this.addMessage('assistant', response);

    // Trim history if needed
    this._trimHistory();

    return response;
  }

  /**
   * Generate response using LLM provider
   * Override this method to integrate with actual LLM providers
   * @private
   */
  async _generateResponse(message, options) {
    const provider = this.config.provider || 'mock';

    if (provider === 'mock') {
      return `Mock response to: ${message}`;
    }

    // Add your LLM integration here
    // Example for OpenAI:
    // const OpenAI = require('openai');
    // const openai = new OpenAI({ apiKey: this.config.apiKey });
    // const response = await openai.chat.completions.create({
    //   model: this.config.model || 'gpt-4',
    //   messages: this.state.messages
    // });
    // return response.choices[0].message.content;

    throw new Error(`Provider '${provider}' not implemented`);
  }

  /**
   * Add a message to chat history
   * @param {string} role - Message role (user, assistant, system)
   * @param {string} content - Message content
   */
  addMessage(role, content) {
    this.state.messages.push({ role, content });
  }

  /**
   * Trim message history to max length
   * @private
   */
  _trimHistory() {
    const maxHistory = this.state.maxHistory;

    // Always keep system message (index 0)
    if (this.state.messages.length > maxHistory + 1) {
      const systemMsg = this.state.messages[0];
      this.state.messages = [
        systemMsg,
        ...this.state.messages.slice(-(maxHistory))
      ];
    }
  }

  /**
   * Clear chat history (except system message)
   */
  clearHistory() {
    const systemMsg = this.state.messages[0] || null;
    this.state.messages = systemMsg ? [systemMsg] : [];
    this.log('info', 'Chat history cleared');
  }

  /**
   * Get chat history
   * @returns {Array} Message history
   */
  getHistory() {
    return this.state.messages;
  }

  /**
   * Update system prompt
   * @param {string} prompt - New system prompt
   */
  setSystemPrompt(prompt) {
    this.state.systemPrompt = prompt;
    if (this.state.messages.length > 0 && this.state.messages[0].role === 'system') {
      this.state.messages[0].content = prompt;
    } else {
      this.state.messages.unshift({
        role: 'system',
        content: prompt
      });
    }
    this.log('info', 'System prompt updated');
  }
}

module.exports = ChatAgent;

// Example usage
if (require.main === module) {
  (async () => {
    console.log('Chat Agent Example');
    console.log('='.repeat(50));

    const agent = new ChatAgent({
      systemPrompt: 'You are a helpful coding assistant.',
      maxHistory: 10
    });

    await agent.use(async (agent) => {
      const messages = [
        "Hello! Can you help me with JavaScript?",
        "What's the difference between let and const?",
        "Thanks for the help!"
      ];

      for (const msg of messages) {
        console.log(`\nUser: ${msg}`);
        const response = await agent.execute(msg);
        console.log(`Agent: ${response}`);
      }

      console.log('\n' + '='.repeat(50));
      console.log(`Total messages in history: ${agent.getHistory().length}`);
    });
  })();
}
