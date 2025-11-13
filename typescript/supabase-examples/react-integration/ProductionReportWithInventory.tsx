/**
 * Production Report Page with Inventory - React Component
 *
 * This component integrates the Cake Production Reporter with BOM/Inventory
 * showing ingredient requirements, stock levels, and shopping lists.
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ProductionData {
  [cakeType: string]: number;
}

interface IngredientRequirement {
  ingredient_name: string;
  required_quantity: number;
  unit: string;
  current_stock: number;
  shortage: number;
  is_sufficient: boolean;
  estimated_cost: number;
}

interface InventoryAvailability {
  all_available: boolean;
  missing_ingredients_count: number;
  total_shortage_cost: number;
}

interface LowStockItem {
  name: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  shortage: number;
}

interface ExtendedReport {
  id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  production_data: ProductionData;
  ingredient_requirements?: IngredientRequirement[];
  inventory_availability?: InventoryAvailability;
  low_stock_alerts?: LowStockItem[];
  shopping_list?: string;
  report_text?: string;
  report_html?: string;
}

export default function ProductionReportWithInventory() {
  const [reports, setReports] = useState<ExtendedReport[]>([]);
  const [latestReport, setLatestReport] = useState<ExtendedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('production_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      setReports(data || []);
      if (data && data.length > 0) {
        setLatestReport(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('production-report', {
        body: {
          format: 'html',
          checkInventory: true,
          includeShoppingList: true,
        },
      });

      if (error) throw error;

      if (data.success) {
        await fetchReports();
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCakes = (productionData: ProductionData): number => {
    return Object.values(productionData).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalCost = (requirements: IngredientRequirement[]): number => {
    return requirements.reduce((sum, req) => sum + req.estimated_cost, 0);
  };

  const getShortageCount = (requirements: IngredientRequirement[]): number => {
    return requirements.filter(req => !req.is_sufficient).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎂 Production Reports & Inventory
          </h1>
          <p className="mt-2 text-gray-600">
            Production planning with ingredient requirements and inventory tracking
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate New Report'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Latest Report */}
        {latestReport && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Total Cakes Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Total Cakes</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {getTotalCakes(latestReport.production_data)}
                </p>
              </div>

              {/* Orders Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {latestReport.total_orders}
                </p>
              </div>

              {/* Inventory Status Card */}
              {latestReport.inventory_availability && (
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Inventory Status</p>
                  <p className={`text-2xl font-bold ${
                    latestReport.inventory_availability.all_available
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }`}>
                    {latestReport.inventory_availability.all_available ? '✓ Ready' : '⚠ Check Stock'}
                  </p>
                </div>
              )}

              {/* Low Stock Alerts Card */}
              {latestReport.low_stock_alerts && (
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Low Stock Items</p>
                  <p className={`text-3xl font-bold ${
                    latestReport.low_stock_alerts.length === 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {latestReport.low_stock_alerts.length}
                  </p>
                </div>
              )}
            </div>

            {/* Production Requirements */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Production Requirements</h2>
              </div>
              <div className="p-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cake Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(latestReport.production_data)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cakeType, quantity]) => (
                        <tr key={cakeType}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{cakeType}</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-indigo-600">{quantity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ingredient Requirements */}
            {latestReport.ingredient_requirements && latestReport.ingredient_requirements.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Ingredient Requirements</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Cost: <span className="font-bold text-gray-900">
                          ${getTotalCost(latestReport.ingredient_requirements).toFixed(2)}
                        </span>
                      </span>
                      {getShortageCount(latestReport.ingredient_requirements) > 0 && (
                        <span className="text-sm text-amber-600 font-medium">
                          ⚠ {getShortageCount(latestReport.ingredient_requirements)} item(s) need ordering
                        </span>
                      )}
                    </div>
                  </div>

                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Required</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">In Stock</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shortage</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {latestReport.ingredient_requirements.map((req) => (
                        <tr key={req.ingredient_name} className={!req.is_sufficient ? 'bg-amber-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {req.is_sufficient ? (
                              <span className="text-green-600 text-xl">✓</span>
                            ) : (
                              <span className="text-amber-600 text-xl">⚠</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {req.ingredient_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {req.required_quantity.toFixed(2)} {req.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {req.current_stock.toFixed(2)} {req.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {req.shortage > 0 ? (
                              <span className="text-amber-600 font-medium">
                                {req.shortage.toFixed(2)} {req.unit}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            ${req.estimated_cost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Shopping List */}
            {latestReport.shopping_list && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">🛒 Shopping List</h2>
                </div>
                <div className="p-6">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{latestReport.shopping_list}</pre>
                </div>
              </div>
            )}

            {/* Low Stock Alerts */}
            {latestReport.low_stock_alerts && latestReport.low_stock_alerts.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4">⚠ Low Stock Alerts</h3>
                <div className="space-y-2">
                  {latestReport.low_stock_alerts.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">{item.name}</span>: {item.current_stock} {item.unit}
                      </span>
                      <span className="text-sm text-red-600">
                        Need {(item.minimum_stock - item.current_stock).toFixed(2)} {item.unit} more
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Report History */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Report History</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {reports.length === 0 ? (
              <li className="px-6 py-8 text-center text-gray-500">
                No reports yet. Generate your first report!
              </li>
            ) : (
              reports.map((report) => (
                <li key={report.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setLatestReport(report)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(report.report_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {report.total_orders} orders • {getTotalCakes(report.production_data)} cakes
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.inventory_availability && (
                        <span className={`text-sm font-medium ${
                          report.inventory_availability.all_available
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }`}>
                          {report.inventory_availability.all_available ? '✓ Stock OK' : '⚠ Check Stock'}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
