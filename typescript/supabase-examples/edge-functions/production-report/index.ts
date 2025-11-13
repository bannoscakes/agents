/**
 * Supabase Edge Function: Production Report Generator
 *
 * This Edge Function generates cake production reports and can be:
 * - Triggered manually via HTTP request
 * - Scheduled using pg_cron
 * - Called from your frontend
 *
 * Deploy with: supabase functions deploy production-report
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CakeProductionReporterAgent } from '../../../cake-production-reporter/CakeProductionReporter.ts';

// CORS headers for frontend requests
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request body
    const { startDate, endDate, format = 'text' } = await req.json().catch(() => ({}));

    // Create agent
    const agent = new CakeProductionReporterAgent({
      supabaseClient,
      ordersTable: 'orders',
      reportFormat: format,
      includeDetails: true,
      bufferPercentage: 10,
      orderStatus: ['confirmed', 'paid'],
      deliveryMethod: 'database',
      reportsTable: 'production_reports',
    });

    // Generate report
    const report = await agent.execute(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Return report
    return new Response(
      JSON.stringify({
        success: true,
        report,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating report:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
