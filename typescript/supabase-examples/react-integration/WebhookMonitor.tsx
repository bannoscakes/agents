/**
 * Webhook Monitor Component
 *
 * Monitors and manages webhook processing across both shops.
 *
 * Features:
 * - View pending webhooks
 * - Process individual webhooks
 * - Batch process all pending
 * - View processing stats
 * - Choose extraction method (deterministic/ai/hybrid)
 * - View processing history
 * - Retry failed webhooks
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface WebhookStats {
  bannos: { pending: number; processed: number; errors: number };
  flourlane: { pending: number; processed: number; errors: number };
  total: { pending: number; processed: number; errors: number };
}

interface PendingWebhook {
  id: string;
  shop: 'bannos' | 'flourlane';
  received_at: string;
  payload: any;
  error?: string;
}

type ExtractionMethod = 'deterministic' | 'ai' | 'hybrid';

export default function WebhookMonitor() {
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [pendingWebhooks, setPendingWebhooks] = useState<PendingWebhook[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ExtractionMethod>('hybrid');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStats();
    loadPendingWebhooks();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadStats();
      loadPendingWebhooks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('webhook-processor/stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadPendingWebhooks = async () => {
    try {
      // Load from both tables
      const [bannosResult, flourlaneResult] = await Promise.all([
        supabase
          .from('webhook_inbox_bannos')
          .select('id, received_at, payload, error')
          .eq('processed', false)
          .order('received_at', { ascending: true })
          .limit(10),
        supabase
          .from('webhook_inbox_flourlane')
          .select('id, received_at, payload, error')
          .eq('processed', false)
          .order('received_at', { ascending: true })
          .limit(10),
      ]);

      const bannos = (bannosResult.data || []).map(w => ({ ...w, shop: 'bannos' as const }));
      const flourlane = (flourlaneResult.data || []).map(w => ({ ...w, shop: 'flourlane' as const }));

      const combined = [...bannos, ...flourlane].sort(
        (a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );

      setPendingWebhooks(combined);
    } catch (error) {
      console.error('Failed to load pending webhooks:', error);
    }
  };

  const processWebhook = async (webhookId: string, shop: 'bannos' | 'flourlane') => {
    setProcessing(webhookId);
    setMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('webhook-processor', {
        body: { webhook_id: webhookId, shop, method: selectedMethod },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `✓ Created ${data.orders_created} order(s) using ${data.method_used} method${
          data.ai_used ? ' (AI used)' : ''
        }`,
      });

      // Refresh
      await loadStats();
      await loadPendingWebhooks();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `✗ Failed to process: ${error.message}`,
      });
    } finally {
      setProcessing(null);
    }
  };

  const processBatch = async (shop?: 'bannos' | 'flourlane') => {
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('webhook-processor/batch', {
        body: { shop, limit: 10, method: selectedMethod },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `✓ Processed ${data.total_processed} webhooks (${data.total_errors} errors)`,
      });

      // Refresh
      await loadStats();
      await loadPendingWebhooks();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `✗ Batch processing failed: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderInfo = (payload: any): string => {
    try {
      const orderNum = payload?.name || 'Unknown';
      const customerName =
        payload?.shipping_address?.name ||
        (payload?.customer?.first_name + ' ' + payload?.customer?.last_name) ||
        'Unknown';
      const itemCount = payload?.line_items?.length || 0;
      return `${orderNum} - ${customerName} (${itemCount} items)`;
    } catch {
      return 'Unable to parse order';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Webhook Monitor</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total.pending}</p>
            <p className="text-sm text-blue-700 mt-1">
              Bannos: {stats.bannos.pending} | Flourlane: {stats.flourlane.pending}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">Processed</h3>
            <p className="text-3xl font-bold text-green-600">{stats.total.processed}</p>
            <p className="text-sm text-green-700 mt-1">
              Bannos: {stats.bannos.processed} | Flourlane: {stats.flourlane.processed}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-900 mb-2">Errors</h3>
            <p className="text-3xl font-bold text-red-600">{stats.total.errors}</p>
            <p className="text-sm text-red-700 mt-1">
              Bannos: {stats.bannos.errors} | Flourlane: {stats.flourlane.errors}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extraction Method
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as ExtractionMethod)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="deterministic">Deterministic (FREE, Fast)</option>
              <option value="hybrid">Hybrid (Smart, ~$0.0001)</option>
              <option value="ai">AI Only (~$0.0001)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => processBatch()}
              disabled={loading || !stats || stats.total.pending === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : `Process All (${stats?.total.pending || 0})`}
            </button>

            <button
              onClick={() => processBatch('bannos')}
              disabled={loading || !stats || stats.bannos.pending === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Bannos ({stats?.bannos.pending || 0})
            </button>

            <button
              onClick={() => processBatch('flourlane')}
              disabled={loading || !stats || stats.flourlane.pending === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Flourlane ({stats?.flourlane.pending || 0})
            </button>
          </div>
        </div>

        {/* Method Info */}
        <div className="mt-4 text-sm text-gray-600">
          {selectedMethod === 'deterministic' && (
            <p>
              ⚡ <strong>Deterministic:</strong> FREE, ~10ms, uses your proven Liquid template logic.
              Best for standard orders.
            </p>
          )}
          {selectedMethod === 'hybrid' && (
            <p>
              🎯 <strong>Hybrid:</strong> Deterministic first, AI validates. Only pays when needed
              (~$0.0001). Best for production.
            </p>
          )}
          {selectedMethod === 'ai' && (
            <p>
              🤖 <strong>AI Only:</strong> ~$0.0001 per order, ~3-5 seconds. Guided by Liquid
              template. Best for complex/unusual orders.
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Pending Webhooks Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold">
            Pending Webhooks ({pendingWebhooks.length})
          </h2>
        </div>

        {pendingWebhooks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">✓ No pending webhooks</p>
            <p className="text-sm mt-2">All caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Shop
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Received
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingWebhooks.map((webhook) => (
                  <tr key={webhook.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          webhook.shop === 'bannos'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {webhook.shop}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getOrderInfo(webhook.payload)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(webhook.received_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {webhook.error ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => processWebhook(webhook.id, webhook.shop)}
                        disabled={processing === webhook.id}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {processing === webhook.id ? 'Processing...' : 'Process'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Deterministic:</strong> Uses your proven Liquid template logic. FREE, fast,
            reliable.
          </li>
          <li>
            • <strong>Hybrid:</strong> Deterministic first, AI validates and fills gaps. Best of both
            worlds.
          </li>
          <li>
            • <strong>AI Only:</strong> AI guided by Liquid template. Handles complex edge cases.
          </li>
          <li>• Multi-cake orders are automatically split: #B21345-A, #B21345-B, etc.</li>
          <li>• Accessories (candles, balloons) stay with the first cake.</li>
        </ul>
      </div>
    </div>
  );
}
