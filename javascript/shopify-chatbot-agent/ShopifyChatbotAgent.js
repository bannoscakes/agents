/**
 * Shopify Chatbot Agent - AI customer support for Shopify stores
 *
 * Features:
 * - Product inquiries
 * - Order tracking
 * - Shipping information
 * - Returns and refunds
 * - Smart escalation to human support
 */

const BaseAgent = require('../base/Agent');

class ShopifyChatbotAgent extends BaseAgent {
  /**
   * Initialize Shopify chatbot agent
   */
  async _initialize() {
    // Shopify configuration
    this.state.shopifyStoreUrl = this.config.shopifyStoreUrl || '';
    this.state.shopifyAccessToken = this.config.shopifyAccessToken || process.env.SHOPIFY_ACCESS_TOKEN;
    this.state.shopifyApiVersion = this.config.shopifyApiVersion || '2024-01';

    // Store information
    this.state.storeName = this.config.storeName || 'Our Store';
    this.state.brandVoice = this.config.brandVoice || 'friendly and helpful';
    this.state.storePolicies = this.config.storePolicies || {};

    // LLM configuration
    this.state.llmProvider = this.config.llmProvider || 'anthropic';
    this.state.llmApiKey = this.config.llmApiKey || process.env.LLM_API_KEY;
    this.state.model = this.config.model || 'claude-3-5-sonnet-20241022';

    // Chatbot settings
    this.state.maxHistory = this.config.maxHistory || 10;
    this.state.enableEscalation = this.config.enableEscalation !== false;
    this.state.escalationKeywords = this.config.escalationKeywords || [
      'speak to human', 'talk to person', 'representative', 'manager'
    ];

    // Conversation state
    this.state.messages = [];
    this.state.customerInfo = {};

    // Initialize clients
    await this._initLLM();
    await this._initShopify();
    this._buildSystemPrompt();
  }

  /**
   * Initialize LLM client
   * @private
   */
  async _initLLM() {
    const provider = this.state.llmProvider;

    if (provider === 'anthropic') {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        this.state.llmClient = new Anthropic({ apiKey: this.state.llmApiKey });
        this.log('info', 'Anthropic client initialized');
      } catch (error) {
        this.log('warn', 'Anthropic SDK not installed. Install with: npm install @anthropic-ai/sdk');
      }
    } else if (provider === 'openai') {
      try {
        const OpenAI = require('openai');
        this.state.llmClient = new OpenAI({ apiKey: this.state.llmApiKey });
        this.log('info', 'OpenAI client initialized');
      } catch (error) {
        this.log('warn', 'OpenAI SDK not installed. Install with: npm install openai');
      }
    }
  }

  /**
   * Initialize Shopify client
   * @private
   */
  async _initShopify() {
    if (this.state.shopifyStoreUrl && this.state.shopifyAccessToken) {
      try {
        const Shopify = require('shopify-api-node');
        this.state.shopifyClient = new Shopify({
          shopName: this.state.shopifyStoreUrl.replace('.myshopify.com', ''),
          accessToken: this.state.shopifyAccessToken,
          apiVersion: this.state.shopifyApiVersion
        });
        this.log('info', 'Shopify client initialized');
      } catch (error) {
        this.log('warn', 'Shopify SDK not installed. Install with: npm install shopify-api-node');
      }
    } else {
      this.log('info', 'Shopify credentials not provided - using mock mode');
    }
  }

  /**
   * Build system prompt
   * @private
   */
  _buildSystemPrompt() {
    const { storeName, brandVoice, storePolicies } = this.state;

    let policyText = '';
    if (Object.keys(storePolicies).length > 0) {
      policyText = '\n\nSTORE POLICIES:\n';
      for (const [key, value] of Object.entries(storePolicies)) {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        policyText += `- ${formattedKey}: ${value}\n`;
      }
    }

    const systemPrompt = `You are a customer support assistant for ${storeName}.

Your personality is ${brandVoice}. Your goal is to help customers with their questions and concerns.

You can help with:
- Product information and recommendations
- Order status and tracking
- Shipping information
- Returns and refunds
- Store policies
- General inquiries

${policyText}

IMPORTANT GUIDELINES:
1. Be helpful, patient, and understanding
2. If you don't know something, admit it and offer to escalate to a human
3. Always prioritize customer satisfaction
4. Keep responses concise and clear
5. Use the customer's name if provided
6. If asked about specific orders, products, or accounts, use the provided context
7. For complex issues or angry customers, offer to escalate to human support

When you need to escalate to human support, respond with:
"I understand this requires personal attention. Let me connect you with our support team who can better assist you."

Remember: You represent ${storeName} - make every interaction count!`;

    this.state.systemPrompt = systemPrompt;
    this.state.messages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  /**
   * Process customer message
   * @param {string} message - Customer message
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Bot response
   */
  async execute(message, options = {}) {
    if (!this._initialized) {
      await this.initialize();
    }

    const { customerEmail, customerName } = options;

    // Store customer info
    if (customerEmail) this.state.customerInfo.email = customerEmail;
    if (customerName) this.state.customerInfo.name = customerName;

    // Check for escalation
    if (this._shouldEscalate(message)) {
      return this._escalateToHuman();
    }

    // Detect intent
    const intent = this._detectIntent(message);
    this.log('info', `Detected intent: ${intent}`);

    // Gather context
    const context = await this._gatherContext(message, intent, customerEmail);

    // Generate response
    const response = await this._generateResponse(message, context);

    return response;
  }

  /**
   * Check if should escalate
   * @private
   */
  _shouldEscalate(message) {
    if (!this.state.enableEscalation) return false;

    const messageLower = message.toLowerCase();
    return this.state.escalationKeywords.some(keyword =>
      messageLower.includes(keyword)
    );
  }

  /**
   * Escalate to human
   * @private
   */
  _escalateToHuman() {
    const { storePolicies } = this.state;
    const supportEmail = storePolicies.support_email || 'support@store.com';
    const supportPhone = storePolicies.support_phone || '';

    let response = "I understand this requires personal attention. Let me connect you with our support team.\n\n";
    response += `You can reach our team at:\n`;
    response += `- Email: ${supportEmail}\n`;

    if (supportPhone) {
      response += `- Phone: ${supportPhone}\n`;
    }

    response += "\nThey'll be happy to help you with your request!";

    return response;
  }

  /**
   * Detect customer intent
   * @private
   */
  _detectIntent(message) {
    const messageLower = message.toLowerCase();

    if (/order|tracking|where is|shipped|delivery/.test(messageLower)) {
      return 'order_tracking';
    }

    if (/product|item|available|stock|price|cost/.test(messageLower)) {
      return 'product_inquiry';
    }

    if (/return|refund|exchange|cancel/.test(messageLower)) {
      return 'returns_refunds';
    }

    if (/shipping|delivery time|ship to|shipping cost/.test(messageLower)) {
      return 'shipping_inquiry';
    }

    return 'general_inquiry';
  }

  /**
   * Gather context for response
   * @private
   */
  async _gatherContext(message, intent, customerEmail) {
    let context = '';

    const orderNumber = this._extractOrderNumber(message);

    if (intent === 'order_tracking' && orderNumber) {
      const orderInfo = await this._getOrderInfo(orderNumber, customerEmail);
      if (orderInfo) {
        context += `\n\nORDER INFORMATION:\n${orderInfo}`;
      }
    }

    if (intent === 'product_inquiry') {
      const keywords = this._extractProductKeywords(message);
      if (keywords) {
        const productInfo = await this._searchProducts(keywords);
        if (productInfo) {
          context += `\n\nPRODUCT INFORMATION:\n${productInfo}`;
        }
      }
    }

    // Add relevant policies
    if (intent === 'returns_refunds' && this.state.storePolicies.returns) {
      context += `\n\nRETURN POLICY:\n${this.state.storePolicies.returns}`;
    }

    if (intent === 'shipping_inquiry' && this.state.storePolicies.shipping) {
      context += `\n\nSHIPPING POLICY:\n${this.state.storePolicies.shipping}`;
    }

    return context;
  }

  /**
   * Extract order number from message
   * @private
   */
  _extractOrderNumber(message) {
    const patterns = [
      /#(\d+)/,
      /order\s+(\d+)/i,
      /order\s+#(\d+)/i,
      /number\s+(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Extract product keywords
   * @private
   */
  _extractProductKeywords(message) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'you', 'have', 'what', 'about']);
    const words = message.toLowerCase().split(/\s+/);
    const keywords = words.filter(w => !stopWords.has(w) && w.length > 3);
    return keywords.slice(0, 5).join(' ');
  }

  /**
   * Get order information from Shopify
   * @private
   */
  async _getOrderInfo(orderNumber, customerEmail) {
    if (!this.state.shopifyClient) {
      return `Order #${orderNumber} (Mock data: Your order is being processed)`;
    }

    try {
      const order = await this.state.shopifyClient.order.get(orderNumber);

      let info = `Order #${order.order_number}\n`;
      info += `Status: ${order.financial_status} / ${order.fulfillment_status || 'Unfulfilled'}\n`;

      if (order.fulfillments && order.fulfillments.length > 0) {
        const fulfillment = order.fulfillments[0];
        info += `Tracking: ${fulfillment.tracking_number || 'Not available yet'}\n`;
        if (fulfillment.tracking_url) {
          info += `Track at: ${fulfillment.tracking_url}\n`;
        }
      }

      info += `Total: $${order.total_price} ${order.currency}\n`;

      return info;
    } catch (error) {
      this.log('error', `Error fetching order: ${error.message}`);
      return null;
    }
  }

  /**
   * Search products
   * @private
   */
  async _searchProducts(keywords) {
    if (!this.state.shopifyClient) {
      return `Product search results for '${keywords}' (Mock data)`;
    }

    try {
      const products = await this.state.shopifyClient.product.list({ limit: 3 });

      if (products.length > 0) {
        let info = '';
        for (const product of products.slice(0, 3)) {
          info += `\n- ${product.title}\n`;
          if (product.variants && product.variants.length > 0) {
            const variant = product.variants[0];
            info += `  Price: $${variant.price}\n`;
            info += `  Available: ${variant.inventory_quantity > 0 ? 'Yes' : 'No'}\n`;
          }
        }
        return info;
      }
    } catch (error) {
      this.log('error', `Error searching products: ${error.message}`);
    }

    return null;
  }

  /**
   * Generate response using LLM
   * @private
   */
  async _generateResponse(message, context = '') {
    // Add user message
    let userMessage = message;
    if (context) {
      userMessage = `${message}\n\n[Context: ${context}]`;
    }

    this.state.messages.push({
      role: 'user',
      content: userMessage
    });

    let responseText;

    if (!this.state.llmClient) {
      responseText = `I'd be happy to help you with: ${message}\n\n${context}`;
    } else {
      try {
        const provider = this.state.llmProvider;

        if (provider === 'anthropic') {
          const client = this.state.llmClient;

          const systemMsg = this.state.systemPrompt;
          const conversation = this.state.messages.filter(m => m.role !== 'system');

          const response = await client.messages.create({
            model: this.state.model,
            max_tokens: 512,
            system: systemMsg,
            messages: conversation
          });

          responseText = response.content[0].text;
        } else if (provider === 'openai') {
          const client = this.state.llmClient;

          const response = await client.chat.completions.create({
            model: this.state.model || 'gpt-4',
            messages: this.state.messages,
            max_tokens: 512
          });

          responseText = response.choices[0].message.content;
        }
      } catch (error) {
        this.log('error', `LLM error: ${error.message}`);
        responseText = "I apologize, but I'm having trouble processing that. Could you please rephrase?";
      }
    }

    // Add response to history
    this.state.messages.push({
      role: 'assistant',
      content: responseText
    });

    // Trim history
    this._trimHistory();

    return responseText;
  }

  /**
   * Trim message history
   * @private
   */
  _trimHistory() {
    const maxHistory = this.state.maxHistory;

    if (this.state.messages.length > maxHistory + 1) {
      const systemMsg = this.state.messages[0];
      this.state.messages = [systemMsg, ...this.state.messages.slice(-(maxHistory))];
    }
  }

  /**
   * Get conversation history
   * @returns {Array} Message history
   */
  getConversationHistory() {
    return this.state.messages;
  }

  /**
   * Reset conversation
   */
  resetConversation() {
    this.state.messages = [this.state.messages[0]]; // Keep system message
    this.state.customerInfo = {};
    this.log('info', 'Conversation reset');
  }
}

module.exports = ShopifyChatbotAgent;

// Example usage
if (require.main === module) {
  (async () => {
    console.log('Shopify Chatbot Agent Example');
    console.log('='.repeat(60));

    const agent = new ShopifyChatbotAgent({
      storeName: 'Awesome Bakery',
      brandVoice: 'warm, friendly, and helpful like a neighborhood baker',
      storePolicies: {
        shipping: 'Free shipping on orders over $50. Standard delivery 3-5 business days.',
        returns: '30-day return policy for unused items in original packaging',
        support_email: 'support@awesomebakery.com',
        support_phone: '1-800-BAKERY1'
      }
    });

    await agent.use(async (agent) => {
      console.log('\n1. General inquiry:');
      let response = await agent.execute("What's your return policy?");
      console.log(`   Customer: What's your return policy?`);
      console.log(`   Bot: ${response}\n`);

      console.log('2. Order tracking:');
      response = await agent.execute("Where is my order #12345?");
      console.log(`   Customer: Where is my order #12345?`);
      console.log(`   Bot: ${response}\n`);

      console.log('3. Escalation:');
      response = await agent.execute("I need to speak to a human");
      console.log(`   Customer: I need to speak to a human`);
      console.log(`   Bot: ${response}\n`);
    });
  })();
}
