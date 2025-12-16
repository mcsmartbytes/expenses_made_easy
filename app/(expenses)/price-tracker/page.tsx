'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

interface PriceTrend {
  item_name: string;
  item_name_normalized: string;
  current_price: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  price_change_30d: number;
  price_change_90d: number;
  purchase_count: number;
  last_purchase: string;
  vendors: string[];
}

interface PriceAlert {
  item_name: string;
  vendor: string;
  current_price: number;
  previous_price: number;
  change_pct: number;
  purchase_date: string;
  severity: 'info' | 'warning' | 'alert';
}

interface PriceHistoryEntry {
  id: string;
  item_name_normalized: string;
  vendor: string;
  unit_price: number;
  quantity: number;
  unit_of_measure: string;
  purchase_date: string;
}

export default function PriceTrackerPage() {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<PriceTrend[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [biggestIncreases, setBiggestIncreases] = useState<PriceTrend[]>([]);
  const [frequentItems, setFrequentItems] = useState<PriceTrend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [itemHistory, setItemHistory] = useState<PriceHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view price tracking.');
        setLoading(false);
        return;
      }

      // Load trends
      const trendsRes = await fetch(`/api/price-history?user_id=${user.id}&mode=trends`);
      const trendsData = await trendsRes.json();

      if (trendsData.success) {
        setTrends(trendsData.data.trends || []);
        setBiggestIncreases(trendsData.data.biggest_increases || []);
        setFrequentItems(trendsData.data.frequent_items || []);
      }

      // Load alerts
      const alertsRes = await fetch(`/api/price-history?user_id=${user.id}&mode=alerts`);
      const alertsData = await alertsRes.json();

      if (alertsData.success) {
        setAlerts(alertsData.data || []);
      }
    } catch (err) {
      console.error('Error loading price data:', err);
      setError('Failed to load price tracking data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadItemHistory(itemName: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch(`/api/price-history?user_id=${user.id}&item_name=${encodeURIComponent(itemName)}&mode=history`);
      const data = await res.json();

      if (data.success) {
        setItemHistory(data.data || []);
        setSelectedItem(itemName);
      }
    } catch (err) {
      console.error('Error loading item history:', err);
    }
  }

  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  function formatChange(pct: number): { text: string; color: string } {
    const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
    const color = pct > 5 ? 'text-red-400' : pct < -5 ? 'text-green-400' : 'text-slate-400';
    return { text: `${arrow} ${Math.abs(pct).toFixed(1)}%`, color };
  }

  const filteredTrends = searchQuery
    ? trends.filter(t =>
        t.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.vendors.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : trends;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation variant="expenses" />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation variant="expenses" />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-red-300">{error}</p>
          <Link href="/auth/signin" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation variant="expenses" />

      <header className="border-b border-slate-700 bg-gradient-to-r from-slate-900/60 to-slate-800/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Price Tracker</h1>
              <p className="text-sm text-slate-300 mt-1">
                Track item prices over time from your receipts
              </p>
            </div>
            <div className="w-full md:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items or vendors..."
                className="w-full md:w-64 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Items Tracked</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">{trends.length}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Price Increases</p>
            <p className="mt-2 text-3xl font-bold text-red-400">
              {alerts.filter(a => a.change_pct > 0).length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Price Decreases</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {alerts.filter(a => a.change_pct < 0).length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Savings found</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Frequent Purchases</p>
            <p className="mt-2 text-3xl font-bold text-purple-400">{frequentItems.length}</p>
            <p className="text-xs text-slate-400 mt-1">3+ times</p>
          </div>
        </div>

        {/* Price Alerts */}
        {alerts.length > 0 && (
          <div className="rounded-xl border border-amber-500/50 bg-amber-900/20 p-4">
            <h3 className="text-lg font-semibold text-amber-300 mb-3">Recent Price Changes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.slice(0, 6).map((alert, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 ${
                    alert.change_pct > 0 ? 'bg-red-900/30 border border-red-500/30' : 'bg-green-900/30 border border-green-500/30'
                  }`}
                >
                  <p className="font-medium text-white text-sm truncate">{alert.item_name}</p>
                  <p className="text-xs text-slate-400">{alert.vendor}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-slate-300">
                      {formatPrice(alert.previous_price)} → {formatPrice(alert.current_price)}
                    </span>
                    <span className={alert.change_pct > 0 ? 'text-red-400' : 'text-green-400'}>
                      {alert.change_pct > 0 ? '↑' : '↓'} {Math.abs(alert.change_pct).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biggest Increases */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="text-red-400">↑</span> Biggest Price Increases
              </h2>
            </div>
            {biggestIncreases.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">No price increases detected</div>
            ) : (
              <div className="divide-y divide-slate-700">
                {biggestIncreases.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadItemHistory(item.item_name_normalized)}
                    className="w-full p-3 hover:bg-slate-700/50 transition text-left"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white truncate">{item.item_name}</span>
                      <span className="text-red-400 text-sm">
                        +{item.price_change_30d.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatPrice(item.current_price)} • {item.purchase_count} purchases
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Frequently Purchased */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="text-purple-400">★</span> Frequently Purchased
              </h2>
            </div>
            {frequentItems.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">Not enough purchase history yet</div>
            ) : (
              <div className="divide-y divide-slate-700">
                {frequentItems.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadItemHistory(item.item_name_normalized)}
                    className="w-full p-3 hover:bg-slate-700/50 transition text-left"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white truncate">{item.item_name}</span>
                      <span className="text-purple-400 text-sm">{item.purchase_count}x</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Avg: {formatPrice(item.avg_price)} • Range: {formatPrice(item.min_price)}-{formatPrice(item.max_price)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Detail / Search Results */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80">
              <h2 className="font-semibold text-white">
                {selectedItem ? 'Price History' : 'All Items'}
              </h2>
            </div>
            {selectedItem ? (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-white">{selectedItem}</h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back
                  </button>
                </div>
                {itemHistory.length === 0 ? (
                  <p className="text-sm text-slate-400">No history found</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {itemHistory.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="text-white">{formatPrice(entry.unit_price)}</p>
                          <p className="text-xs text-slate-400">{entry.vendor}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-300">{entry.quantity} {entry.unit_of_measure}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(entry.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : filteredTrends.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">
                {searchQuery ? 'No items match your search' : 'No items tracked yet. Scan receipts to start tracking!'}
              </div>
            ) : (
              <div className="divide-y divide-slate-700 max-h-80 overflow-y-auto">
                {filteredTrends.slice(0, 10).map((item, idx) => {
                  const change = formatChange(item.price_change_30d);
                  return (
                    <button
                      key={idx}
                      onClick={() => loadItemHistory(item.item_name_normalized)}
                      className="w-full p-3 hover:bg-slate-700/50 transition text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white truncate">{item.item_name}</span>
                        <span className={`text-sm ${change.color}`}>{change.text}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatPrice(item.current_price)} • Last: {new Date(item.last_purchase).toLocaleDateString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {trends.length === 0 && !loading && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">Start Tracking Prices</h3>
            <p className="text-slate-400 mb-4 max-w-md mx-auto">
              Upload receipts with itemized purchases to automatically track prices over time.
              You'll see alerts when prices increase or decrease.
            </p>
            <Link
              href="/expenses/new"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add Expense with Receipt
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
