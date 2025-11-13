/**
 * Webhook Order Processor Agent
 *
 * Processes complex webhook JSON from multiple sources and extracts clean order data.
 *
 * Features:
 * - Handles variable/complex JSON structures
 * - AI-powered extraction (no hard-coded paths)
 * - Multi-cake order splitting with smart logic
 * - Accessories stay with first cake
 * - Order numbering: #B21345-A, #B21345-B, etc.
 * - Populates order_table and order_carts
 * - Tracks processing status
 * - Error handling and logging
 *
 * Cost: ~$0.0001 per order (using Claude Haiku)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface WebhookProcessorConfig {
  supabaseClient: SupabaseClient;

  // AI Provider
  aiProvider?: 'anthropic';
  apiKey?: string;

  // Tables
  bannos

InboxTable?: string;
  flourlaneInboxTable?: string;
  ordersTable?: string;
  orderCartsTable?: string;

  // Extraction rules (can use your Liquid template logic)
  extractionRules?: string;

  // Processing options
  autoSplit?: boolean; // Auto-split multi-cake orders
  markProcessed?: boolean; // Mark webhooks as processed
}

export interface WebhookRecord {
  id: string;
  shop: 'bannos' | 'flourlane';
  payload: any;
  received_at: string;
  processed: boolean;
  processed_at?: string;
  error?: string;
}

export interface ExtractedOrder {
  // Customer info
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;

  // Order info
  order_number: string;
  order_date: string;
  delivery_date?: string;
  delivery_time?: string;

  // Cake details
  cake_type: string;
  cake_size?: string;
  cake_flavor?: string;
  message_on_cake?: string;
  decoration_notes?: string;
  color_scheme?: string;
  special_instructions?: string;

  // Pricing
  price?: number;

  // Items (for splitting)
  items: OrderItem[];

  // Raw data
  raw_webhook_id: string;
  shop: string;
}

export interface OrderItem {
  type: 'cake' | 'accessory';
  name: string;
  quantity: number;
  price?: number;
  details?: any;
}

export interface ProcessedOrder {
  id?: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  cake_type: string;
  message_on_cake?: string;
  delivery_date?: string;
  price?: number;
  shop: string;
  status: string;
  webhook_id: string;
  is_split: boolean;
  parent_order_number?: string;
  created_at?: string;
}

export class WebhookOrderProcessorAgent {
  private config: Required<WebhookProcessorConfig>;

  constructor(config: WebhookProcessorConfig) {
    this.config = {
      supabaseClient: config.supabaseClient,
      aiProvider: config.aiProvider || 'anthropic',
      apiKey: config.apiKey || '',
      bannosInboxTable: config.bannosInboxTable || 'webhook_inbox_bannos',
      flourlaneInboxTable: config.flourlaneInboxTable || 'webhook_inbox_flourlane',
      ordersTable: config.ordersTable || 'orders',
      orderCartsTable: config.orderCartsTable || 'order_carts',
      extractionRules: config.extractionRules || this.getDefaultExtractionRules(),
      autoSplit: config.autoSplit ?? true,
      markProcessed: config.markProcessed ?? true,
    };
  }

  /**
   * Process a single webhook
   */
  async processWebhook(webhookId: string, shop: 'bannos' | 'flourlane'): Promise<ProcessedOrder[]> {
    console.log(`Processing webhook ${webhookId} from ${shop}`);

    try {
      // Fetch webhook
      const webhook = await this.fetchWebhook(webhookId, shop);

      if (webhook.processed) {
        console.log('Webhook already processed, skipping');
        return [];
      }

      // Extract order data using AI
      const extractedOrder = await this.extractOrderData(webhook);

      // Split multi-cake orders if needed
      const orders = this.config.autoSplit
        ? this.splitOrder(extractedOrder)
        : [extractedOrder];

      // Generate order numbers with suffixes
      const processedOrders: ProcessedOrder[] = [];

      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const suffix = String.fromCharCode(65 + i); // A, B, C, etc.
        const orderNumber = `${extractedOrder.order_number}-${suffix}`;

        const processedOrder = await this.saveOrder({
          order_number: orderNumber,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          cake_type: order.cake_type,
          message_on_cake: order.message_on_cake,
          delivery_date: order.delivery_date,
          price: order.price,
          shop: order.shop,
          status: 'pending',
          webhook_id: webhookId,
          is_split: orders.length > 1,
          parent_order_number: orders.length > 1 ? `${extractedOrder.order_number}-A` : undefined,
        });

        processedOrders.push(processedOrder);

        // Save to order_carts if items exist
        if (order.items && order.items.length > 0) {
          await this.saveOrderCart(processedOrder.id!, order.items);
        }
      }

      // Mark webhook as processed
      if (this.config.markProcessed) {
        await this.markWebhookProcessed(webhookId, shop);
      }

      console.log(`Successfully processed webhook into ${processedOrders.length} order(s)`);
      return processedOrders;

    } catch (error) {
      console.error(`Error processing webhook ${webhookId}:`, error);

      // Log error
      await this.logError(webhookId, shop, error.message);

      throw error;
    }
  }

  /**
   * Process all pending webhooks
   */
  async processPending(limit: number = 10): Promise<{ processed: number; errors: number }> {
    console.log('Processing pending webhooks...');

    let processed = 0;
    let errors = 0;

    // Process Bannos webhooks
    const bannosWebhooks = await this.fetchPendingWebhooks('bannos', limit);
    for (const webhook of bannosWebhooks) {
      try {
        await this.processWebhook(webhook.id, 'bannos');
        processed++;
      } catch (error) {
        errors++;
      }
    }

    // Process Flourlane webhooks
    const flourlaneWebhooks = await this.fetchPendingWebhooks('flourlane', limit);
    for (const webhook of flourlaneWebhooks) {
      try {
        await this.processWebhook(webhook.id, 'flourlane');
        processed++;
      } catch (error) {
        errors++;
      }
    }

    console.log(`Processed: ${processed}, Errors: ${errors}`);
    return { processed, errors };
  }

  /**
   * Extract order data from webhook using AI
   */
  private async extractOrderData(webhook: WebhookRecord): Promise<ExtractedOrder> {
    const prompt = this.buildExtractionPrompt(webhook);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Cheapest model!
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Add metadata
    extracted.raw_webhook_id = webhook.id;
    extracted.shop = webhook.shop;

    return extracted as ExtractedOrder;
  }

  /**
   * Build extraction prompt for AI
   */
  private buildExtractionPrompt(webhook: WebhookRecord): string {
    return `You are an order data extraction expert. Extract clean order information from this webhook JSON.

Shop: ${webhook.shop}
Webhook JSON:
${JSON.stringify(webhook.payload, null, 2)}

${this.config.extractionRules}

Return ONLY valid JSON in this exact format:
{
  "customer_name": "Full Name",
  "customer_email": "email@example.com",
  "customer_phone": "1234567890",
  "order_number": "B21345",
  "order_date": "2025-11-13T10:00:00Z",
  "delivery_date": "2025-11-15T14:00:00Z",
  "delivery_time": "2:00 PM",
  "items": [
    {
      "type": "cake",
      "name": "Chocolate Cake",
      "quantity": 1,
      "price": 45.00,
      "details": {
        "size": "Large",
        "flavor": "Chocolate",
        "message": "Happy Birthday!",
        "decoration_notes": "Pink roses",
        "color_scheme": "Pink and white"
      }
    },
    {
      "type": "accessory",
      "name": "Candles",
      "quantity": 1,
      "price": 5.00
    }
  ],
  "price": 50.00,
  "special_instructions": "Handle with care"
}

IMPORTANT:
- Extract ALL cakes as separate items
- Mark accessories with type: "accessory"
- Include all cake details in the details object
- Use ISO 8601 format for dates
- Return ONLY the JSON, no other text`;
  }

  /**
   * Get default extraction rules
   */
  private getDefaultExtractionRules(): string {
    return `Extraction Rules:
1. Extract customer information (name, email, phone)
2. Extract order number (remove # if present)
3. Extract order and delivery dates
4. Identify ALL cakes in the order as separate items
5. Identify accessories (candles, toppers, etc.)
6. Extract cake details: size, flavor, message, decoration notes
7. Extract pricing information
8. Handle nested JSON structures
9. Be flexible with field names (they may vary)
10. If information is missing, use null`;
  }

  /**
   * Split order into multiple orders (one per cake)
   */
  private splitOrder(order: ExtractedOrder): ExtractedOrder[] {
    const cakes = order.items.filter(item => item.type === 'cake');
    const accessories = order.items.filter(item => item.type === 'accessory');

    if (cakes.length <= 1) {
      // No splitting needed
      return [order];
    }

    console.log(`Splitting order into ${cakes.length} orders`);

    const splitOrders: ExtractedOrder[] = [];

    for (let i = 0; i < cakes.length; i++) {
      const cake = cakes[i];

      // Create new order for this cake
      const splitOrder: ExtractedOrder = {
        ...order,
        cake_type: cake.name,
        message_on_cake: cake.details?.message,
        decoration_notes: cake.details?.decoration_notes,
        color_scheme: cake.details?.color_scheme,
        special_instructions: cake.details?.special_instructions || order.special_instructions,
        price: cake.price,
        items: [cake],
      };

      // First cake gets all accessories
      if (i === 0 && accessories.length > 0) {
        splitOrder.items.push(...accessories);

        // Add accessory costs to first cake
        const accessoryCost = accessories.reduce((sum, acc) => sum + (acc.price || 0), 0);
        splitOrder.price = (splitOrder.price || 0) + accessoryCost;
      }

      splitOrders.push(splitOrder);
    }

    return splitOrders;
  }

  /**
   * Save order to database
   */
  private async saveOrder(order: ProcessedOrder): Promise<ProcessedOrder> {
    const { data, error } = await this.config.supabaseClient
      .from(this.config.ordersTable)
      .insert({
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        cake_type: order.cake_type,
        message_on_cake: order.message_on_cake,
        delivery_date: order.delivery_date,
        price: order.price,
        shop: order.shop,
        status: order.status,
        webhook_id: order.webhook_id,
        is_split: order.is_split,
        parent_order_number: order.parent_order_number,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save order: ${error.message}`);
    }

    console.log(`Saved order ${order.order_number}`);
    return data as ProcessedOrder;
  }

  /**
   * Save items to order_carts
   */
  private async saveOrderCart(orderId: string, items: OrderItem[]): Promise<void> {
    const cartItems = items.map(item => ({
      order_id: orderId,
      item_type: item.type,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
      details: item.details,
    }));

    const { error } = await this.config.supabaseClient
      .from(this.config.orderCartsTable)
      .insert(cartItems);

    if (error) {
      console.error('Failed to save order cart:', error);
      // Don't throw - order is already saved
    }
  }

  /**
   * Fetch webhook from database
   */
  private async fetchWebhook(webhookId: string, shop: 'bannos' | 'flourlane'): Promise<WebhookRecord> {
    const table = shop === 'bannos'
      ? this.config.bannosInboxTable
      : this.config.flourlaneInboxTable;

    const { data, error } = await this.config.supabaseClient
      .from(table)
      .select('*')
      .eq('id', webhookId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch webhook: ${error.message}`);
    }

    return {
      id: data.id,
      shop,
      payload: data.payload,
      received_at: data.received_at,
      processed: data.processed || false,
      processed_at: data.processed_at,
      error: data.error,
    };
  }

  /**
   * Fetch pending webhooks
   */
  private async fetchPendingWebhooks(shop: 'bannos' | 'flourlane', limit: number): Promise<WebhookRecord[]> {
    const table = shop === 'bannos'
      ? this.config.bannosInboxTable
      : this.config.flourlaneInboxTable;

    const { data, error } = await this.config.supabaseClient
      .from(table)
      .select('*')
      .eq('processed', false)
      .order('received_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch pending webhooks: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      shop,
      payload: row.payload,
      received_at: row.received_at,
      processed: row.processed || false,
    }));
  }

  /**
   * Mark webhook as processed
   */
  private async markWebhookProcessed(webhookId: string, shop: 'bannos' | 'flourlane'): Promise<void> {
    const table = shop === 'bannos'
      ? this.config.bannosInboxTable
      : this.config.flourlaneInboxTable;

    const { error } = await this.config.supabaseClient
      .from(table)
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhookId);

    if (error) {
      console.error('Failed to mark webhook as processed:', error);
    }
  }

  /**
   * Log processing error
   */
  private async logError(webhookId: string, shop: 'bannos' | 'flourlane', errorMessage: string): Promise<void> {
    const table = shop === 'bannos'
      ? this.config.bannosInboxTable
      : this.config.flourlaneInboxTable;

    await this.config.supabaseClient
      .from(table)
      .update({
        error: errorMessage,
        processed: false,
      })
      .eq('id', webhookId);
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<{
    bannos: { pending: number; processed: number; errors: number };
    flourlane: { pending: number; processed: number; errors: number };
  }> {
    const getTableStats = async (table: string) => {
      const { count: pending } = await this.config.supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('processed', false);

      const { count: processed } = await this.config.supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('processed', true);

      const { count: errors } = await this.config.supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true })
        .not('error', 'is', null);

      return {
        pending: pending || 0,
        processed: processed || 0,
        errors: errors || 0,
      };
    };

    const [bannos, flourlane] = await Promise.all([
      getTableStats(this.config.bannosInboxTable),
      getTableStats(this.config.flourlaneInboxTable),
    ]);

    return { bannos, flourlane };
  }
}

export default WebhookOrderProcessorAgent;
