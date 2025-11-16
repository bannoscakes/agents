/**
 * Shopify Chatbot Agent - TypeScript/Supabase Implementation
 *
 * Deploy as Supabase Edge Function for serverless Shopify chatbot
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

interface ShopifyChatbotConfig {
  shopifyStoreUrl?: string;
  shopifyAccessToken?: string;
  shopifyApiVersion?: string;
  storeName?: string;
  brandVoice?: string;
  storePolicies?: Record<string, string>;
  llmProvider?: 'anthropic' | 'openai';
  llmApiKey?: string;
  model?: string;
  maxHistory?: number;
  enableEscalation?: boolean;
  escalationKeywords?: string[];
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  conversationId?: string;
  shouldEscalate?: boolean;
}

export class ShopifyChatbotAgent {
  private config: Required<ShopifyChatbotConfig>;
  private llmClient: Anthropic | null = null;
  private messages: Message[] = [];
  private customerInfo: Record<string, string> = {};

  constructor(config: ShopifyChatbotConfig = {}) {
    this.config = {
      shopifyStoreUrl: config.shopifyStoreUrl || '',
      shopifyAccessToken: config.shopifyAccessToken || Deno.env.get('SHOPIFY_ACCESS_TOKEN') || '',
      shopifyApiVersion: config.shopifyApiVersion || '2024-01',
      storeName: config.storeName || 'Our Store',
      brandVoice: config.brandVoice || 'friendly and helpful',
      storePolicies: config.storePolicies || {},
      llmProvider: config.llmProvider || 'anthropic',
      llmApiKey: config.llmApiKey || Deno.env.get('LLM_API_KEY') || '',
      model: config.model || 'claude-3-5-sonnet-20241022',
      maxHistory: config.maxHistory || 10,
      enableEscalation: config.enableEscalation !== false,
      escalationKeywords: config.escalationKeywords || [
        'speak to human', 'talk to person', 'representative', 'manager'
      ]
    };

    this.initialize();
  }

  private initialize(): void {
    // Initialize LLM
    if (this.config.llmProvider === 'anthropic') {
      this.llmClient = new Anthropic({ apiKey: this.config.llmApiKey });
    }

    // Build system prompt
    this.buildSystemPrompt();
  }

  private buildSystemPrompt(): void {
    const { storeName, brandVoice, storePolicies } = this.config;

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
6. For complex issues or angry customers, offer to escalate to human support

Remember: You represent ${storeName} - make every interaction count!`;

    this.messages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  async execute(
    message: string,
    options: {
      customerEmail?: string;
      customerName?: string;
    } = {}
  ): Promise<ChatResponse> {
    const { customerEmail, customerName } = options;

    // Store customer info
    if (customerEmail) this.customerInfo.email = customerEmail;
    if (customerName) this.customerInfo.name = customerName;

    // Check for escalation
    if (this.shouldEscalate(message)) {
      return {
        response: this.escalateToHuman(),
        shouldEscalate: true
      };
    }

    // Detect intent
    const intent = this.detectIntent(message);

    // Gather context
    const context = await this.gatherContext(message, intent, customerEmail);

    // Generate response
    const response = await this.generateResponse(message, context);

    return {
      response
    };
  }

  private shouldEscalate(message: string): boolean {
    if (!this.config.enableEscalation) return false;

    const messageLower = message.toLowerCase();
    return this.config.escalationKeywords.some(keyword =>
      messageLower.includes(keyword)
    );
  }

  private escalateToHuman(): string {
    const { storePolicies } = this.config;
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

  private detectIntent(message: string): string {
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

  private async gatherContext(
    message: string,
    intent: string,
    customerEmail?: string
  ): Promise<string> {
    let context = '';

    const orderNumber = this.extractOrderNumber(message);

    if (intent === 'order_tracking' && orderNumber) {
      const orderInfo = await this.getOrderInfo(orderNumber, customerEmail);
      if (orderInfo) {
        context += `\n\nORDER INFORMATION:\n${orderInfo}`;
      }
    }

    // Add relevant policies
    if (intent === 'returns_refunds' && this.config.storePolicies.returns) {
      context += `\n\nRETURN POLICY:\n${this.config.storePolicies.returns}`;
    }

    if (intent === 'shipping_inquiry' && this.config.storePolicies.shipping) {
      context += `\n\nSHIPPING POLICY:\n${this.config.storePolicies.shipping}`;
    }

    return context;
  }

  private extractOrderNumber(message: string): string | null {
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

  private async getOrderInfo(
    orderNumber: string,
    customerEmail?: string
  ): Promise<string | null> {
    if (!this.config.shopifyStoreUrl || !this.config.shopifyAccessToken) {
      return `Order #${orderNumber} (Mock data: Your order is being processed)`;
    }

    try {
      const response = await fetch(
        `https://${this.config.shopifyStoreUrl}/admin/api/${this.config.shopifyApiVersion}/orders/${orderNumber}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.config.shopifyAccessToken
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const order = data.order;

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
      console.error('Error fetching order:', error);
      return null;
    }
  }

  private async generateResponse(message: string, context: string = ''): Promise<string> {
    // Add user message
    let userMessage = message;
    if (context) {
      userMessage = `${message}\n\n[Context: ${context}]`;
    }

    this.messages.push({
      role: 'user',
      content: userMessage
    });

    let responseText = '';

    if (!this.llmClient) {
      responseText = `I'd be happy to help you with: ${message}\n\n${context}`;
    } else {
      try {
        const systemMsg = this.messages.find(m => m.role === 'system')?.content || '';
        const conversation = this.messages.filter(m => m.role !== 'system');

        const response = await this.llmClient.messages.create({
          model: this.config.model,
          max_tokens: 512,
          system: systemMsg,
          messages: conversation as Anthropic.Messages.MessageParam[]
        });

        responseText = (response.content[0] as Anthropic.Messages.TextBlock).text;
      } catch (error) {
        console.error('LLM error:', error);
        responseText = "I apologize, but I'm having trouble processing that. Could you please rephrase?";
      }
    }

    // Add response to history
    this.messages.push({
      role: 'assistant',
      content: responseText
    });

    // Trim history
    this.trimHistory();

    return responseText;
  }

  private trimHistory(): void {
    const maxHistory = this.config.maxHistory;

    if (this.messages.length > maxHistory + 1) {
      const systemMsg = this.messages[0];
      this.messages = [systemMsg, ...this.messages.slice(-(maxHistory))];
    }
  }

  getConversationHistory(): Message[] {
    return this.messages;
  }

  resetConversation(): void {
    this.messages = [this.messages[0]]; // Keep system message
    this.customerInfo = {};
  }
}

export default ShopifyChatbotAgent;
