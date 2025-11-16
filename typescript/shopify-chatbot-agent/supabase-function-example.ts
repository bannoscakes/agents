/**
 * Supabase Edge Function Example for Shopify Chatbot
 *
 * Deploy this to: supabase/functions/shopify-chat/index.ts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ShopifyChatbotAgent } from './ShopifyChatbotAgent.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, customerEmail, customerName, conversationId } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Initialize chatbot
    const agent = new ShopifyChatbotAgent({
      shopifyStoreUrl: Deno.env.get('SHOPIFY_STORE_URL'),
      shopifyAccessToken: Deno.env.get('SHOPIFY_ACCESS_TOKEN'),
      llmProvider: 'anthropic',
      llmApiKey: Deno.env.get('ANTHROPIC_API_KEY'),
      storeName: Deno.env.get('STORE_NAME') || 'Our Store',
      brandVoice: Deno.env.get('BRAND_VOICE') || 'friendly and helpful',
      storePolicies: {
        shipping: Deno.env.get('POLICY_SHIPPING') || '',
        returns: Deno.env.get('POLICY_RETURNS') || '',
        support_email: Deno.env.get('SUPPORT_EMAIL') || '',
        support_phone: Deno.env.get('SUPPORT_PHONE') || ''
      }
    });

    // Process message
    const result = await agent.execute(message, {
      customerEmail,
      customerName
    });

    // Optionally save conversation to Supabase
    if (conversationId) {
      await supabaseClient
        .from('chat_conversations')
        .insert({
          conversation_id: conversationId,
          customer_email: customerEmail,
          message: message,
          response: result.response,
          timestamp: new Date().toISOString()
        });
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});
