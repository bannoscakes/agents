/**
 * Deterministic Order Extractor
 *
 * Pure TypeScript extraction following the proven Liquid template logic.
 * No AI, 100% predictable, FREE, FAST (~10ms per order)
 *
 * ✅ RECOMMENDED FOR PRODUCTION
 */

export interface ShopifyWebhook {
  id: number;
  name: string;
  note: string | null;
  email: string;
  phone: string | null;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  note_attributes: Array<{
    name: string;
    value: string;
  }>;
  line_items: Array<{
    id: number;
    title: string;
    variant_title: string | null;
    quantity: number;
    price: string;
    sku: string;
    product_id: number;
    properties: Array<{
      name: string;
      value: string;
    }>;
  }>;
  shipping_address: {
    name: string;
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone: string;
  } | null;
  total_price: string;
  created_at: string;
}

export interface ExtractedOrder {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_method: string | null;
  order_date: string;
  total_price: number;
  notes: string | null;
  items: ExtractedItem[];
}

export interface ExtractedItem {
  type: 'cake' | 'accessory';
  title: string;
  variant_title: string | null;
  quantity: number;
  price: number;
  cake_writing: string[];
  properties: Record<string, string>;
}

export class DeterministicExtractor {
  /**
   * Extract order data following Liquid template logic
   */
  extract(webhook: ShopifyWebhook): ExtractedOrder {
    // Order number (remove #)
    const order_number = webhook.name.replace('#', '');

    // Customer name (following Liquid logic)
    let customer_name = webhook.shipping_address?.name || '';
    if (!customer_name || customer_name === '') {
      customer_name = `${webhook.customer.first_name} ${webhook.customer.last_name}`.trim();
    }

    // Delivery date and time (following Liquid logic)
    const deliveryDateAttr = this.findAttribute(webhook.note_attributes, 'Local Delivery Date and Time');
    let delivery_date = null;
    let delivery_time = null;

    if (deliveryDateAttr) {
      // Split by 'between' and take first part, then strip
      const parts = deliveryDateAttr.split('between');
      delivery_date = parts[0].trim();

      // Extract time if present (e.g., "8:00 AM and 6:00 PM")
      if (parts.length > 1) {
        delivery_time = parts[1].trim();
      }
    }

    // Delivery method
    const delivery_method = this.findAttribute(webhook.note_attributes, 'Delivery Method');

    // Extract items
    const items = this.extractItems(webhook.line_items);

    return {
      order_number,
      customer_name,
      customer_email: webhook.email,
      customer_phone: webhook.shipping_address?.phone || webhook.customer.phone || null,
      delivery_date,
      delivery_time,
      delivery_method,
      order_date: webhook.created_at,
      total_price: parseFloat(webhook.total_price),
      notes: webhook.note,
      items,
    };
  }

  /**
   * Extract and classify items (cakes vs accessories)
   */
  private extractItems(line_items: ShopifyWebhook['line_items']): ExtractedItem[] {
    return line_items.map(item => {
      const title_lower = item.title.toLowerCase();

      // Identify type (following Liquid logic - product title contains keyword)
      let type: 'cake' | 'accessory' = 'accessory';
      if (title_lower.includes('cake')) {
        type = 'cake';
      }

      // Extract cake writing (following Liquid property extraction)
      const cake_writing = this.extractCakeWriting(item.properties);

      // Extract other properties (filter out internal fields like Liquid does)
      const properties = this.extractProperties(item.properties);

      return {
        type,
        title: item.title,
        variant_title: item.variant_title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        cake_writing,
        properties,
      };
    });
  }

  /**
   * Extract cake writing from properties (following Liquid logic)
   */
  private extractCakeWriting(properties: Array<{ name: string; value: string }>): string[] {
    const writing: string[] = [];

    // Line 1
    const line1 = this.findProperty(properties, 'Cake Writing');
    if (line1 && line1 !== '') {
      writing.push(line1);
    }

    // Line 2
    const line2 = this.findProperty(properties, 'Cake Writing (Line 2)');
    if (line2 && line2 !== '') {
      writing.push(line2);
    }

    // Line 3
    const line3 = this.findProperty(properties, 'Cake Writing (Line 3)');
    if (line3 && line3 !== '') {
      writing.push(line3);
    }

    return writing;
  }

  /**
   * Extract properties, filtering out internal fields (following Liquid logic)
   */
  private extractProperties(properties: Array<{ name: string; value: string }>): Record<string, string> {
    const extracted: Record<string, string> = {};

    for (const prop of properties) {
      const name = prop.name;
      const value = prop.value;

      // Filter out internal fields (following Liquid unless logic)
      if (
        name.includes('_origin') ||
        name.includes('_raw') ||
        name.includes('gwp') ||
        name.includes('_LocalDeliveryID')
      ) {
        continue;
      }

      // Skip if blank (following Liquid if property.last != blank)
      if (value === null || value === '') {
        continue;
      }

      extracted[name] = value;
    }

    return extracted;
  }

  /**
   * Find attribute by name
   */
  private findAttribute(attributes: Array<{ name: string; value: string }>, name: string): string | null {
    const attr = attributes.find(a => a.name === name);
    return attr ? attr.value : null;
  }

  /**
   * Find property by name
   */
  private findProperty(properties: Array<{ name: string; value: string }>, name: string): string | null {
    const prop = properties.find(p => p.name === name);
    return prop ? prop.value : null;
  }

  /**
   * Split multi-cake orders
   *
   * Rules:
   * - One order per cake
   * - All accessories go to first cake
   * - Order numbers: #B21345-A, #B21345-B, etc.
   */
  splitOrder(extracted: ExtractedOrder): ExtractedOrder[] {
    const cakes = extracted.items.filter(item => item.type === 'cake');
    const accessories = extracted.items.filter(item => item.type === 'accessory');

    // No splitting needed if only one cake
    if (cakes.length <= 1) {
      return [extracted];
    }

    console.log(`Splitting order ${extracted.order_number} into ${cakes.length} orders`);

    const orders: ExtractedOrder[] = [];

    for (let i = 0; i < cakes.length; i++) {
      const suffix = String.fromCharCode(65 + i); // A, B, C, etc.
      const cake = cakes[i];

      // Items for this order
      const items = [cake];

      // First cake gets all accessories
      if (i === 0) {
        items.push(...accessories);
      }

      // Calculate price (cake + accessories if first)
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
   * Format cake writing for database (join lines)
   */
  formatCakeWriting(writing: string[]): string | null {
    if (writing.length === 0) {
      return null;
    }
    return writing.join('\n');
  }
}

export default DeterministicExtractor;
