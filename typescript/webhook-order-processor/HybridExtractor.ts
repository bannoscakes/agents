/**
 * Hybrid Order Extractor (Best of Both Worlds)
 *
 * Combines deterministic extraction with optional AI validation/correction.
 *
 * Strategy:
 * 1. Try deterministic extraction first (FREE, fast, reliable)
 * 2. Validate result for completeness
 * 3. If validation fails, use AI to fill gaps or correct issues
 * 4. AI uses Liquid template as guide to maintain consistency
 *
 * Cost: FREE for most orders, ~$0.0001 only when AI needed
 * Speed: ~10ms (deterministic only) or ~3-5 seconds (with AI)
 * Reliability: Best of both worlds
 *
 * ✅ USE FOR: Production systems where you want speed + accuracy
 */

import { DeterministicExtractor, ExtractedOrder, ExtractedItem, ShopifyWebhook } from './DeterministicExtractor.ts';
import { AIExtractor, AIExtractorConfig } from './AIExtractor.ts';

export interface HybridExtractorConfig {
  apiKey: string;
  liquidTemplate?: string;
  model?: string;

  // Validation settings
  requireCustomerName?: boolean;
  requireDeliveryDate?: boolean;
  requireItems?: boolean;

  // AI usage settings
  useAIForValidation?: boolean; // Default: true
  useAIForMissingFields?: boolean; // Default: true
  useAIForEdgeCases?: boolean; // Default: false (only if deterministic fails)
}

export interface HybridResult {
  order: ExtractedOrder;
  method: 'deterministic' | 'ai' | 'hybrid';
  ai_used: boolean;
  ai_corrections: string[];
  validation_issues: string[];
  processing_time_ms: number;
  cost_estimate: number; // In USD
}

export class HybridExtractor {
  private deterministicExtractor: DeterministicExtractor;
  private aiExtractor: AIExtractor;
  private config: Required<HybridExtractorConfig>;

  constructor(config: HybridExtractorConfig) {
    this.config = {
      apiKey: config.apiKey,
      liquidTemplate: config.liquidTemplate || '',
      model: config.model || 'claude-3-haiku-20240307',
      requireCustomerName: config.requireCustomerName ?? true,
      requireDeliveryDate: config.requireDeliveryDate ?? true,
      requireItems: config.requireItems ?? true,
      useAIForValidation: config.useAIForValidation ?? true,
      useAIForMissingFields: config.useAIForMissingFields ?? true,
      useAIForEdgeCases: config.useAIForEdgeCases ?? false,
    };

    this.deterministicExtractor = new DeterministicExtractor();
    this.aiExtractor = new AIExtractor({
      apiKey: config.apiKey,
      liquidTemplate: config.liquidTemplate,
      model: config.model,
    });
  }

  /**
   * Extract order data using hybrid approach
   */
  async extract(webhook: ShopifyWebhook): Promise<HybridResult> {
    const startTime = Date.now();
    console.log(`Hybrid extracting order ${webhook.name}`);

    // Step 1: Try deterministic extraction first
    let extracted: ExtractedOrder;
    let method: 'deterministic' | 'ai' | 'hybrid' = 'deterministic';
    let aiUsed = false;
    let aiCorrections: string[] = [];
    let validationIssues: string[] = [];

    try {
      extracted = this.deterministicExtractor.extract(webhook);
      console.log('✓ Deterministic extraction succeeded');

      // Step 2: Validate the result
      validationIssues = this.validate(extracted);

      // Step 3: If validation issues found, use AI to correct
      if (validationIssues.length > 0 && this.config.useAIForMissingFields) {
        console.log(`⚠ Validation issues found: ${validationIssues.join(', ')}`);
        console.log('→ Using AI to fill gaps...');

        const aiExtracted = await this.aiExtractor.extract(webhook);
        aiUsed = true;
        method = 'hybrid';

        // Merge: Use AI data to fill missing fields only
        const merged = this.mergeResults(extracted, aiExtracted, validationIssues);
        extracted = merged.order;
        aiCorrections = merged.corrections;

        console.log(`✓ AI filled ${aiCorrections.length} gap(s)`);
      }

    } catch (error) {
      // Step 4: If deterministic fails completely, fall back to AI
      console.error('✗ Deterministic extraction failed:', error.message);

      if (this.config.useAIForEdgeCases) {
        console.log('→ Falling back to AI extraction...');
        extracted = await this.aiExtractor.extract(webhook);
        aiUsed = true;
        method = 'ai';
        aiCorrections.push('Used AI for full extraction due to deterministic failure');
      } else {
        throw new Error(`Deterministic extraction failed and AI fallback disabled: ${error.message}`);
      }
    }

    const processingTime = Date.now() - startTime;
    const costEstimate = aiUsed ? 0.0001 : 0; // Claude Haiku cost

    return {
      order: extracted,
      method,
      ai_used: aiUsed,
      ai_corrections: aiCorrections,
      validation_issues: validationIssues,
      processing_time_ms: processingTime,
      cost_estimate: costEstimate,
    };
  }

  /**
   * Validate extracted order
   */
  private validate(order: ExtractedOrder): string[] {
    const issues: string[] = [];

    // Check required fields
    if (this.config.requireCustomerName && !order.customer_name) {
      issues.push('Missing customer_name');
    }

    if (this.config.requireDeliveryDate && !order.delivery_date) {
      issues.push('Missing delivery_date');
    }

    if (this.config.requireItems && (!order.items || order.items.length === 0)) {
      issues.push('Missing items');
    }

    // Check data quality
    if (order.customer_name && order.customer_name.length < 2) {
      issues.push('Customer name too short');
    }

    if (order.order_number && order.order_number.includes('#')) {
      issues.push('Order number contains # symbol');
    }

    // Check items have required fields
    if (order.items) {
      order.items.forEach((item, i) => {
        if (!item.title) {
          issues.push(`Item ${i} missing title`);
        }
        if (!item.type) {
          issues.push(`Item ${i} missing type`);
        }
        if (item.quantity === undefined || item.quantity <= 0) {
          issues.push(`Item ${i} has invalid quantity`);
        }
      });
    }

    return issues;
  }

  /**
   * Merge deterministic and AI results
   * Strategy: Trust deterministic data, use AI only to fill gaps
   */
  private mergeResults(
    deterministic: ExtractedOrder,
    ai: ExtractedOrder,
    validationIssues: string[]
  ): { order: ExtractedOrder; corrections: string[] } {
    const corrections: string[] = [];
    const merged = { ...deterministic };

    // Fill missing customer name
    if (!merged.customer_name && ai.customer_name) {
      merged.customer_name = ai.customer_name;
      corrections.push('Filled customer_name from AI');
    }

    // Fill missing email
    if (!merged.customer_email && ai.customer_email) {
      merged.customer_email = ai.customer_email;
      corrections.push('Filled customer_email from AI');
    }

    // Fill missing phone
    if (!merged.customer_phone && ai.customer_phone) {
      merged.customer_phone = ai.customer_phone;
      corrections.push('Filled customer_phone from AI');
    }

    // Fill missing delivery date
    if (!merged.delivery_date && ai.delivery_date) {
      merged.delivery_date = ai.delivery_date;
      corrections.push('Filled delivery_date from AI');
    }

    // Fill missing delivery time
    if (!merged.delivery_time && ai.delivery_time) {
      merged.delivery_time = ai.delivery_time;
      corrections.push('Filled delivery_time from AI');
    }

    // Fill missing delivery method
    if (!merged.delivery_method && ai.delivery_method) {
      merged.delivery_method = ai.delivery_method;
      corrections.push('Filled delivery_method from AI');
    }

    // Fill missing items
    if ((!merged.items || merged.items.length === 0) && ai.items && ai.items.length > 0) {
      merged.items = ai.items;
      corrections.push('Filled items from AI');
    }

    // Enhance items with missing details
    if (merged.items && ai.items) {
      merged.items = merged.items.map((deterministicItem, i) => {
        const aiItem = ai.items[i];
        if (!aiItem) return deterministicItem;

        const enhanced = { ...deterministicItem };

        // Fill missing variant_title
        if (!enhanced.variant_title && aiItem.variant_title) {
          enhanced.variant_title = aiItem.variant_title;
          corrections.push(`Filled variant_title for item ${i} from AI`);
        }

        // Fill missing price
        if (!enhanced.price && aiItem.price) {
          enhanced.price = aiItem.price;
          corrections.push(`Filled price for item ${i} from AI`);
        }

        // Fill missing cake_writing
        if ((!enhanced.cake_writing || enhanced.cake_writing.length === 0) && aiItem.cake_writing && aiItem.cake_writing.length > 0) {
          enhanced.cake_writing = aiItem.cake_writing;
          corrections.push(`Filled cake_writing for item ${i} from AI`);
        }

        return enhanced;
      });
    }

    // Fill missing total price
    if (!merged.total_price && ai.total_price) {
      merged.total_price = ai.total_price;
      corrections.push('Filled total_price from AI');
    }

    // Fill missing notes
    if (!merged.notes && ai.notes) {
      merged.notes = ai.notes;
      corrections.push('Filled notes from AI');
    }

    return { order: merged, corrections };
  }

  /**
   * Split multi-cake orders (uses deterministic logic)
   */
  splitOrder(extracted: ExtractedOrder): ExtractedOrder[] {
    return this.deterministicExtractor.splitOrder(extracted);
  }

  /**
   * Process webhook and split if needed
   */
  async process(webhook: ShopifyWebhook): Promise<HybridResult[]> {
    // Extract
    const result = await this.extract(webhook);

    // Split if multi-cake
    const orders = this.splitOrder(result.order);

    // If no splitting, return single result
    if (orders.length === 1) {
      return [result];
    }

    // Return result for each split order
    console.log(`Split into ${orders.length} orders`);
    return orders.map((order, i) => ({
      ...result,
      order,
    }));
  }

  /**
   * Get extraction method recommendation
   */
  static recommendMethod(webhook: ShopifyWebhook): 'deterministic' | 'ai' | 'hybrid' {
    // Check if webhook structure is standard
    const hasStandardStructure =
      webhook.name &&
      (webhook.shipping_address || webhook.customer) &&
      webhook.line_items &&
      webhook.line_items.length > 0;

    if (!hasStandardStructure) {
      return 'ai'; // Non-standard structure, use AI
    }

    // Check if there are complex/unusual fields
    const hasComplexItems = webhook.line_items.some(item => {
      const hasUnusualProperties = item.properties && item.properties.length > 10;
      const hasComplexTitle = item.title && item.title.length > 100;
      return hasUnusualProperties || hasComplexTitle;
    });

    if (hasComplexItems) {
      return 'hybrid'; // Complex items, use hybrid
    }

    return 'deterministic'; // Standard order, use deterministic
  }
}

export default HybridExtractor;
