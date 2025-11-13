/**
 * Cake Quality Control Component
 *
 * Staff interface for uploading cake photos and viewing quality control results.
 *
 * Features:
 * - Drag & drop photo upload
 * - Real-time AI analysis
 * - Visual quality indicators
 * - Spelling error highlights
 * - Order verification
 * - QC history
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface QCResult {
  id: string;
  quality_score: number;
  text_on_cake: string | null;
  spelling_correct: boolean;
  spelling_errors: string[];
  matches_order: boolean;
  order_discrepancies: string[];
  issues_detected: string[];
  visual_quality: {
    decoration: number;
    cleanliness: number;
    presentation: number;
    color_accuracy: number;
  };
  approved: boolean;
  requires_review: boolean;
  ai_confidence: number;
  analysis_timestamp: string;
}

interface Order {
  id: string;
  cake_type: string;
  customer_name: string;
  message_on_cake?: string;
  decoration_notes?: string;
  qc_status: string;
}

export default function CakeQualityControl() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [qcResult, setQcResult] = useState<QCResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders needing QC
  useEffect(() => {
    fetchOrdersNeedingQC();
  }, []);

  const fetchOrdersNeedingQC = async () => {
    try {
      const { data, error } = await supabase.rpc('get_orders_needing_qc', { limit_count: 20 });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!selectedOrder) {
      setError('Please select an order first');
      return;
    }

    setUploading(true);
    setAnalyzing(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', selectedOrder.id);
      if (user) formData.append('userId', user.id);

      // Upload and analyze
      const response = await supabase.functions.invoke('quality-control', {
        body: formData,
      });

      if (response.error) throw response.error;

      const { qc_result } = response.data;
      setQcResult(qc_result);

      // Refresh orders list
      await fetchOrdersNeedingQC();

    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setError(err.message || 'Failed to upload and analyze photo');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    } else {
      setError('Please upload an image file');
    }
  }, [selectedOrder]);

  // File input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (qcStatus: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-gray-100 text-gray-800',
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      needs_review: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[qcStatus] || colors.pending}`}>
        {qcStatus}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📸 Cake Quality Control</h1>
          <p className="mt-2 text-gray-600">
            Upload finished cake photos for AI-powered quality inspection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Orders Needing QC</h2>
              </div>
              <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {orders.length === 0 ? (
                  <li className="px-6 py-8 text-center text-gray-500">
                    No orders pending QC
                  </li>
                ) : (
                  orders.map((order: any) => (
                    <li
                      key={order.order_id}
                      onClick={() => setSelectedOrder({ ...order, id: order.order_id })}
                      className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                        selectedOrder?.id === order.order_id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.cake_type}</p>
                          <p className="text-xs text-gray-500">{order.customer_name}</p>
                          {order.message_on_cake && (
                            <p className="text-xs text-gray-600 mt-1">"{order.message_on_cake}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {order.priority === 3 && (
                            <span className="text-xs font-medium text-red-600">URGENT</span>
                          )}
                          {order.photos_count > 0 && (
                            <span className="text-xs text-gray-500">{order.photos_count} 📷</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Upload & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Cake Photo</h2>

              {selectedOrder ? (
                <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm font-medium text-indigo-900">Selected Order:</p>
                  <p className="text-lg font-bold text-indigo-900">{selectedOrder.cake_type}</p>
                  <p className="text-sm text-indigo-700">{selectedOrder.customer_name}</p>
                  {selectedOrder.message_on_cake && (
                    <p className="text-sm text-indigo-600 mt-1">
                      Expected message: "{selectedOrder.message_on_cake}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">⚠️ Please select an order from the list first</p>
                </div>
              )}

              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center ${
                  dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                } ${uploading || !selectedOrder ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {uploading ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-600">
                      {analyzing ? 'Analyzing photo with AI...' : 'Uploading...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      Drag and drop a photo here, or{' '}
                      <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
                        browse
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          disabled={uploading || !selectedOrder}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, HEIC up to 10MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* QC Results */}
            {qcResult && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div
                  className={`px-6 py-4 ${
                    qcResult.approved ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  <h2 className="text-xl font-semibold text-white">
                    {qcResult.approved ? '✓ Quality Check Passed' : '✗ Quality Check Failed'}
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Quality Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Overall Quality Score</h3>
                      <span className={`text-3xl font-bold ${getScoreColor(qcResult.quality_score)}`}>
                        {qcResult.quality_score.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          qcResult.quality_score >= 9
                            ? 'bg-green-600'
                            : qcResult.quality_score >= 7
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${qcResult.quality_score * 10}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Visual Quality Breakdown */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Quality Breakdown</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(qcResult.visual_quality).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-semibold">{value.toFixed(1)}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Text on Cake */}
                  {qcResult.text_on_cake && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Text on Cake</h3>
                      <div className={`p-3 rounded-lg ${
                        qcResult.spelling_correct ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <p className="text-lg font-medium">"{qcResult.text_on_cake}"</p>
                        {qcResult.spelling_correct ? (
                          <p className="text-sm text-green-600 mt-1">✓ Spelling correct</p>
                        ) : (
                          <div className="text-sm text-red-600 mt-1">
                            <p className="font-medium">✗ Spelling errors detected:</p>
                            <ul className="list-disc list-inside mt-1">
                              {qcResult.spelling_errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Issues Detected */}
                  {qcResult.issues_detected.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Issues Detected</h3>
                      <ul className="space-y-1">
                        {qcResult.issues_detected.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-red-500">⚠</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Order Discrepancies */}
                  {qcResult.order_discrepancies.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Order Verification</h3>
                      <ul className="space-y-1">
                        {qcResult.order_discrepancies.map((discrepancy, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-red-500">✗</span>
                            <span>{discrepancy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Confidence */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>AI Confidence: {(qcResult.ai_confidence * 100).toFixed(0)}%</span>
                      <span>{new Date(qcResult.analysis_timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {qcResult.requires_review && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-yellow-800">
                          ⚠️ This cake requires manual review
                        </p>
                        <div className="mt-3 flex gap-3">
                          <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                            Approve Override
                          </button>
                          <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700">
                            Reject & Remake
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
