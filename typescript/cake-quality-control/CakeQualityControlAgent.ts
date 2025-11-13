/**
 * Cake Quality Control Agent with AI Vision
 *
 * Analyzes uploaded cake photos for quality control:
 * - Text recognition (OCR) for messages on cakes
 * - Spelling verification
 * - Order verification
 * - Quality scoring
 * - Issue detection
 *
 * Powered by AI Vision (Claude/OpenAI)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface QualityControlConfig {
  supabaseClient: SupabaseClient;

  // AI Provider
  aiProvider?: 'anthropic' | 'openai';
  apiKey?: string;

  // Database tables
  ordersTable?: string;
  qcTable?: string;

  // Quality thresholds
  minimumQualityScore?: number;
  autoApprove?: boolean;

  // Analysis options
  checkSpelling?: boolean;
  verifyOrder?: boolean;
  detectIssues?: boolean;
}

export interface CakePhoto {
  id?: string;
  order_id: string;
  image_url: string;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface QualityCheckResult {
  id?: string;
  photo_id: string;
  order_id: string;

  // AI Analysis
  quality_score: number;
  text_on_cake: string | null;
  spelling_correct: boolean;
  spelling_errors: string[];

  // Order verification
  matches_order: boolean;
  order_discrepancies: string[];

  // Quality assessment
  issues_detected: string[];
  visual_quality: {
    decoration: number;
    cleanliness: number;
    presentation: number;
    color_accuracy: number;
  };

  // Decision
  approved: boolean;
  requires_review: boolean;
  reviewer_notes?: string;

  // Metadata
  ai_confidence: number;
  analysis_timestamp: string;
}

export interface OrderDetails {
  id: string;
  cake_type: string;
  message_on_cake?: string;
  decoration_notes?: string;
  color_scheme?: string;
  special_instructions?: string;
}

export class CakeQualityControlAgent {
  private config: Required<QualityControlConfig>;

  constructor(config: QualityControlConfig) {
    this.config = {
      supabaseClient: config.supabaseClient,
      aiProvider: config.aiProvider || 'anthropic',
      apiKey: config.apiKey || '',
      ordersTable: config.ordersTable || 'orders',
      qcTable: config.qcTable || 'quality_control_results',
      minimumQualityScore: config.minimumQualityScore ?? 7.0,
      autoApprove: config.autoApprove ?? false,
      checkSpelling: config.checkSpelling ?? true,
      verifyOrder: config.verifyOrder ?? true,
      detectIssues: config.detectIssues ?? true,
    };
  }

  /**
   * Analyze a cake photo for quality control
   */
  async execute(photo: CakePhoto): Promise<QualityCheckResult> {
    console.log(`Starting quality control for order ${photo.order_id}`);

    // Fetch order details
    const orderDetails = await this.getOrderDetails(photo.order_id);

    // Analyze image with AI vision
    const visionAnalysis = await this.analyzeImage(photo.image_url, orderDetails);

    // Check spelling if there's text
    let spellingCorrect = true;
    let spellingErrors: string[] = [];
    if (this.config.checkSpelling && visionAnalysis.text_on_cake) {
      const spellingCheck = this.checkSpelling(
        visionAnalysis.text_on_cake,
        orderDetails.message_on_cake
      );
      spellingCorrect = spellingCheck.correct;
      spellingErrors = spellingCheck.errors;
    }

    // Verify against order
    let matchesOrder = true;
    let orderDiscrepancies: string[] = [];
    if (this.config.verifyOrder) {
      const orderCheck = this.verifyAgainstOrder(visionAnalysis, orderDetails);
      matchesOrder = orderCheck.matches;
      orderDiscrepancies = orderCheck.discrepancies;
    }

    // Calculate overall quality score
    const qualityScore = this.calculateQualityScore(
      visionAnalysis,
      spellingCorrect,
      matchesOrder
    );

    // Determine approval
    const approved = this.config.autoApprove
      ? qualityScore >= this.config.minimumQualityScore && spellingCorrect && matchesOrder
      : false;

    const requiresReview = !approved || orderDiscrepancies.length > 0 || spellingErrors.length > 0;

    // Create result
    const result: QualityCheckResult = {
      photo_id: photo.id || '',
      order_id: photo.order_id,
      quality_score: qualityScore,
      text_on_cake: visionAnalysis.text_on_cake,
      spelling_correct: spellingCorrect,
      spelling_errors: spellingErrors,
      matches_order: matchesOrder,
      order_discrepancies: orderDiscrepancies,
      issues_detected: visionAnalysis.issues,
      visual_quality: visionAnalysis.visual_quality,
      approved,
      requires_review: requiresReview,
      ai_confidence: visionAnalysis.confidence,
      analysis_timestamp: new Date().toISOString(),
    };

    // Save to database
    await this.saveResult(result);

    console.log(`Quality control complete. Score: ${qualityScore}/10, Approved: ${approved}`);

    return result;
  }

  /**
   * Analyze image using AI vision
   */
  private async analyzeImage(imageUrl: string, orderDetails: OrderDetails): Promise<any> {
    const prompt = this.buildAnalysisPrompt(orderDetails);

    if (this.config.aiProvider === 'anthropic') {
      return await this.analyzeWithClaude(imageUrl, prompt);
    } else {
      return await this.analyzeWithOpenAI(imageUrl, prompt);
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(order: OrderDetails): string {
    return `You are a cake quality control inspector. Analyze this finished cake photo carefully.

Order Details:
- Cake Type: ${order.cake_type}
${order.message_on_cake ? `- Expected Message: "${order.message_on_cake}"` : ''}
${order.decoration_notes ? `- Decoration Notes: ${order.decoration_notes}` : ''}
${order.color_scheme ? `- Color Scheme: ${order.color_scheme}` : ''}
${order.special_instructions ? `- Special Instructions: ${order.special_instructions}` : ''}

Please analyze and provide:

1. TEXT ON CAKE: Extract any text written on the cake (be very careful with spelling)
2. QUALITY SCORES (0-10):
   - decoration: Overall decoration quality
   - cleanliness: Neatness and cleanliness
   - presentation: Overall presentation
   - color_accuracy: Color matching (if specified)
3. ISSUES: List any problems (smudges, crooked text, wrong colors, messy edges, etc.)
4. CONFIDENCE: Your confidence level in this analysis (0-1)

Respond in JSON format:
{
  "text_on_cake": "extracted text or null",
  "visual_quality": {
    "decoration": 8.5,
    "cleanliness": 9.0,
    "presentation": 8.0,
    "color_accuracy": 9.0
  },
  "issues": ["issue1", "issue2"],
  "confidence": 0.95
}`;
  }

  /**
   * Analyze with Claude Vision
   */
  private async analyzeWithClaude(imageUrl: string, prompt: string): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Analyze with OpenAI Vision
   */
  private async analyzeWithOpenAI(imageUrl: string, prompt: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Check spelling of text on cake
   */
  private checkSpelling(
    extractedText: string,
    expectedText?: string
  ): { correct: boolean; errors: string[] } {
    if (!expectedText) {
      return { correct: true, errors: [] };
    }

    const errors: string[] = [];

    // Normalize texts for comparison
    const normalizedExtracted = extractedText.toLowerCase().trim();
    const normalizedExpected = expectedText.toLowerCase().trim();

    // Exact match check
    if (normalizedExtracted === normalizedExpected) {
      return { correct: true, errors: [] };
    }

    // Check for common issues
    if (!normalizedExtracted.includes(normalizedExpected)) {
      errors.push(`Text mismatch: Expected "${expectedText}", found "${extractedText}"`);
    }

    // Word-by-word comparison
    const extractedWords = normalizedExtracted.split(/\s+/);
    const expectedWords = normalizedExpected.split(/\s+/);

    if (extractedWords.length !== expectedWords.length) {
      errors.push(`Word count mismatch: Expected ${expectedWords.length} words, found ${extractedWords.length}`);
    }

    for (let i = 0; i < Math.min(extractedWords.length, expectedWords.length); i++) {
      if (extractedWords[i] !== expectedWords[i]) {
        errors.push(`Word ${i + 1}: Expected "${expectedWords[i]}", found "${extractedWords[i]}"`);
      }
    }

    return {
      correct: errors.length === 0,
      errors,
    };
  }

  /**
   * Verify cake against order details
   */
  private verifyAgainstOrder(
    visionAnalysis: any,
    order: OrderDetails
  ): { matches: boolean; discrepancies: string[] } {
    const discrepancies: string[] = [];

    // Check message
    if (order.message_on_cake && visionAnalysis.text_on_cake) {
      if (visionAnalysis.text_on_cake.toLowerCase() !== order.message_on_cake.toLowerCase()) {
        discrepancies.push(`Message mismatch with order`);
      }
    }

    // Check quality thresholds
    if (visionAnalysis.visual_quality.decoration < 7.0) {
      discrepancies.push('Decoration quality below acceptable threshold');
    }

    if (visionAnalysis.visual_quality.cleanliness < 7.0) {
      discrepancies.push('Cleanliness below acceptable threshold');
    }

    // Check for issues
    if (visionAnalysis.issues.length > 2) {
      discrepancies.push(`Multiple issues detected (${visionAnalysis.issues.length})`);
    }

    return {
      matches: discrepancies.length === 0,
      discrepancies,
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    visionAnalysis: any,
    spellingCorrect: boolean,
    matchesOrder: boolean
  ): number {
    const visualScores = visionAnalysis.visual_quality;

    // Average of visual scores
    const visualAverage = (
      visualScores.decoration +
      visualScores.cleanliness +
      visualScores.presentation +
      visualScores.color_accuracy
    ) / 4;

    // Penalties
    let score = visualAverage;

    if (!spellingCorrect) {
      score -= 2.0; // Heavy penalty for spelling errors
    }

    if (!matchesOrder) {
      score -= 1.0;
    }

    if (visionAnalysis.issues.length > 0) {
      score -= (visionAnalysis.issues.length * 0.5);
    }

    // Clamp between 0 and 10
    return Math.max(0, Math.min(10, score));
  }

  /**
   * Get order details from database
   */
  private async getOrderDetails(orderId: string): Promise<OrderDetails> {
    const { data, error } = await this.config.supabaseClient
      .from(this.config.ordersTable)
      .select('id, cake_type, message_on_cake, decoration_notes, color_scheme, special_instructions')
      .eq('id', orderId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data as OrderDetails;
  }

  /**
   * Save quality control result to database
   */
  private async saveResult(result: QualityCheckResult): Promise<void> {
    const { error } = await this.config.supabaseClient
      .from(this.config.qcTable)
      .insert(result);

    if (error) {
      console.error('Failed to save QC result:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple photos
   */
  async processBatch(photos: CakePhoto[]): Promise<QualityCheckResult[]> {
    const results: QualityCheckResult[] = [];

    for (const photo of photos) {
      try {
        const result = await this.execute(photo);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process photo ${photo.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get QC history for an order
   */
  async getOrderQCHistory(orderId: string): Promise<QualityCheckResult[]> {
    const { data, error } = await this.config.supabaseClient
      .from(this.config.qcTable)
      .select('*')
      .eq('order_id', orderId)
      .order('analysis_timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch QC history: ${error.message}`);
    }

    return data as QualityCheckResult[];
  }
}

export default CakeQualityControlAgent;
