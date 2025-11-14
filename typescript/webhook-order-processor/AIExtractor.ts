/**
 * AI-Powered Order Extractor (Liquid-Guided)
 *
 * Uses AI (Claude Haiku) to extract order data, guided by your proven Liquid template.
 * The AI learns from your Liquid code to maintain consistency.
 *
 * Cost: ~$0.0001 per order
 * Speed: ~3-5 seconds
 *
 * ✅ USE FOR: Complex edge cases, unusual formats, validation
 */

import { ExtractedOrder, ExtractedItem, ShopifyWebhook } from './DeterministicExtractor.ts';

export interface AIExtractorConfig {
  apiKey: string;
  liquidTemplate?: string; // Your Liquid template code
  model?: string; // Default: claude-3-haiku-20240307
}

export class AIExtractor {
  private config: Required<AIExtractorConfig>;
  private liquidTemplate: string;

  constructor(config: AIExtractorConfig) {
    // Validate API key upfront
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('ANTHROPIC_API_KEY is required for AIExtractor. Set the ANTHROPIC_API_KEY environment variable.');
    }

    this.config = {
      apiKey: config.apiKey,
      liquidTemplate: config.liquidTemplate || '',
      model: config.model || 'claude-3-haiku-20240307',
    };

    // Store the Liquid template that guides extraction
    this.liquidTemplate = this.getDefaultLiquidTemplate();
    if (config.liquidTemplate) {
      this.liquidTemplate = config.liquidTemplate;
    }
  }

  /**
   * Extract order data using AI guided by Liquid template
   */
  async extract(webhook: ShopifyWebhook): Promise<ExtractedOrder> {
    console.log(`AI extracting order ${webhook.name}`);

    const prompt = this.buildPrompt(webhook);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
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

      // Safely access API response
      if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
        throw new Error('Invalid API response: missing content array');
      }

      if (!data.content[0].text) {
        throw new Error('Invalid API response: missing text in content');
      }

      const content = data.content[0].text;

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from AI response');
      }

      const extracted = JSON.parse(jsonMatch[0]);
      console.log(`AI extraction complete for ${webhook.name}`);

      return extracted as ExtractedOrder;

    } catch (error) {
      console.error('AI extraction failed:', error);
      throw error;
    }
  }

  /**
   * Build prompt with Liquid template as guide
   */
  private buildPrompt(webhook: ShopifyWebhook): string {
    return `You are an expert order data extractor. Extract clean order information from this Shopify webhook JSON.

IMPORTANT: Follow the EXACT logic from this Liquid template that already works in production:

\`\`\`liquid
${this.liquidTemplate}
\`\`\`

EXTRACTION RULES (from Liquid template):

1. Order Number:
   - Extract from: order.name
   - Remove the # symbol
   - Example: "#B24517" → "B24517"

2. Customer Name:
   - First try: order.shipping_address.name
   - Fallback: order.customer.first_name + order.customer.last_name
   - Use whichever is not blank

3. Delivery Date & Time:
   - Extract from: order.note_attributes where name = "Local Delivery Date and Time"
   - Split by the word "between"
   - First part = delivery_date (strip whitespace)
   - Second part = delivery_time

4. Delivery Method:
   - Extract from: order.note_attributes where name = "Delivery Method"

5. Line Items - Identify Type:
   - Type = "cake" if product title contains "cake" (case insensitive)
   - Type = "accessory" if product title contains "candles" OR "balloon"
   - Otherwise = "accessory"

6. Cake Writing:
   - Line 1: property "Cake Writing"
   - Line 2: property "Cake Writing (Line 2)"
   - Line 3: property "Cake Writing (Line 3)"
   - Only include lines that are not blank
   - Return as array: ["line1", "line2", "line3"]

7. Filter Properties (exclude these):
   - Properties containing: "_origin"
   - Properties containing: "_raw"
   - Properties containing: "gwp"
   - Properties containing: "_LocalDeliveryID"
   - Properties where value is blank

8. Other Fields:
   - customer_email: order.email
   - customer_phone: order.shipping_address.phone OR order.customer.phone
   - total_price: order.total_price (as number)
   - order_date: order.created_at
   - notes: order.note

WEBHOOK JSON:
${JSON.stringify(webhook, null, 2)}

Return ONLY valid JSON in this EXACT format (no other text):
{
  "order_number": "B24517",
  "customer_name": "Lauren Aliferis",
  "customer_email": "lauren.aliferis101@gmail.com",
  "customer_phone": "+61424413720",
  "delivery_date": "Sat 8 Nov 2025",
  "delivery_time": "8:00 AM and 6:00 PM",
  "delivery_method": "Local delivery",
  "order_date": "2025-11-06T16:58:13+11:00",
  "total_price": 125.00,
  "notes": null,
  "items": [
    {
      "type": "cake",
      "title": "White Personalised Cake",
      "variant_title": "Medium / Vanilla",
      "quantity": 1,
      "price": 115.00,
      "cake_writing": ["TandA"],
      "properties": {}
    }
  ]
}`;
  }

  /**
   * Split multi-cake orders (same logic as deterministic)
   */
  splitOrder(extracted: ExtractedOrder): ExtractedOrder[] {
    const cakes = extracted.items.filter(item => item.type === 'cake');
    const accessories = extracted.items.filter(item => item.type === 'accessory');

    if (cakes.length <= 1) {
      return [extracted];
    }

    console.log(`AI splitting order ${extracted.order_number} into ${cakes.length} orders`);

    const orders: ExtractedOrder[] = [];

    for (let i = 0; i < cakes.length; i++) {
      const suffix = String.fromCharCode(65 + i);
      const cake = cakes[i];
      const items = [cake];

      if (i === 0) {
        items.push(...accessories);
      }

      let price = cake.price * cake.quantity;
      if (i === 0) {
        price += accessories.reduce((sum, acc) => sum + (acc.price * acc.quantity), 0);
      }

      orders.push({
        ...extracted,
        order_number: `${extracted.order_number}-${suffix}`,
        items,
        total_price: price,
      });
    }

    return orders;
  }

  /**
   * Get default Liquid template
   */
  private getDefaultLiquidTemplate(): string {
    return `<!-- Your proven Liquid template -->
<div class="wrapper">
  <div class="header">
    <h1>Kitchen Docket</h1>
    <div class="order-info">
      <p class="text-align-right large-order-number">
        Order {{ order.name }}
      </p>
      <p class="text-align-right delivery-date-highlight">
        {% assign delivery_date = order.attributes['Local Delivery Date and Time'] | split: 'between' | first | strip %}
        {% assign delivery_method = order.attributes['Delivery Method'] | downcase %}
        {% if delivery_method contains 'pickup' or delivery_method contains 'pick up' %}
          Pickup Date: {{ delivery_date }}
        {% else %}
          Delivery Date: {{ delivery_date }}
        {% endif %}
      </p>
    </div>
  </div>

  <div class="customer-name">
    <strong>Customer:</strong><br/>
    {% assign customer_name = order.shipping_address.name %}
    {% if customer_name == blank %}
      {% assign customer_name = order.customer.name %}
    {% endif %}
    {{ customer_name }}
  </div>

  <h2>Order Details</h2>
  <table class="product-table">
    <thead>
      <tr>
        <th>Qty</th>
        <th>Item</th>
      </tr>
    </thead>
    <tbody>
      {% for line_item in line_items %}
      <tr>
        <td>{{ line_item.quantity }}</td>
        <td>
          <strong>{{ line_item.title }}</strong><br/>
          {% if line_item.variant_title != blank %}
            <small>{{ line_item.variant_title }}</small><br/>
          {% endif %}
          {% for property in line_item.properties %}
            {% unless property.first contains "_origin" or property.first contains "_raw" or property.first contains "gwp" or property.first contains "_LocalDeliveryID" %}
              {% if property.last != blank %}
                <small><strong>{{ property.first }}:</strong> {{ property.last }}</small><br/>
              {% endif %}
            {% endunless %}
          {% endfor %}
        </td>
      </tr>
      {% endfor %}
    </tbody>
  </table>

  {% if order.note != blank %}
  <div class="notes-section">
    <strong>Notes:</strong> {{ order.note }}
  </div>
  {% endif %}
</div>`;
  }
}

export default AIExtractor;
