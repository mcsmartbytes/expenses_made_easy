// Price Tracking Utilities
// Track item prices over time and detect changes

export interface PriceHistoryEntry {
  id: string;
  item_name_normalized: string;
  vendor: string;
  vendor_normalized: string;
  unit_price: number;
  quantity: number;
  unit_of_measure: string;
  purchase_date: string;
  expense_id: string;
  line_item_id: string;
}

export interface PriceTrend {
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

export interface PriceAlert {
  id: string;
  item_name: string;
  vendor: string;
  old_price: number;
  new_price: number;
  change_amount: number;
  change_pct: number;
  purchase_date: string;
  severity: 'info' | 'warning' | 'alert';
}

// Calculate price trend from history
export function calculatePriceTrend(
  history: PriceHistoryEntry[],
  itemName: string
): PriceTrend | null {
  if (history.length === 0) return null;

  // Sort by date descending
  const sorted = [...history].sort(
    (a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
  );

  const prices = sorted.map(h => h.unit_price);
  const currentPrice = prices[0];
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Calculate 30-day change
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const oldPrices30d = sorted.filter(
    h => new Date(h.purchase_date) <= thirtyDaysAgo
  );
  const price30dAgo = oldPrices30d.length > 0 ? oldPrices30d[0].unit_price : currentPrice;
  const priceChange30d = price30dAgo > 0
    ? ((currentPrice - price30dAgo) / price30dAgo) * 100
    : 0;

  // Calculate 90-day change
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const oldPrices90d = sorted.filter(
    h => new Date(h.purchase_date) <= ninetyDaysAgo
  );
  const price90dAgo = oldPrices90d.length > 0 ? oldPrices90d[0].unit_price : currentPrice;
  const priceChange90d = price90dAgo > 0
    ? ((currentPrice - price90dAgo) / price90dAgo) * 100
    : 0;

  // Get unique vendors
  const vendors = [...new Set(sorted.map(h => h.vendor).filter(Boolean))];

  return {
    item_name: itemName,
    item_name_normalized: sorted[0].item_name_normalized,
    current_price: currentPrice,
    avg_price: avgPrice,
    min_price: minPrice,
    max_price: maxPrice,
    price_change_30d: priceChange30d,
    price_change_90d: priceChange90d,
    purchase_count: sorted.length,
    last_purchase: sorted[0].purchase_date,
    vendors,
  };
}

// Compare current price to previous purchases
export function compareToPrevious(
  currentPrice: number,
  history: PriceHistoryEntry[],
  sameVendorOnly: boolean = false,
  vendor?: string
): { previous: PriceHistoryEntry | null; change: number; changePct: number } {
  if (history.length === 0) {
    return { previous: null, change: 0, changePct: 0 };
  }

  // Filter by vendor if requested
  let filtered = history;
  if (sameVendorOnly && vendor) {
    const vendorNorm = vendor.toLowerCase().trim();
    filtered = history.filter(h =>
      h.vendor_normalized === vendorNorm || h.vendor.toLowerCase().includes(vendorNorm)
    );
  }

  if (filtered.length === 0) {
    return { previous: null, change: 0, changePct: 0 };
  }

  // Get most recent previous purchase
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
  );

  const previous = sorted[0];
  const change = currentPrice - previous.unit_price;
  const changePct = previous.unit_price > 0
    ? (change / previous.unit_price) * 100
    : 0;

  return { previous, change, changePct };
}

// Generate price alerts for significant changes
export function generatePriceAlerts(
  currentItems: { item_name: string; unit_price: number; vendor: string; purchase_date: string }[],
  history: Map<string, PriceHistoryEntry[]>,
  threshold: number = 5 // 5% threshold for alerts
): PriceAlert[] {
  const alerts: PriceAlert[] = [];

  for (const item of currentItems) {
    const itemHistory = history.get(item.item_name.toLowerCase().trim()) || [];

    if (itemHistory.length === 0) continue;

    const comparison = compareToPrevious(item.unit_price, itemHistory, false);

    if (comparison.previous && Math.abs(comparison.changePct) >= threshold) {
      const severity = Math.abs(comparison.changePct) >= 20
        ? 'alert'
        : Math.abs(comparison.changePct) >= 10
          ? 'warning'
          : 'info';

      alerts.push({
        id: `${item.item_name}-${item.purchase_date}`,
        item_name: item.item_name,
        vendor: item.vendor,
        old_price: comparison.previous.unit_price,
        new_price: item.unit_price,
        change_amount: comparison.change,
        change_pct: comparison.changePct,
        purchase_date: item.purchase_date,
        severity,
      });
    }
  }

  // Sort by absolute change percentage (highest first)
  return alerts.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct));
}

// Find items with biggest price increases
export function findBiggestIncreases(
  trends: PriceTrend[],
  period: '30d' | '90d' = '30d',
  limit: number = 10
): PriceTrend[] {
  const changeKey = period === '30d' ? 'price_change_30d' : 'price_change_90d';

  return [...trends]
    .filter(t => t[changeKey] > 0)
    .sort((a, b) => b[changeKey] - a[changeKey])
    .slice(0, limit);
}

// Find items with biggest price decreases (savings opportunities)
export function findBiggestDecreases(
  trends: PriceTrend[],
  period: '30d' | '90d' = '30d',
  limit: number = 10
): PriceTrend[] {
  const changeKey = period === '30d' ? 'price_change_30d' : 'price_change_90d';

  return [...trends]
    .filter(t => t[changeKey] < 0)
    .sort((a, b) => a[changeKey] - b[changeKey])
    .slice(0, limit);
}

// Find frequently purchased items
export function findFrequentItems(
  trends: PriceTrend[],
  minPurchases: number = 3,
  limit: number = 10
): PriceTrend[] {
  return [...trends]
    .filter(t => t.purchase_count >= minPurchases)
    .sort((a, b) => b.purchase_count - a.purchase_count)
    .slice(0, limit);
}

// Calculate total spent on an item over time
export function calculateTotalSpent(history: PriceHistoryEntry[]): number {
  return history.reduce((sum, h) => sum + (h.unit_price * h.quantity), 0);
}

// Find best price for an item (lowest price and where)
export function findBestPrice(
  history: PriceHistoryEntry[]
): { price: number; vendor: string; date: string } | null {
  if (history.length === 0) return null;

  const sorted = [...history].sort((a, b) => a.unit_price - b.unit_price);
  const best = sorted[0];

  return {
    price: best.unit_price,
    vendor: best.vendor,
    date: best.purchase_date,
  };
}

// Format price change for display
export function formatPriceChange(change: number, pct: number): string {
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
  const color = pct > 0 ? 'text-red-500' : pct < 0 ? 'text-green-500' : 'text-gray-500';
  const absChange = Math.abs(change);
  const absPct = Math.abs(pct);

  return `${arrow} $${absChange.toFixed(2)} (${absPct.toFixed(1)}%)`;
}
