/**
 * Supabase Edge Function: Cake Quality Control
 *
 * Handles cake photo uploads and AI-powered quality control analysis.
 *
 * Endpoints:
 * - POST /quality-control - Analyze an uploaded photo
 * - GET /quality-control/:orderId - Get QC results for an order
 *
 * Deploy with: supabase functions deploy quality-control
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CakeQualityControlAgent } from '../../../cake-quality-control/CakeQualityControlAgent.ts';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role for storage access
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname;

    // Route: Get QC results for order
    if (req.method === 'GET') {
      const orderId = path.split('/').pop();
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: 'Order ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const agent = new CakeQualityControlAgent({
        supabaseClient,
        apiKey: Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('OPENAI_API_KEY'),
      });

      const results = await agent.getOrderQCHistory(orderId);

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route: Analyze photo
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';

      // Handle multipart/form-data (file upload)
      if (contentType.includes('multipart/form-data')) {
        return await handlePhotoUpload(req, supabaseClient);
      }

      // Handle JSON (already uploaded photo)
      const { photoId, orderId, imageUrl } = await req.json();

      if (!orderId || !imageUrl) {
        return new Response(
          JSON.stringify({ error: 'orderId and imageUrl required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create QC agent
      const agent = new CakeQualityControlAgent({
        supabaseClient,
        aiProvider: Deno.env.get('AI_PROVIDER') === 'openai' ? 'openai' : 'anthropic',
        apiKey: Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('OPENAI_API_KEY'),
        checkSpelling: true,
        verifyOrder: true,
        detectIssues: true,
        minimumQualityScore: 7.0,
        autoApprove: true,
      });

      // Analyze photo
      const result = await agent.execute({
        id: photoId,
        order_id: orderId,
        image_url: imageUrl,
      });

      return new Response(
        JSON.stringify({
          success: true,
          result,
          summary: {
            approved: result.approved,
            quality_score: result.quality_score,
            spelling_correct: result.spelling_correct,
            matches_order: result.matches_order,
            requires_review: result.requires_review,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in quality control function:', error);

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

/**
 * Handle photo upload from multipart form data
 */
async function handlePhotoUpload(req: Request, supabaseClient: any) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !orderId) {
      return new Response(
        JSON.stringify({ error: 'file and orderId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}/${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('cake-photos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('cake-photos')
      .getPublicUrl(fileName);

    // Save to database
    const { data: photoData, error: dbError } = await supabaseClient
      .from('cake_photos')
      .insert({
        order_id: orderId,
        image_url: publicUrl,
        storage_path: fileName,
        uploaded_by: userId,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    // Trigger QC analysis
    const agent = new CakeQualityControlAgent({
      supabaseClient,
      aiProvider: Deno.env.get('AI_PROVIDER') === 'openai' ? 'openai' : 'anthropic',
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('OPENAI_API_KEY'),
      checkSpelling: true,
      verifyOrder: true,
      detectIssues: true,
      minimumQualityScore: 7.0,
      autoApprove: true,
    });

    const qcResult = await agent.execute({
      id: photoData.id,
      order_id: orderId,
      image_url: publicUrl,
    });

    return new Response(
      JSON.stringify({
        success: true,
        photo: photoData,
        qc_result: qcResult,
        summary: {
          approved: qcResult.approved,
          quality_score: qcResult.quality_score,
          spelling_correct: qcResult.spelling_correct,
          requires_review: qcResult.requires_review,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error uploading photo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
