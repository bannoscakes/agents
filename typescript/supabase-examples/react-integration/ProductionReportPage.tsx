/**
 * Production Report Page - React Component Example
 *
 * This component shows how to integrate the Cake Production Reporter
 * with your React/TypeScript frontend.
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ProductionData {
  [cakeType: string]: number;
}

interface Report {
  id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  production_data: ProductionData;
  report_text?: string;
  report_html?: string;
}

export default function ProductionReportPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing reports on mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Fetch all production reports
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

  // Generate a new report by calling the Edge Function
  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('production-report', {
        body: {
          format: 'html',
        },
      });

      if (error) throw error;

      if (data.success) {
        console.log('Report generated:', data.report);
        await fetchReports(); // Refresh the list
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

  // Calculate total cakes from production data
  const getTotalCakes = (productionData: ProductionData): number => {
    return Object.values(productionData).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎂 Cake Production Reports
          </h1>
          <p className="mt-2 text-gray-600">
            View and generate production reports for your bakery
          </p>
        </div>

        {/* Generate Button */}
        <div className="mb-6">
          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate New Report'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Latest Report Card */}
        {latestReport && (
          <div className="mb-8 bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Latest Report</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Report Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(latestReport.report_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="text-lg font-semibold">
                    {new Date(latestReport.period_start).toLocaleDateString()} - {new Date(latestReport.period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-lg font-semibold">{latestReport.total_orders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cakes</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {getTotalCakes(latestReport.production_data)}
                  </p>
                </div>
              </div>

              {/* Production Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cake Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(latestReport.production_data)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cakeType, quantity]) => (
                        <tr key={cakeType} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cakeType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                            {quantity}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* View Full Report Button */}
              {latestReport.report_html && (
                <div className="mt-6">
                  <button
                    onClick={() => {
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(latestReport.report_html || '');
                        newWindow.document.close();
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View Full Report →
                  </button>
                </div>
              )}
            </div>
          </div>
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
                <li key={report.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
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
                            Period: {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-6">
                          <div>
                            <p className="text-xs text-gray-500">Orders</p>
                            <p className="text-lg font-semibold">{report.total_orders}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Cakes</p>
                            <p className="text-lg font-semibold text-indigo-600">
                              {getTotalCakes(report.production_data)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => setLatestReport(report)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        View
                      </button>
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
