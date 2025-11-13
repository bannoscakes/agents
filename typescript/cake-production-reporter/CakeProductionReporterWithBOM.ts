/**
 * Cake Production Reporter Agent with BOM/Inventory Integration
 *
 * Extended version that:
 * - Calculates ingredient requirements from BOMs
 * - Checks inventory availability
 * - Alerts on low stock
 * - Provides shopping lists
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  CakeProductionReporterAgent,
  type Order,
  type ProductionData,
  type Report,
  type CakeProductionReporterConfig,
} from './CakeProductionReporter.ts';

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  reorder_quantity: number;
  cost_per_unit?: number;
}

export interface IngredientRequirement {
  ingredient_name: string;
  required_quantity: number;
  unit: string;
  current_stock: number;
  shortage: number;
  is_sufficient: boolean;
  estimated_cost: number;
}

export interface InventoryAvailability {
  all_available: boolean;
  missing_ingredients_count: number;
  total_shortage_cost: number;
}

export interface ExtendedReport extends Report {
  ingredient_requirements?: IngredientRequirement[];
  inventory_availability?: InventoryAvailability;
  low_stock_alerts?: Ingredient[];
  shopping_list?: string;
}

export interface ExtendedConfig extends CakeProductionReporterConfig {
  // Inventory settings
  checkInventory?: boolean;
  includeShoppingList?: boolean;
  autoDeductInventory?: boolean;
  alertOnLowStock?: boolean;
}

export class CakeProductionReporterWithBOM extends CakeProductionReporterAgent {
  private extendedConfig: Required<ExtendedConfig>;

  constructor(config: ExtendedConfig) {
    super(config);

    // Add extended config defaults
    this.extendedConfig = {
      ...config,
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
      // Extended settings
      checkInventory: config.checkInventory ?? true,
      includeShoppingList: config.includeShoppingList ?? true,
      autoDeductInventory: config.autoDeductInventory ?? false,
      alertOnLowStock: config.alertOnLowStock ?? true,
    };
  }

  /**
   * Generate an extended production report with inventory analysis
   */
  async execute(
    startDate?: Date,
    endDate?: Date,
    customOrders?: Order[]
  ): Promise<ExtendedReport> {
    // Get base report
    const baseReport = await super.execute(startDate, endDate, customOrders);

    const extendedReport: ExtendedReport = { ...baseReport };

    // Add inventory analysis if enabled
    if (this.extendedConfig.checkInventory) {
      try {
        // Calculate ingredient requirements
        extendedReport.ingredient_requirements = await this.calculateIngredientRequirements(
          baseReport.production_data
        );

        // Check inventory availability
        extendedReport.inventory_availability = await this.checkInventoryAvailability(
          baseReport.production_data
        );

        // Get low stock alerts
        if (this.extendedConfig.alertOnLowStock) {
          extendedReport.low_stock_alerts = await this.getLowStockIngredients();
        }

        // Generate shopping list
        if (this.extendedConfig.includeShoppingList) {
          extendedReport.shopping_list = this.generateShoppingList(
            extendedReport.ingredient_requirements || []
          );
        }

        // Regenerate report with inventory info
        extendedReport.report_text = this.generateExtendedReport(extendedReport, startDate!, endDate!);

        // Auto-deduct inventory if enabled and user confirms
        if (this.extendedConfig.autoDeductInventory && extendedReport.inventory_availability?.all_available) {
          await this.deductInventory(baseReport.production_data, baseReport.date);
        }
      } catch (error) {
        console.error('Error calculating inventory requirements:', error);
        // Continue without inventory data
      }
    }

    return extendedReport;
  }

  /**
   * Calculate ingredient requirements using PostgreSQL function
   */
  private async calculateIngredientRequirements(
    productionData: ProductionData
  ): Promise<IngredientRequirement[]> {
    const { supabaseClient } = this.extendedConfig;

    const { data, error } = await supabaseClient.rpc('calculate_ingredient_requirements', {
      production_data: productionData,
    });

    if (error) {
      throw new Error(`Failed to calculate ingredients: ${error.message}`);
    }

    return data as IngredientRequirement[];
  }

  /**
   * Check inventory availability
   */
  private async checkInventoryAvailability(
    productionData: ProductionData
  ): Promise<InventoryAvailability> {
    const { supabaseClient } = this.extendedConfig;

    const { data, error } = await supabaseClient.rpc('check_inventory_availability', {
      production_data: productionData,
    });

    if (error) {
      throw new Error(`Failed to check inventory: ${error.message}`);
    }

    return (data as any[])[0] as InventoryAvailability;
  }

  /**
   * Get low stock ingredients
   */
  private async getLowStockIngredients(): Promise<Ingredient[]> {
    const { supabaseClient } = this.extendedConfig;

    const { data, error } = await supabaseClient
      .from('low_stock_ingredients')
      .select('*');

    if (error) {
      console.error('Failed to fetch low stock items:', error);
      return [];
    }

    return data as Ingredient[];
  }

  /**
   * Generate shopping list from requirements
   */
  private generateShoppingList(requirements: IngredientRequirement[]): string {
    const itemsNeeded = requirements.filter(req => req.shortage > 0);

    if (itemsNeeded.length === 0) {
      return 'All ingredients are in stock!';
    }

    const lines: string[] = [];
    lines.push('SHOPPING LIST');
    lines.push('='.repeat(50));

    for (const item of itemsNeeded) {
      lines.push(
        `☐ ${item.ingredient_name}: ${item.shortage.toFixed(2)} ${item.unit} ` +
        `(~$${item.estimated_cost.toFixed(2)})`
      );
    }

    const totalCost = itemsNeeded.reduce((sum, item) => sum + item.estimated_cost, 0);
    lines.push('='.repeat(50));
    lines.push(`TOTAL ESTIMATED COST: $${totalCost.toFixed(2)}`);

    return lines.join('\n');
  }

  /**
   * Deduct ingredients from inventory after production
   */
  private async deductInventory(productionData: ProductionData, reportId: string): Promise<void> {
    const { supabaseClient } = this.extendedConfig;

    const { error } = await supabaseClient.rpc('deduct_ingredients_for_production', {
      production_data: productionData,
      report_id: reportId,
    });

    if (error) {
      console.error('Failed to deduct inventory:', error);
      throw error;
    }

    console.log('Inventory deducted successfully');
  }

  /**
   * Generate extended report with inventory information
   */
  private generateExtendedReport(
    report: ExtendedReport,
    startDate: Date,
    endDate: Date
  ): string {
    const lines: string[] = [];

    lines.push('='.repeat(70));
    lines.push('🎂 CAKE PRODUCTION REPORT WITH INVENTORY ANALYSIS');
    lines.push('='.repeat(70));
    lines.push(`Report Generated: ${new Date().toLocaleString()}`);
    lines.push(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    lines.push(`Total Orders: ${report.total_orders}`);
    lines.push('');

    // Production requirements
    lines.push('PRODUCTION REQUIREMENTS:');
    lines.push('-'.repeat(70));

    const sorted = Object.entries(report.production_data).sort((a, b) => b[1] - a[1]);
    for (const [cakeType, quantity] of sorted) {
      lines.push(`  ${cakeType.padEnd(45)} ${quantity.toString().padStart(5)} cakes`);
    }

    const total = Object.values(report.production_data).reduce((a, b) => a + b, 0);
    lines.push('-'.repeat(70));
    lines.push(`TOTAL CAKES TO PRODUCE: ${total} cakes`);
    lines.push('');

    // Inventory availability
    if (report.inventory_availability) {
      lines.push('INVENTORY STATUS:');
      lines.push('-'.repeat(70));

      if (report.inventory_availability.all_available) {
        lines.push('✓ All ingredients are available in sufficient quantity');
      } else {
        lines.push(`⚠ WARNING: ${report.inventory_availability.missing_ingredients_count} ingredient(s) are insufficient`);
        lines.push(`  Estimated shortage cost: $${report.inventory_availability.total_shortage_cost.toFixed(2)}`);
      }
      lines.push('');
    }

    // Ingredient requirements
    if (report.ingredient_requirements && report.ingredient_requirements.length > 0) {
      lines.push('INGREDIENT REQUIREMENTS:');
      lines.push('-'.repeat(70));

      for (const req of report.ingredient_requirements) {
        const status = req.is_sufficient ? '✓' : '⚠';
        const stockInfo = req.is_sufficient
          ? `(in stock: ${req.current_stock.toFixed(2)} ${req.unit})`
          : `(need ${req.shortage.toFixed(2)} ${req.unit} more)`;

        lines.push(
          `  ${status} ${req.ingredient_name.padEnd(25)} ` +
          `${req.required_quantity.toFixed(2).padStart(8)} ${req.unit.padEnd(6)} ${stockInfo}`
        );
      }
      lines.push('');
    }

    // Low stock alerts
    if (report.low_stock_alerts && report.low_stock_alerts.length > 0) {
      lines.push('⚠ LOW STOCK ALERTS:');
      lines.push('-'.repeat(70));

      for (const item of report.low_stock_alerts) {
        const shortage = item.minimum_stock - item.current_stock;
        lines.push(
          `  ${item.name}: ${item.current_stock} ${item.unit} ` +
          `(minimum: ${item.minimum_stock} ${item.unit}, short by ${shortage.toFixed(2)})`
        );
      }
      lines.push('');
    }

    // Shopping list
    if (report.shopping_list) {
      lines.push('');
      lines.push(report.shopping_list);
      lines.push('');
    }

    lines.push('='.repeat(70));

    return lines.join('\n');
  }
}

export default CakeProductionReporterWithBOM;
