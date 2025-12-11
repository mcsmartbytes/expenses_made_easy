'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

interface TaxReport {
  schedule_c_line: string | null;
  line_name: string | null;
  total_amount: number;
  deductible_amount: number;
  deduction_percentage: number;
  expense_count: number;
}

interface MileageReport {
  total_miles: number;
  total_deduction: number;
  trip_count: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [taxReport, setTaxReport] = useState<TaxReport[]>([]);
  const [mileageReport, setMileageReport] = useState<MileageReport | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { loadReports(); }, [dateRange]);

  async function loadReports() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: expenses } = await supabase
        .from('expenses')
        .select(`
          amount,
          is_business,
          categories (
            schedule_c_line,
            deduction_percentage,
            schedule_c_line_items (line_name)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_business', true)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      const reportMap = new Map<string, TaxReport>();
      expenses?.forEach((exp: any) => {
        const category = exp.categories; if (!category) return;
        const line = category.schedule_c_line || 'uncategorized';
        const lineName = category.schedule_c_line_items?.line_name || 'Other Expenses';
        const amount = Number(exp.amount);
        const deductionPct = category.deduction_percentage || 0;
        const deductibleAmount = (amount * deductionPct) / 100;
        if (!reportMap.has(line)) {
          reportMap.set(line, { schedule_c_line: category.schedule_c_line, line_name: lineName, total_amount: 0, deductible_amount: 0, deduction_percentage: deductionPct, expense_count: 0 });
        }
        const report = reportMap.get(line)!;
        report.total_amount += amount; report.deductible_amount += deductibleAmount; report.expense_count += 1;
      });
      const sortedReport = Array.from(reportMap.values()).sort((a, b) => { if (!a.schedule_c_line) return 1; if (!b.schedule_c_line) return -1; return a.schedule_c_line.localeCompare(b.schedule_c_line); });
      setTaxReport(sortedReport);

      const { data: mileage } = await supabase
        .from('mileage')
        .select('distance, amount')
        .eq('user_id', user.id)
        .eq('is_business', true)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      const mileageTotal = mileage?.reduce((sum, m) => sum + Number(m.distance), 0) || 0;
      const mileageDeduction = mileage?.reduce((sum, m) => sum + Number(m.amount), 0) || 0;
      setMileageReport({ total_miles: mileageTotal, total_deduction: mileageDeduction, trip_count: mileage?.length || 0 });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    const csvRows = [] as string[];
    csvRows.push('Schedule C Line,Category,Total Amount,Deductible Amount,Deduction %,# of Expenses');
    taxReport.forEach(row => { csvRows.push([row.schedule_c_line || 'N/A', row.line_name || 'Other', row.total_amount.toFixed(2), row.deductible_amount.toFixed(2), row.deduction_percentage, row.expense_count].join(',')); });
    if (mileageReport && mileageReport.total_miles > 0) {
      csvRows.push(''); csvRows.push('Mileage Deductions'); csvRows.push('Total Miles,Total Deduction,# of Trips');
      csvRows.push([mileageReport.total_miles.toFixed(2), mileageReport.total_deduction.toFixed(2), mileageReport.trip_count].join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `tax-report-${dateRange.start}-to-${dateRange.end}.csv`; a.click(); window.URL.revokeObjectURL(url);
  }

  const totalDeductible = taxReport.reduce((sum, r) => sum + r.deductible_amount, 0) + (mileageReport?.total_deduction || 0);
  const totalExpenses = taxReport.reduce((sum, r) => sum + r.total_amount, 0);
  const totalExpenseCount = taxReport.reduce((sum, r) => sum + r.expense_count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <Navigation variant="expenses" />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Reports</h1>
          <p className="text-gray-600">IRS Schedule C expense breakdown and deduction summary</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button onClick={() => setDateRange({ start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] })} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">Reset to Year</button>
            <button onClick={exportToCSV} disabled={loading || taxReport.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export to CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-semibold text-blue-100 mb-2">Total Deductible</h3>
            <p className="text-4xl font-bold mb-1">${totalDeductible.toFixed(2)}</p>
            <p className="text-sm text-blue-100">Estimated tax savings: ${(totalDeductible * 0.24).toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Expenses</h3>
            <p className="text-4xl font-bold text-gray-900 mb-1">${totalExpenses.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{totalExpenseCount} business expenses</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-semibold text-green-100 mb-2">Deduction Rate</h3>
            <p className="text-4xl font-bold mb-1">{totalExpenses > 0 ? ((totalDeductible / totalExpenses) * 100).toFixed(0) : 0}%</p>
            <p className="text-sm text-green-100">Of total expenses</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg mb-8 border-2 border-gray-200">
              <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-xl font-bold text-gray-900">Schedule C Line Item Breakdown</h2>
                <p className="text-sm text-gray-600 mt-1">IRS Form 1040 Schedule C categories</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Line</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Deductible</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"># Expenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {taxReport.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.schedule_c_line || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{row.line_name || 'Uncategorized'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">${row.total_amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">${row.deductible_amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {row.deduction_percentage === 100 && (<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">100%</span>)}
                          {row.deduction_percentage === 50 && (<span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">50%</span>)}
                          {row.deduction_percentage === 0 && (<span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">0%</span>)}
                          {row.deduction_percentage > 0 && row.deduction_percentage < 100 && row.deduction_percentage !== 50 && (<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">{row.deduction_percentage}%</span>)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{row.expense_count}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-sm text-gray-900">Total Expenses</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${totalExpenses.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-bold">${taxReport.reduce((sum, r) => sum + r.deductible_amount, 0).toFixed(2)}</td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{totalExpenseCount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {taxReport.length === 0 && (<div className="p-12 text-center text-gray-500"><p className="text-lg mb-2">No business expenses found</p><p className="text-sm">Add business expenses to see your tax deduction report</p></div>)}
            </div>

            {mileageReport && mileageReport.total_miles > 0 && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
                <div className="px-6 py-5 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-xl font-bold text-gray-900">Mileage Deductions</h2>
                  <p className="text-sm text-gray-600 mt-1">IRS Standard Mileage Rate ($0.67/mile for 2025)</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-1">Total Miles</p>
                      <p className="text-3xl font-bold text-blue-600">{mileageReport.total_miles.toFixed(1)}</p>
                      <p className="text-xs text-blue-700 mt-1">{mileageReport.trip_count} business trips</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-1">Total Deduction</p>
                      <p className="text-3xl font-bold text-green-600">${mileageReport.total_deduction.toFixed(2)}</p>
                      <p className="text-xs text-green-700 mt-1">100% deductible</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <p className="text-sm font-medium text-purple-900 mb-1">Tax Savings</p>
                      <p className="text-3xl font-bold text-purple-600">${(mileageReport.total_deduction * 0.24).toFixed(2)}</p>
                      <p className="text-xs text-purple-700 mt-1">At 24% tax bracket</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Important Tax Information</p>
              <p>This report is generated from your expense tracking data with IRS-compliant classifications. Always consult with a licensed tax professional or CPA before filing your taxes. Keep all receipts and documentation for at least 3 years.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
