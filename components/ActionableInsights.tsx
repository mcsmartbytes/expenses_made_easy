'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Insight {
  id: string;
  type: 'spending_increase' | 'spending_decrease' | 'budget_warning' | 'savings_opportunity' | 'tax_tip' | 'pattern' | 'achievement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  data?: Record<string, any>;
}

interface ActionableInsightsProps {
  userId: string;
}

const TYPE_CONFIG: Record<string, { icon: string; bgClass: string; borderClass: string; textClass: string }> = {
  spending_increase: {
    icon: '📈',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-800',
  },
  spending_decrease: {
    icon: '📉',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-800',
  },
  budget_warning: {
    icon: '⚠️',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-800',
  },
  savings_opportunity: {
    icon: '💡',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
  },
  tax_tip: {
    icon: '💰',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-800',
  },
  pattern: {
    icon: '📊',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-800',
  },
  achievement: {
    icon: '🏆',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    textClass: 'text-yellow-800',
  },
};

export default function ActionableInsights({ userId }: ActionableInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetchInsights();
    // Load dismissed insights from localStorage
    const saved = localStorage.getItem('dismissedInsights');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only keep dismissals from the last 24 hours
        const now = Date.now();
        const valid = Object.entries(parsed)
          .filter(([_, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000)
          .map(([id]) => id);
        setDismissedIds(new Set(valid));
      } catch {
        // Ignore invalid data
      }
    }
  }, [userId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/insights?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = (id: string) => {
    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      // Save to localStorage with timestamp
      const saved = localStorage.getItem('dismissedInsights');
      let data: Record<string, number> = {};
      try {
        data = saved ? JSON.parse(saved) : {};
      } catch {
        // Ignore
      }
      data[id] = Date.now();
      localStorage.setItem('dismissedInsights', JSON.stringify(data));
      return newSet;
    });
  };

  const visibleInsights = insights.filter(i => !dismissedIds.has(i.id));

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80">
          <div className="h-5 w-32 bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-16 bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-slate-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (visibleInsights.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <span className="text-lg">💡</span>
            Smart Insights
          </h3>
        </div>
        <div className="p-6 text-center">
          <span className="text-3xl mb-2 block">✨</span>
          <p className="text-slate-300 text-sm">All caught up!</p>
          <p className="text-slate-400 text-xs mt-1">No new insights right now. Keep tracking!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <span className="text-lg">💡</span>
          Smart Insights
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
            {visibleInsights.length}
          </span>
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          {visibleInsights.map(insight => {
            const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.pattern;

            return (
              <div
                key={insight.id}
                className={`rounded-lg border p-3 ${config.bgClass} ${config.borderClass} relative group`}
              >
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Dismiss"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-start gap-2.5 pr-6">
                  <span className="text-xl flex-shrink-0">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold ${config.textClass}`}>
                        {insight.title}
                      </h4>
                      {insight.priority === 'high' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500 text-white rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${config.textClass} opacity-80`}>
                      {insight.message}
                    </p>
                    {insight.action && (
                      <Link
                        href={insight.action.href}
                        className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${config.textClass} hover:underline`}
                      >
                        {insight.action.label}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
