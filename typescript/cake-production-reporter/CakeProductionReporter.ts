/**
 * Cake Production Reporter Agent
 *
 * A TypeScript agent for Supabase/Deno that generates bi-weekly production reports
 * showing how many cakes need to be cooked based on incoming orders.
 *
 * Features:
 * - Works with Supabase PostgreSQL
 * - Can run as a Supabase Edge Function
 * - Scheduled via pg_cron or external scheduler
 * - Integrates with your TypeScript/React frontend
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface Order {
  id?: string;
  cake_type: string;
  quantity: number;
  order_date: string | Date;
  customer_name?: string;
  status?: string;
}

export interface ProductionData {
  [cakeType: string]: number;
}

export interface Report {
  date: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  production_data: ProductionData;
  report_text?: string;
  report_html?: string;
}

export interface CakeProductionReporterConfig {
  // Scheduling
  reportDays?: string[]; // ['Monday', 'Thursday']
  reportTime?: string; // '08:00'

  // Data source
  supabaseClient?: SupabaseClient;
  ordersTable?: string;
  customQuery?: string;

  // Report settings
  reportFormat?: 'text' | 'html' | 'json';
  includeDetails?: boolean;
  bufferPercentage?: number;

  // Filters
  orderStatus?: string[]; // ['confirmed', 'paid']

  // Delivery
  deliveryMethod?: 'database' | 'email' | 'webhook' | 'return';
  reportsTable?: string;
  webhookUrl?: string;
  emailTo?: string[];
}

export class CakeProductionReporterAgent {
  private config: Required<CakeProductionReporterConfig>;
  private lastReportDate: Date | null = null;

  constructor(config: CakeProductionReporterConfig) {
    // Set defaults
    this.config = {
      reportDays: config.reportDays || ['Monday', 'Thursday'],
      reportTime: config.reportTime || '08:00',
      supabaseClient: config.supabaseClient!,
      ordersTable: config.ordersTable || 'orders',
      customQuery: config.customQuery || '',
      reportFormat: config.reportFormat || 'text',
      includeDetails: config.includeDetails ?? true,
      bufferPercentage: config.bufferPercentage ?? 10,
      orderStatus: config.orderStatus || ['confirmed', 'paid'],
      deliveryMethod: config.deliveryMethod || 'return',
      reportsTable: config.reportsTable || 'production_reports',
      webhookUrl: config.webhookUrl || '',
      emailTo: config.emailTo || [],
    };
  }

  /**
   * Generate a production report
   */
  async execute(
    startDate?: Date,
    endDate?: Date,
    customOrders?: Order[]
  ): Promise<Report> {
    // Determine date range
    if (!startDate) {
      if (this.lastReportDate) {
        startDate = this.lastReportDate;
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }
    }

    if (!endDate) {
      endDate = new Date();
    }

    console.log(`Generating report for ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch orders
    const orders = customOrders || await this.fetchOrders(startDate, endDate);

    // Aggregate by cake type
    const productionData = this.aggregateOrders(orders);

    // Apply safety buffer
    const bufferedData = this.applyBuffer(productionData);

    // Generate formatted report
    const reportText = this.generateReport(bufferedData, startDate, endDate, orders);

    // Create report object
    const report: Report = {
      date: new Date().toISOString(),
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
      total_orders: orders.length,
      production_data: bufferedData,
      report_text: this.config.reportFormat === 'text' ? reportText : undefined,
      report_html: this.config.reportFormat === 'html' ? reportText : undefined,
    };

    // Deliver report
    await this.deliverReport(report);

    // Update last report date
    this.lastReportDate = endDate;

    console.log(`Report generated: ${Object.values(bufferedData).reduce((a, b) => a + b, 0)} total cakes`);

    return report;
  }

  /**
   * Fetch orders from Supabase
   */
  private async fetchOrders(startDate: Date, endDate: Date): Promise<Order[]> {
    const { supabaseClient, ordersTable, orderStatus, customQuery } = this.config;

    if (!supabaseClient) {
      throw new Error('Supabase client not configured');
    }

    // Use custom query if provided
    if (customQuery) {
      const { data, error } = await supabaseClient.rpc('get_orders_for_production', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return data as Order[];
    }

    // Default query
    let query = supabaseClient
      .from(ordersTable)
      .select('id, cake_type, quantity, order_date, customer_name, status')
      .gte('order_date', startDate.toISOString())
      .lte('order_date', endDate.toISOString());

    // Filter by status if configured
    if (orderStatus.length > 0) {
      query = query.in('status', orderStatus);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    console.log(`Fetched ${data?.length || 0} orders`);
    return (data as Order[]) || [];
  }

  /**
   * Aggregate orders by cake type
   */
  private aggregateOrders(orders: Order[]): ProductionData {
    const aggregation: ProductionData = {};

    for (const order of orders) {
      const cakeType = order.cake_type || 'Unknown';
      const quantity = order.quantity || 1;

      if (!aggregation[cakeType]) {
        aggregation[cakeType] = 0;
      }

      aggregation[cakeType] += quantity;
    }

    return aggregation;
  }

  /**
   * Apply safety buffer to production quantities
   */
  private applyBuffer(productionData: ProductionData): ProductionData {
    const { bufferPercentage } = this.config;

    if (bufferPercentage <= 0) {
      return productionData;
    }

    const buffered: ProductionData = {};

    for (const [cakeType, quantity] of Object.entries(productionData)) {
      const buffer = Math.ceil(quantity * bufferPercentage / 100);
      buffered[cakeType] = quantity + buffer;
    }

    console.log(`Applied ${bufferPercentage}% safety buffer`);
    return buffered;
  }

  /**
   * Generate formatted report
   */
  private generateReport(
    productionData: ProductionData,
    startDate: Date,
    endDate: Date,
    orders: Order[]
  ): string {
    const { reportFormat } = this.config;

    if (reportFormat === 'html') {
      return this.generateHtmlReport(productionData, startDate, endDate, orders);
    } else if (reportFormat === 'json') {
      return JSON.stringify({
        production: productionData,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        total_orders: orders.length,
        total_cakes: Object.values(productionData).reduce((a, b) => a + b, 0),
      }, null, 2);
    } else {
      return this.generateTextReport(productionData, startDate, endDate, orders);
    }
  }

  /**
   * Generate plain text report
   */
  private generateTextReport(
    productionData: ProductionData,
    startDate: Date,
    endDate: Date,
    orders: Order[]
  ): string {
    const { bufferPercentage, includeDetails } = this.config;
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('🎂 CAKE PRODUCTION REPORT');
    lines.push('='.repeat(70));
    lines.push(`Report Generated: ${new Date().toLocaleString()}`);
    lines.push(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    lines.push(`Total Orders: ${orders.length}`);
    lines.push('');

    lines.push('PRODUCTION REQUIREMENTS:');
    lines.push('-'.repeat(70));

    if (Object.keys(productionData).length === 0) {
      lines.push('No cakes to produce this period.');
    } else {
      // Sort by quantity (descending)
      const sorted = Object.entries(productionData).sort((a, b) => b[1] - a[1]);

      for (const [cakeType, quantity] of sorted) {
        lines.push(`  ${cakeType.padEnd(45)} ${quantity.toString().padStart(5)} cakes`);
      }
    }

    lines.push('-'.repeat(70));
    const total = Object.values(productionData).reduce((a, b) => a + b, 0);
    lines.push(`TOTAL CAKES TO PRODUCE: ${total} cakes`);

    if (bufferPercentage > 0) {
      lines.push(`(Includes ${bufferPercentage}% safety buffer)`);
    }

    lines.push('='.repeat(70));

    if (includeDetails && orders.length > 0) {
      lines.push('');
      lines.push('ORDER DETAILS:');
      lines.push('-'.repeat(70));

      for (let i = 0; i < Math.min(orders.length, 20); i++) {
        const order = orders[i];
        const orderDate = new Date(order.order_date).toLocaleDateString();
        lines.push(
          `  ${(i + 1).toString().padStart(2)}. ${order.cake_type.padEnd(30)} ` +
          `x${order.quantity.toString().padStart(2)} - ${orderDate}`
        );
      }

      if (orders.length > 20) {
        lines.push(`  ... and ${orders.length - 20} more orders`);
      }

      lines.push('='.repeat(70));
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(
    productionData: ProductionData,
    startDate: Date,
    endDate: Date,
    orders: Order[]
  ): string {
    const { bufferPercentage } = this.config;
    const total = Object.values(productionData).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(productionData).sort((a, b) => b[1] - a[1]);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cake Production Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2d3748; margin: 0 0 10px 0; }
        .summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary p { margin: 8px 0; }
        .total { font-size: 1.5em; font-weight: bold; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #4a5568; color: white; padding: 12px; text-align: left; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        tr:hover { background: #f7fafc; }
        .cake-type { font-weight: 500; }
        .quantity { text-align: right; font-weight: bold; color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎂 Cake Production Report</h1>

        <div class="summary">
            <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Period:</strong> ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
            <p><strong>Total Orders:</strong> ${orders.length}</p>
            <p class="total">TOTAL CAKES TO PRODUCE: ${total} cakes</p>
            ${bufferPercentage > 0 ? `<p><em>(Includes ${bufferPercentage}% safety buffer)</em></p>` : ''}
        </div>

        <h2>Production Requirements</h2>
        <table>
            <thead>
                <tr>
                    <th>Cake Type</th>
                    <th style="text-align: right;">Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(([cakeType, quantity]) => `
                <tr>
                    <td class="cake-type">${cakeType}</td>
                    <td class="quantity">${quantity}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Deliver the report
   */
  private async deliverReport(report: Report): Promise<void> {
    const { deliveryMethod } = this.config;

    if (deliveryMethod === 'database') {
      await this.saveToDatabase(report);
    } else if (deliveryMethod === 'webhook') {
      await this.sendToWebhook(report);
    }
    // 'return' delivery method just returns the report
  }

  /**
   * Save report to database
   */
  private async saveToDatabase(report: Report): Promise<void> {
    const { supabaseClient, reportsTable } = this.config;

    if (!supabaseClient) return;

    const { error } = await supabaseClient
      .from(reportsTable)
      .insert({
        report_date: report.date,
        period_start: report.period_start,
        period_end: report.period_end,
        total_orders: report.total_orders,
        production_data: report.production_data,
        report_text: report.report_text,
        report_html: report.report_html,
      });

    if (error) {
      console.error('Failed to save report to database:', error);
    } else {
      console.log('Report saved to database');
    }
  }

  /**
   * Send report to webhook
   */
  private async sendToWebhook(report: Report): Promise<void> {
    const { webhookUrl } = this.config;

    if (!webhookUrl) return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      console.log('Report sent to webhook');
    } catch (error) {
      console.error('Failed to send to webhook:', error);
    }
  }

  /**
   * Check if report should run now based on schedule
   */
  shouldRunNow(): boolean {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeStr = now.toTimeString().substring(0, 5); // HH:MM

    return (
      this.config.reportDays.includes(dayName) &&
      timeStr === this.config.reportTime
    );
  }

  /**
   * Get next scheduled report date
   */
  getNextReportDate(): Date {
    const now = new Date();
    const dayMap: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const targetDays = this.config.reportDays
      .map(day => dayMap[day])
      .filter(d => d !== undefined);

    // Find next occurrence
    for (let daysAhead = 0; daysAhead < 8; daysAhead++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + daysAhead);

      if (targetDays.includes(checkDate.getDay())) {
        const [hour, minute] = this.config.reportTime.split(':').map(Number);
        checkDate.setHours(hour, minute, 0, 0);

        if (checkDate > now) {
          return checkDate;
        }
      }
    }

    return now;
  }
}

// Export for use in other modules
export default CakeProductionReporterAgent;
