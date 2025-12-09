/**
 * Usage Examples for Webhook Order Processor
 *
 * Shows how to use all three extraction methods
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DeterministicExtractor } from '../DeterministicExtractor.ts';
import { AIExtractor } from '../AIExtractor.ts';
import { HybridExtractor } from '../HybridExtractor.ts';

// Initialize Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Sample Shopify webhook
const sampleWebhook = {
  id: 6144726171805,
  name: '#B24517',
  email: 'lauren.aliferis101@gmail.com',
  created_at: '2025-11-06T16:58:13+11:00',
  total_price: '125.00',
  note: null,
  note_attributes: [
    {
      name: 'Local Delivery Date and Time',
      value: 'Sat 8 Nov 2025 between  8:00 AM and  6:00 PM',
    },
    {
      name: 'Delivery Method',
      value: 'Local delivery',
    },
  ],
  customer: {
    id: 7276817858717,
    email: 'lauren.aliferis101@gmail.com',
    first_name: 'Lauren',
    last_name: 'Aliferis',
    phone: '+61424413720',
  },
  shipping_address: {
    name: 'Lauren Aliferis',
    address1: '123 Cake Street',
    city: 'Sydney',
    zip: '2000',
    country: 'Australia',
    phone: '+61424413720',
  },
  line_items: [
    {
      id: 12889455829149,
      title: 'White Personalised Cake',
      variant_title: 'Medium / Vanilla',
      quantity: 1,
      price: '115.00',
      sku: 'WPC-MED-VAN',
      properties: [
        {
          name: 'Cake Writing',
          value: 'TandA',
        },
        {
          name: '_origin',
          value: 'customizer',
        },
      ],
    },
    {
      id: 12889455862917,
      title: 'Birthday Candles',
      variant_title: null,
      quantity: 1,
      price: '10.00',
      sku: 'CANDLES-001',
      properties: [],
    },
  ],
};

// =============================================================================
// Example 1: Deterministic Extractor (FREE, Fast)
// =============================================================================

async function example1_deterministic() {
  console.log('\n=== Example 1: Deterministic Extractor ===\n');

  const extractor = new DeterministicExtractor();

  // Extract order
  const startTime = Date.now();
  const extracted = extractor.extract(sampleWebhook);
  const duration = Date.now() - startTime;

  console.log('Extracted Order:');
  console.log(JSON.stringify(extracted, null, 2));
  console.log(`\nProcessing time: ${duration}ms`);
  console.log('Cost: $0.00 (FREE!)');

  // Split if multi-cake
  const orders = extractor.splitOrder(extracted);
  console.log(`\nSplit into ${orders.length} order(s)`);
  orders.forEach((order, i) => {
    console.log(`\n${i + 1}. ${order.order_number}`);
    console.log(`   Items: ${order.items.map(item => item.title).join(', ')}`);
    console.log(`   Price: $${order.total_price}`);
  });
}

// =============================================================================
// Example 2: AI Extractor (Guided by Liquid)
// =============================================================================

async function example2_ai() {
  console.log('\n=== Example 2: AI Extractor ===\n');

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for AI extraction');
  }

  const extractor = new AIExtractor({
    apiKey,
    model: 'claude-3-haiku-20240307',
  });

  // Extract order
  const startTime = Date.now();
  const extracted = await extractor.extract(sampleWebhook);
  const duration = Date.now() - startTime;

  console.log('Extracted Order:');
  console.log(JSON.stringify(extracted, null, 2));
  console.log(`\nProcessing time: ${duration}ms`);
  console.log('Cost: ~$0.0001');

  // Split if multi-cake
  const orders = extractor.splitOrder(extracted);
  console.log(`\nSplit into ${orders.length} order(s)`);
}

// =============================================================================
// Example 3: Hybrid Extractor (Recommended for Production)
// =============================================================================

async function example3_hybrid() {
  console.log('\n=== Example 3: Hybrid Extractor (RECOMMENDED) ===\n');

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for Hybrid extraction');
  }

  const extractor = new HybridExtractor({
    apiKey,
    requireCustomerName: true,
    requireDeliveryDate: true,
    useAIForValidation: true,
    useAIForMissingFields: true,
  });

  // Extract order
  const result = await extractor.extract(sampleWebhook);

  console.log('Extraction Result:');
  console.log(`Method used: ${result.method}`);
  console.log(`AI used: ${result.ai_used}`);
  console.log(`Processing time: ${result.processing_time_ms}ms`);
  console.log(`Cost: $${result.cost_estimate}`);

  if (result.validation_issues.length > 0) {
    console.log('\nValidation Issues Found:');
    result.validation_issues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (result.ai_corrections.length > 0) {
    console.log('\nAI Corrections:');
    result.ai_corrections.forEach(correction => console.log(`  - ${correction}`));
  }

  console.log('\nExtracted Order:');
  console.log(JSON.stringify(result.order, null, 2));

  // Process and split
  const results = await extractor.process(sampleWebhook);
  console.log(`\nSplit into ${results.length} order(s)`);
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.order.order_number}`);
    console.log(`   Method: ${r.method} (AI used: ${r.ai_used})`);
    console.log(`   Items: ${r.order.items.map(item => item.title).join(', ')}`);
  });
}

// =============================================================================
// Example 4: Full Production Workflow
// =============================================================================

async function example4_production() {
  console.log('\n=== Example 4: Production Workflow ===\n');

  // Fetch pending webhooks from Supabase
  const { data: webhooks, error } = await supabase
    .from('webhook_inbox_bannos')
    .select('*')
    .eq('processed', false)
    .order('received_at', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Failed to fetch webhooks:', error);
    return;
  }

  console.log(`Found ${webhooks?.length || 0} pending webhooks\n`);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for Hybrid extraction');
  }

  const extractor = new HybridExtractor({
    apiKey,
  });

  for (const webhook of webhooks || []) {
    console.log(`\nProcessing webhook ${webhook.id}...`);

    try {
      // Extract and split
      const results = await extractor.process(webhook.payload);

      // Save orders
      for (const result of results) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: result.order.order_number,
            customer_name: result.order.customer_name,
            customer_email: result.order.customer_email,
            customer_phone: result.order.customer_phone,
            delivery_date: result.order.delivery_date,
            delivery_method: result.order.delivery_method,
            total_price: result.order.total_price,
            notes: result.order.notes,
            shop: 'bannos',
            status: 'pending',
            webhook_id: webhook.id,
            is_split: results.length > 1,
            parent_order_number: results.length > 1 ? results[0].order.order_number : null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Save cart items
        if (result.order.items && result.order.items.length > 0) {
          const cartItems = result.order.items.map(item => ({
            order_id: order.id,
            item_type: item.type,
            item_name: item.title,
            quantity: item.quantity,
            price: item.price,
            details: {
              variant_title: item.variant_title,
              cake_writing: item.cake_writing,
              properties: item.properties,
            },
          }));

          await supabase.from('order_carts').insert(cartItems);
        }

        console.log(`  ✓ Created order ${result.order.order_number}`);
      }

      // Mark webhook as processed
      await supabase
        .from('webhook_inbox_bannos')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhook.id);

      console.log(`  ✓ Processed ${results.length} order(s)`);

    } catch (error) {
      console.error(`  ✗ Failed:`, error.message);

      // Log error
      await supabase
        .from('webhook_inbox_bannos')
        .update({ error: error.message })
        .eq('id', webhook.id);
    }
  }
}

// =============================================================================
// Example 5: Method Recommendation
// =============================================================================

async function example5_recommendation() {
  console.log('\n=== Example 5: Method Recommendation ===\n');

  const recommendation = HybridExtractor.recommendMethod(sampleWebhook);

  console.log(`Recommended method: ${recommendation}`);
  console.log('\nWhy:');

  const hasStandardStructure =
    sampleWebhook.name &&
    (sampleWebhook.shipping_address || sampleWebhook.customer) &&
    sampleWebhook.line_items &&
    sampleWebhook.line_items.length > 0;

  if (hasStandardStructure) {
    console.log('  ✓ Standard Shopify webhook structure');
  } else {
    console.log('  ✗ Non-standard structure detected');
  }

  const hasComplexItems = sampleWebhook.line_items.some(item => {
    const hasUnusualProperties = item.properties && item.properties.length > 10;
    const hasComplexTitle = item.title && item.title.length > 100;
    return hasUnusualProperties || hasComplexTitle;
  });

  if (hasComplexItems) {
    console.log('  ⚠ Complex items detected');
  } else {
    console.log('  ✓ Simple items');
  }
}

// =============================================================================
// Example 6: Batch Processing with Stats
// =============================================================================

async function example6_batch_with_stats() {
  console.log('\n=== Example 6: Batch Processing with Stats ===\n');

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for Hybrid extraction');
  }

  const extractor = new HybridExtractor({
    apiKey,
  });

  const stats = {
    total: 0,
    deterministic: 0,
    hybrid: 0,
    ai: 0,
    totalCost: 0,
    totalTime: 0,
  };

  // Fetch pending webhooks
  const { data: webhooks } = await supabase
    .from('webhook_inbox_bannos')
    .select('*')
    .eq('processed', false)
    .limit(10);

  for (const webhook of webhooks || []) {
    const result = await extractor.extract(webhook.payload);

    stats.total++;
    stats[result.method]++;
    stats.totalCost += result.cost_estimate;
    stats.totalTime += result.processing_time_ms;
  }

  console.log('Batch Processing Stats:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Deterministic: ${stats.deterministic} (${((stats.deterministic / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  Hybrid: ${stats.hybrid} (${((stats.hybrid / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  AI Only: ${stats.ai} (${((stats.ai / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  Total Cost: $${stats.totalCost.toFixed(4)}`);
  console.log(`  Avg Cost: $${(stats.totalCost / stats.total).toFixed(6)} per order`);
  console.log(`  Total Time: ${stats.totalTime}ms`);
  console.log(`  Avg Time: ${(stats.totalTime / stats.total).toFixed(0)}ms per order`);
}

// =============================================================================
// Run Examples
// =============================================================================

if (import.meta.main) {
  console.log('Webhook Order Processor - Usage Examples');
  console.log('========================================');

  // Run examples
  await example1_deterministic();
  await example2_ai();
  await example3_hybrid();
  await example5_recommendation();

  // Uncomment to run production examples:
  // await example4_production();
  // await example6_batch_with_stats();

  console.log('\n✓ All examples completed!\n');
}
