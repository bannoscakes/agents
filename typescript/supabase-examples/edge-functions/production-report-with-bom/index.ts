/**
 * Supabase Edge Function: Production Report with BOM/Inventory
 *
 * This version includes ingredient requirements, stock checking, and shopping lists.
 *
 * Deploy with: supabase functions deploy production-report-with-bom
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CakeProductionReporterWithBOM } from '../../../cake-production-reporter/CakeProductionReporterWithBOM.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
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

    // Parse request
    const {
      startDate,
      endDate,
      format = 'text',
      checkInventory = true,
      includeShoppingList = true,
      alertOnLowStock = true,
      autoDeductInventory = false,
    } = await req.json().catch(() => ({}));

    // Create extended agent with BOM support
    const agent = new CakeProductionReporterWithBOM({
      supabaseClient,
      ordersTable: 'orders',
      reportFormat: format,
      includeDetails: true,
      bufferPercentage: 10,
      orderStatus: ['confirmed', 'paid'],
      deliveryMethod: 'database',
      reportsTable: 'production_reports',
      // Extended options
      checkInventory,
      includeShoppingList,
      alertOnLowStock,
      autoDeductInventory,
    });

    // Generate report with inventory analysis
    const report = await agent.execute(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Return extended report
    return new Response(
      JSON.stringify({
        success: true,
        report,
        inventory_summary: {
          all_available: report.inventory_availability?.all_available,
          missing_count: report.inventory_availability?.missing_ingredients_count,
          low_stock_count: report.low_stock_alerts?.length || 0,
          shortage_cost: report.inventory_availability?.total_shortage_cost,
        },
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
