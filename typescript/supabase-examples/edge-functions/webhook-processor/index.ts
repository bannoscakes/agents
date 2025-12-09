/**
 * Webhook Processor Edge Function
 *
 * Auto-processes webhooks from inbox tables and creates clean orders.
 *
 * Endpoints:
 * - POST /webhook-processor (process single webhook)
 * - POST /webhook-processor/batch (process all pending)
 * - GET /webhook-processor/stats (get processing stats)
 *
 * Deploy:
 * supabase functions deploy webhook-processor
 *
 * Environment Variables Required:
 * - ANTHROPIC_API_KEY (for AI/Hybrid modes)
 * - EXTRACTION_METHOD (deterministic|ai|hybrid) - default: hybrid
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DeterministicExtractor } from '../../../webhook-order-processor/DeterministicExtractor.ts';
import { AIExtractor } from '../../../webhook-order-processor/AIExtractor.ts';
import { HybridExtractor } from '../../../webhook-order-processor/HybridExtractor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRequest {
  webhook_id: string;
  shop: 'bannos' | 'flourlane';
  method?: 'deterministic' | 'ai' | 'hybrid';
}

interface BatchProcessRequest {
  shop?: 'bannos' | 'flourlane'; // If omitted, process both
  limit?: number;
  method?: 'deterministic' | 'ai' | 'hybrid';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const path = url.pathname;

    // Route: GET /webhook-processor/stats
    if (req.method === 'GET' && path.endsWith('/stats')) {
      return await handleStats(supabaseClient);
    }

    // Route: POST /webhook-processor/batch
    if (req.method === 'POST' && path.endsWith('/batch')) {
      const body: BatchProcessRequest = await req.json();
      return await handleBatch(supabaseClient, body);
    }

    // Route: POST /webhook-processor (default)
    if (req.method === 'POST') {
      const body: ProcessRequest = await req.json();
      return await handleProcess(supabaseClient, body);
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Process a single webhook
 */
async function handleProcess(supabaseClient: any, body: ProcessRequest) {
  const { webhook_id, shop, method = 'hybrid' } = body;

  if (!webhook_id || !shop) {
    return new Response(
      JSON.stringify({ error: 'webhook_id and shop are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`Processing webhook ${webhook_id} from ${shop} using ${method} method`);

  const startTime = Date.now();

  try {
    // Fetch webhook
    const table = shop === 'bannos' ? 'webhook_inbox_bannos' : 'webhook_inbox_flourlane';
    const { data: webhook, error: fetchError } = await supabaseClient
      .from(table)
      .select('*')
      .eq('id', webhook_id)
      .single();

    if (fetchError) throw fetchError;
    if (webhook.processed) {
      return new Response(
        JSON.stringify({ message: 'Webhook already processed', orders: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract based on method
    let extractedOrders;
    let aiUsed = false;
    let aiCorrections: string[] = [];

    if (method === 'deterministic') {
      const extractor = new DeterministicExtractor();
      const extracted = extractor.extract(webhook.payload);
      extractedOrders = extractor.splitOrder(extracted);

    } else if (method === 'ai') {
      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for AI extraction method');
      }

      const extractor = new AIExtractor({
        apiKey,
      });
      const extracted = await extractor.extract(webhook.payload);
      extractedOrders = extractor.splitOrder(extracted);
      aiUsed = true;

    } else { // hybrid
      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for Hybrid extraction method');
      }

      const extractor = new HybridExtractor({
        apiKey,
      });
      const results = await extractor.process(webhook.payload);
      extractedOrders = results.map(r => r.order);
      aiUsed = results.some(r => r.ai_used);
      aiCorrections = results.flatMap(r => r.ai_corrections);
    }

    // Save orders to database
    const savedOrders = [];
    for (const order of extractedOrders) {
      // Insert order
      const { data: savedOrder, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          delivery_date: order.delivery_date,
          delivery_method: order.delivery_method,
          total_price: order.total_price,
          notes: order.notes,
          shop: shop,
          status: 'pending',
          webhook_id: webhook_id,
          is_split: extractedOrders.length > 1,
          parent_order_number: extractedOrders.length > 1 ? extractedOrders[0].order_number : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order cart items
      if (order.items && order.items.length > 0) {
        const cartItems = order.items.map(item => ({
          order_id: savedOrder.id,
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

        const { error: cartError } = await supabaseClient
          .from('order_carts')
          .insert(cartItems);

        if (cartError) {
          console.error('Failed to save cart items:', cartError);
          throw new Error(`Failed to save cart items: ${cartError.message}`);
        }
      }

      savedOrders.push(savedOrder);
    }

    // Mark webhook as processed
    await supabaseClient
      .from(table)
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhook_id);

    // Log processing
    const processingTime = Date.now() - startTime;
    await supabaseClient
      .from('webhook_processing_log')
      .insert({
        webhook_id,
        shop,
        action: 'completed',
        orders_created: savedOrders.length,
        processing_time_ms: processingTime,
        ai_tokens_used: aiUsed ? 1000 : 0, // Approximate
      });

    console.log(`✓ Processed webhook ${webhook_id} into ${savedOrders.length} order(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        orders_created: savedOrders.length,
        orders: savedOrders,
        method_used: method,
        ai_used: aiUsed,
        ai_corrections: aiCorrections,
        processing_time_ms: processingTime,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Processing error:', error);

    // Log error
    const table = shop === 'bannos' ? 'webhook_inbox_bannos' : 'webhook_inbox_flourlane';
    await supabaseClient
      .from(table)
      .update({ error: error.message })
      .eq('id', webhook_id);

    await supabaseClient
      .from('webhook_processing_log')
      .insert({
        webhook_id,
        shop,
        action: 'failed',
        error_message: error.message,
        processing_time_ms: Date.now() - startTime,
      });

    throw error;
  }
}

/**
 * Process all pending webhooks (batch mode)
 */
async function handleBatch(supabaseClient: any, body: BatchProcessRequest) {
  const { shop, limit = 10, method = 'hybrid' } = body;

  console.log(`Batch processing: shop=${shop || 'all'}, limit=${limit}, method=${method}`);

  const results = {
    bannos: { processed: 0, errors: 0 },
    flourlane: { processed: 0, errors: 0 },
  };

  // Process Bannos webhooks
  if (!shop || shop === 'bannos') {
    const { data: webhooks } = await supabaseClient
      .from('webhook_inbox_bannos')
      .select('id')
      .eq('processed', false)
      .order('received_at', { ascending: true })
      .limit(limit);

    for (const webhook of webhooks || []) {
      try {
        await handleProcess(supabaseClient, {
          webhook_id: webhook.id,
          shop: 'bannos',
          method,
        });
        results.bannos.processed++;
      } catch (error) {
        results.bannos.errors++;
      }
    }
  }

  // Process Flourlane webhooks
  if (!shop || shop === 'flourlane') {
    const { data: webhooks } = await supabaseClient
      .from('webhook_inbox_flourlane')
      .select('id')
      .eq('processed', false)
      .order('received_at', { ascending: true })
      .limit(limit);

    for (const webhook of webhooks || []) {
      try {
        await handleProcess(supabaseClient, {
          webhook_id: webhook.id,
          shop: 'flourlane',
          method,
        });
        results.flourlane.processed++;
      } catch (error) {
        results.flourlane.errors++;
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      results,
      total_processed: results.bannos.processed + results.flourlane.processed,
      total_errors: results.bannos.errors + results.flourlane.errors,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get processing statistics
 */
async function handleStats(supabaseClient: any) {
  // Get pending counts
  const { count: bannosPending } = await supabaseClient
    .from('webhook_inbox_bannos')
    .select('*', { count: 'exact', head: true })
    .eq('processed', false);

  const { count: flourlanePending } = await supabaseClient
    .from('webhook_inbox_flourlane')
    .select('*', { count: 'exact', head: true })
    .eq('processed', false);

  // Get processed counts
  const { count: bannosProcessed } = await supabaseClient
    .from('webhook_inbox_bannos')
    .select('*', { count: 'exact', head: true })
    .eq('processed', true);

  const { count: flourlaneProcessed } = await supabaseClient
    .from('webhook_inbox_flourlane')
    .select('*', { count: 'exact', head: true })
    .eq('processed', true);

  // Get error counts
  const { count: bannosErrors } = await supabaseClient
    .from('webhook_inbox_bannos')
    .select('*', { count: 'exact', head: true })
    .not('error', 'is', null);

  const { count: flourlaneErrors } = await supabaseClient
    .from('webhook_inbox_flourlane')
    .select('*', { count: 'exact', head: true })
    .not('error', 'is', null);

  return new Response(
    JSON.stringify({
      bannos: {
        pending: bannosPending || 0,
        processed: bannosProcessed || 0,
        errors: bannosErrors || 0,
      },
      flourlane: {
        pending: flourlanePending || 0,
        processed: flourlaneProcessed || 0,
        errors: flourlaneErrors || 0,
      },
      total: {
        pending: (bannosPending || 0) + (flourlanePending || 0),
        processed: (bannosProcessed || 0) + (flourlaneProcessed || 0),
        errors: (bannosErrors || 0) + (flourlaneErrors || 0),
      },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
