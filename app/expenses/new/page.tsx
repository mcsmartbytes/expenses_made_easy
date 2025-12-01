'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { canAddExpense } from '@/utils/subscription';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  deduction_percentage?: number;
  schedule_c_line?: string;
  tax_classification_type?: string;
}

export default function NewExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [subscriptionLimit, setSubscriptionLimit] = useState<{ allowed: boolean; message?: string; remaining?: number } | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    payment_method: 'credit',
    is_business: true,
    notes: '',
  });

  useEffect(() => {
    loadCategories();
    checkSubscriptionLimit();
  }, []);

  async function checkSubscriptionLimit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const result = await canAddExpense(user.id);
      setSubscriptionLimit(result);
    }
  }

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }

  async function loadCategories() {
    setLoadingCategories(true);
    try {
      // Use API endpoint to bypass RLS
      const response = await fetch('/api/categories');
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        // Just use what exists - don't auto-create defaults anymore
        setCategories(result.data);
      }
      // If no categories, user should create them via Profile page
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function createDefaultCategories() {
    const defaultCategories = [
      { name: 'Meals & Entertainment', color: '#EF4444', icon: '🍽️', is_tax_deductible: true },
      { name: 'Travel', color: '#3B82F6', icon: '✈️', is_tax_deductible: true },
      { name: 'Office Supplies', color: '#8B5CF6', icon: '📎', is_tax_deductible: true },
      { name: 'Vehicle', color: '#10B981', icon: '🚗', is_tax_deductible: true },
      { name: 'Utilities', color: '#F59E0B', icon: '💡', is_tax_deductible: true },
      { name: 'Marketing', color: '#EC4899', icon: '📢', is_tax_deductible: true },
      { name: 'Professional Services', color: '#6366F1', icon: '👔', is_tax_deductible: true },
      { name: 'Insurance', color: '#14B8A6', icon: '🛡️', is_tax_deductible: true },
      { name: 'Rent', color: '#F97316', icon: '🏢', is_tax_deductible: true },
      { name: 'Personal', color: '#64748B', icon: '👤', is_tax_deductible: false },
    ];

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: defaultCategories }),
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Error creating default categories:', result.error);
      }
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  }

  async function handleScanReceipt() {
    if (!receiptFile) return;

    setScanningReceipt(true);
    try {
      // Compress image if it's too large
      let fileToSend = receiptFile;
      const maxSize = 4 * 1024 * 1024; // 4MB limit for Vercel

      if (receiptFile.size > maxSize) {
        fileToSend = await compressImage(receiptFile);
      }

      const formDataForOCR = new FormData();
      formDataForOCR.append('receipt', fileToSend);

      const response = await fetch('/api/ocr-receipt', {
        method: 'POST',
        body: formDataForOCR,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scan receipt');
      }

      if (result.success && result.data) {
        setOcrData(result.data);

        // Auto-fill form fields with OCR data
        setFormData({
          ...formData,
          amount: result.data.amount || formData.amount,
          vendor: result.data.vendor || formData.vendor,
          date: result.data.date || formData.date,
          description: result.data.description || formData.description,
          payment_method: result.data.payment_method || formData.payment_method,
          notes: result.data.items ? `Items: ${result.data.items.join(', ')}` : formData.notes,
        });

        alert('✅ Receipt scanned successfully! Review the auto-filled information.');
      }
    } catch (error: any) {
      alert('❌ Failed to scan receipt: ' + (error.message || 'Unknown error'));
    } finally {
      setScanningReceipt(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in');
        return;
      }

      // Check subscription limit before adding
      const limitCheck = await canAddExpense(user.id);
      if (!limitCheck.allowed) {
        alert(limitCheck.message || 'You have reached your expense limit. Please upgrade to continue.');
        setLoading(false);
        return;
      }

      let receipt_url = null;
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);
          receipt_url = publicUrl;
        }
      }

      const { error } = await supabase.from('expenses').insert({
        ...formData,
        amount: parseFloat(formData.amount),
        receipt_url,
        user_id: user.id,
      });

      if (error) throw error;
      router.push('/expense-dashboard');
    } catch (error: any) {
      alert(error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Subscription Limit Warning */}
        {subscriptionLimit && !subscriptionLimit.allowed && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Expense Limit Reached</h3>
                <p className="text-sm text-red-700 mt-1">{subscriptionLimit.message}</p>
                <Link
                  href="/pricing"
                  className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                >
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          </div>
        )}

        {subscriptionLimit && subscriptionLimit.allowed && subscriptionLimit.remaining !== undefined && subscriptionLimit.remaining <= 10 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold text-yellow-800">Running Low on Free Expenses</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You have {subscriptionLimit.remaining} expense{subscriptionLimit.remaining !== 1 ? 's' : ''} remaining this month on the free plan.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block mt-2 text-sm text-yellow-800 font-semibold hover:text-yellow-900 underline"
                >
                  Upgrade for unlimited expenses →
                </Link>
              </div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <Link href="/expense-dashboard" className="text-blue-600 hover:text-blue-700">← Back to Dashboard</Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Add New Expense</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="What was this expense for?" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} disabled={loadingCategories} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                <option value="">{loadingCategories ? 'Loading categories...' : 'Select a category'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              {loadingCategories && (
                <p className="text-xs text-blue-600 mt-1">✨ Setting up your categories for the first time...</p>
              )}

              {/* Tax Information Display */}
              {formData.category_id && (() => {
                const selectedCategory = categories.find(c => c.id === formData.category_id);
                if (!selectedCategory) return null;

                const amount = parseFloat(formData.amount) || 0;
                const deductionPercentage = selectedCategory.deduction_percentage || 0;
                const deductibleAmount = (amount * deductionPercentage / 100).toFixed(2);

                return (
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Tax Information</p>

                        <div className="space-y-1">
                          {deductionPercentage === 100 && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                100% Tax Deductible
                              </span>
                              {amount > 0 && (
                                <span className="text-sm text-gray-700">
                                  Deductible: <strong className="text-green-700">${deductibleAmount}</strong>
                                </span>
                              )}
                            </div>
                          )}

                          {deductionPercentage === 50 && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                                50% Tax Deductible
                              </span>
                              {amount > 0 && (
                                <span className="text-sm text-gray-700">
                                  Deductible: <strong className="text-yellow-700">${deductibleAmount}</strong> of ${amount.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}

                          {deductionPercentage === 0 && (
                            <div>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                                Not Tax Deductible
                              </span>
                              <p className="text-xs text-gray-600 mt-1">Personal expenses are not deductible</p>
                            </div>
                          )}

                          {deductionPercentage > 0 && deductionPercentage < 100 && deductionPercentage !== 50 && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                {deductionPercentage}% Tax Deductible
                              </span>
                              {amount > 0 && (
                                <span className="text-sm text-gray-700">
                                  Deductible: <strong className="text-blue-700">${deductibleAmount}</strong>
                                </span>
                              )}
                            </div>
                          )}

                          {selectedCategory.schedule_c_line && (
                            <div className="flex items-center gap-2 mt-1">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs text-purple-700 font-medium">
                                Schedule C Line {selectedCategory.schedule_c_line}
                              </span>
                            </div>
                          )}
                        </div>

                        {deductionPercentage === 50 && (
                          <p className="text-xs text-gray-600 mt-2 italic">
                            💡 IRS limits business meals to 50% deduction
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vendor</label>
              <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Where did you make this purchase?" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={formData.is_business} onChange={(e) => setFormData({ ...formData, is_business: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                <span className="text-sm font-medium">This is a business expense</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">📸 Receipt Photo (Optional)</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  onChange={(e) => {
                    setReceiptFile(e.target.files?.[0] || null);
                    setOcrData(null); // Reset OCR data when new file is selected
                  }}
                  className="w-full px-4 py-2 border rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {receiptFile && (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-green-800 font-medium">✓ Receipt attached: {receiptFile.name}</p>
                          {ocrData && (
                            <p className="text-xs text-green-600 mt-1">✨ Scanned - data filled automatically</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFile(null);
                            setOcrData(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Tax Breakdown from OCR */}
                    {ocrData && (ocrData.subtotal || ocrData.tax_amount) && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                          </svg>
                          Receipt Breakdown
                        </h4>
                        <div className="space-y-2 text-sm">
                          {ocrData.subtotal && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium">${Number(ocrData.subtotal).toFixed(2)}</span>
                            </div>
                          )}
                          {ocrData.tax_amount !== null && ocrData.tax_amount !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Tax{ocrData.tax_rate ? ` (${ocrData.tax_rate}%)` : ''}:
                              </span>
                              <span className="font-medium text-orange-600">
                                ${Number(ocrData.tax_amount).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-blue-200">
                            <span className="font-semibold text-gray-900">Total:</span>
                            <span className="font-bold text-blue-600">${Number(ocrData.amount).toFixed(2)}</span>
                          </div>
                          {ocrData.payment_method && (
                            <div className="flex justify-between pt-2 text-xs text-gray-500">
                              <span>Payment Method:</span>
                              <span className="capitalize">{ocrData.payment_method}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {!ocrData && (
                      <button
                        type="button"
                        onClick={handleScanReceipt}
                        disabled={scanningReceipt}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                      >
                        {scanningReceipt ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Scanning Receipt with AI...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            🤖 Scan Receipt with AI
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  💡 Tip: Take a photo with your phone camera, then click "Scan Receipt with AI" to automatically extract amount, vendor, and date!
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Additional details..." />
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
              <Link href="/expense-dashboard" className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 text-center">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
