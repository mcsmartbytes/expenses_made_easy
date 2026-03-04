'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';
import { useMileageTracking } from '@/contexts/MileageTrackingContext';
import { getCurrentMileageRate, getCurrentMileageRateDisplay } from '@/lib/irsRates';

interface MileageTrip {
  id: string;
  date: string;
  distance: number;
  start_location: string;
  end_location: string;
  purpose: string;
  is_business: boolean;
  rate: number;
  amount: number;
}

export default function MileagePage() {
  const {
    isTracking, isNativeMode, distance, currentSpeed, startLocation,
    idleTime, purpose, setPurpose, isBusiness, setIsBusiness,
    startTracking, stopTracking, minSpeedMph, onTripSaved,
  } = useMileageTracking();

  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<MileageTrip[]>([]);
  const [showTip, setShowTip] = useState(true);

  const [typeFilter, setTypeFilter] = useState<'all' | 'business' | 'personal'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  // Edit modal state
  const [editingTrip, setEditingTrip] = useState<MileageTrip | null>(null);
  const [editPurpose, setEditPurpose] = useState('');
  const [editIsBusiness, setEditIsBusiness] = useState(true);

  useEffect(() => {
    loadTrips();
    if (typeof window !== 'undefined' && localStorage.getItem('mileage_tip_dismissed') === '1') {
      setShowTip(false);
    }
  }, []);

  // Refresh trip list when a trip is auto-saved from any page
  useEffect(() => {
    return onTripSaved(() => { loadTrips(); });
  }, [onTripSaved]);

  useEffect(() => { applyFilters(); }, [trips, typeFilter, dateFilter]);

  async function loadTrips() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('mileage').select('*').eq('user_id', user.id).order('date', { ascending: false });
      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  }

  function applyFilters() {
    let filtered = [...trips];
    if (typeFilter === 'business') filtered = filtered.filter(t => t.is_business);
    else if (typeFilter === 'personal') filtered = filtered.filter(t => !t.is_business);
    const now = new Date();
    if (dateFilter === 'month') { const m = new Date(now.getFullYear(), now.getMonth(), 1); filtered = filtered.filter(t => new Date(t.date) >= m); }
    else if (dateFilter === 'quarter') { const q = Math.floor(now.getMonth() / 3) * 3; const s = new Date(now.getFullYear(), q, 1); filtered = filtered.filter(t => new Date(t.date) >= s); }
    else if (dateFilter === 'year') { const y = new Date(now.getFullYear(), 0, 1); filtered = filtered.filter(t => new Date(t.date) >= y); }
    setFilteredTrips(filtered);
  }

  const totalMiles = filteredTrips.reduce((sum, t) => sum + t.distance, 0);
  const totalAmount = filteredTrips.reduce((sum, t) => sum + t.amount, 0);
  const businessMiles = filteredTrips.filter(t => t.is_business).reduce((sum, t) => sum + t.distance, 0);
  const personalMiles = filteredTrips.filter(t => !t.is_business).reduce((sum, t) => sum + t.distance, 0);
  const taxDeduction = filteredTrips.filter(t => t.is_business).reduce((sum, t) => sum + t.distance * (t.rate || getCurrentMileageRate()), 0);

  async function deleteTrip(id: string) {
    if (!confirm('Delete this trip?')) return;
    const { error } = await supabase.from('mileage').delete().eq('id', id);
    if (!error) loadTrips();
  }

  function openEditModal(trip: MileageTrip) {
    setEditingTrip(trip);
    setEditPurpose(trip.purpose || '');
    setEditIsBusiness(trip.is_business);
  }

  async function handleSaveEdit() {
    if (!editingTrip) return;

    const newAmount = editingTrip.distance * editingTrip.rate;
    const { error } = await supabase
      .from('mileage')
      .update({
        purpose: editPurpose || null,
        is_business: editIsBusiness,
        amount: newAmount
      })
      .eq('id', editingTrip.id);

    if (!error) {
      setEditingTrip(null);
      loadTrips();
    } else {
      console.error('Error updating trip:', error);
      alert('Failed to update trip');
    }
  }

  function exportToCSV() {
    if (filteredTrips.length === 0) { alert('No trips to export'); return; }
    const headers = ['Date', 'Distance (miles)', 'Purpose', 'Type', 'Rate', 'Amount', 'Start Location', 'End Location'];
    const rows = filteredTrips.map(trip => [trip.date, trip.distance.toFixed(2), `"${trip.purpose || 'No purpose'}"`, trip.is_business ? 'Business' : 'Personal', trip.rate.toFixed(2), trip.amount.toFixed(2), `"${trip.start_location || ''}"`, `"${trip.end_location || ''}"`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })); link.download = `mileage_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  }

  const formatIdleTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="expenses" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mileage Tracker</h1>

        {/* How It Works Tip Card */}
        {showTip && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
            <button
              onClick={() => { setShowTip(false); localStorage.setItem('mileage_tip_dismissed', '1'); }}
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 text-lg leading-none"
              aria-label="Dismiss tip"
            >
              &times;
            </button>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How Mileage Tracking Works</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>Auto-start:</strong> Tracking begins when your speed exceeds {minSpeedMph} mph</li>
              <li><strong>Background tracking:</strong> Works from any page — no need to stay here</li>
              <li><strong>Auto-save:</strong> Trips save automatically after 15 min of no movement</li>
              <li><strong>Edit anytime:</strong> Change purpose, type, or details on any saved trip</li>
              <li><strong>IRS rate:</strong> {getCurrentMileageRateDisplay()}/mile ({new Date().getFullYear()}) applied automatically</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              <Link href="/settings" className="underline hover:text-blue-800">Change auto-start speed in Settings</Link>
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Auto-Tracking</h2>
                {isNativeMode ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Background Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Foreground Only
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Automatically starts when you drive over {minSpeedMph} mph
                <Link href="/settings" className="ml-2 text-blue-500 hover:text-blue-700 text-xs">(change)</Link>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isNativeMode
                  ? 'Tracks in background - no need to keep app open'
                  : 'Tracking works from any page — a floating indicator will appear'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{currentSpeed.toFixed(1)} mph</p>
              <p className="text-sm text-gray-500">Current Speed</p>
            </div>
          </div>

          {isTracking && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-900">Tracking Active</p>
                  <p className="text-green-700 text-2xl font-bold">{distance.toFixed(2)} miles</p>
                  <p className="text-sm text-green-600">From: {startLocation || 'Loading...'}</p>
                  {idleTime > 60 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Idle: {formatIdleTime(idleTime)} (auto-saves at 15:00)
                    </p>
                  )}
                </div>
                <button onClick={() => stopTracking(false)} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Stop & Save Trip</button>
              </div>

              <div className="mt-4 space-y-2">
                <input type="text" placeholder="Trip purpose (optional - can edit later)" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={isBusiness} onChange={(e) => setIsBusiness(e.target.checked)} className="w-4 h-4" /><span className="text-sm">Business trip (can change later)</span></label>
              </div>
            </div>
          )}

          {!isTracking && (<button onClick={() => startTracking()} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Start Manual Tracking</button>)}
        </div>

        {/* Tax Deduction Summary Banner */}
        {businessMiles > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-5 mb-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">💰</span>
                  <h3 className="text-lg font-bold">Tax Deduction Tracker</h3>
                </div>
                <p className="text-emerald-100 text-sm">
                  Your {businessMiles.toFixed(1)} business miles = <span className="font-bold text-white">${taxDeduction.toFixed(2)}</span> in tax deductions at {getCurrentMileageRateDisplay()}/mile ({new Date().getFullYear()} IRS rate)
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${taxDeduction.toFixed(2)}</p>
                <p className="text-xs text-emerald-200 uppercase tracking-wide">Potential Savings</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-bold">{businessMiles.toFixed(1)}</p>
                <p className="text-xs text-emerald-200">Business Miles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{getCurrentMileageRateDisplay()}</p>
                <p className="text-xs text-emerald-200">Per Mile Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{filteredTrips.filter(t => t.is_business).length}</p>
                <p className="text-xs text-emerald-200">Business Trips</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Total Miles</p><p className="text-2xl font-bold text-gray-900">{totalMiles.toFixed(1)}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Business Miles</p><p className="text-2xl font-bold text-gray-900">{businessMiles.toFixed(1)}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Personal Miles</p><p className="text-2xl font-bold text-gray-900">{personalMiles.toFixed(1)}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Total Amount</p><p className="text-2xl font-bold text-blue-700">${totalAmount.toFixed(2)}</p></div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg shadow p-4 border border-emerald-200">
            <p className="text-sm text-emerald-700 font-medium">Tax Deduction</p>
            <p className="text-2xl font-bold text-emerald-600">${taxDeduction.toFixed(2)}</p>
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">No trips yet</div>
        ) : (
          <>
          <p className="text-xs text-gray-400 mb-1 md:hidden">Swipe left to see more columns &rarr;</p>
          <div className="bg-white rounded-lg shadow overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Date</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Distance (mi)</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Purpose</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Type</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Rate</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Amount</th>
                  <th className="px-4 py-2 text-left text-emerald-700 font-medium">Tax Deduction</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Route</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((t, idx) => {
                  const tripDeduction = t.is_business ? t.distance * (t.rate || getCurrentMileageRate()) : 0;
                  return (
                    <tr key={t.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-4 py-2">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{t.distance.toFixed(2)}</td>
                      <td className="px-4 py-2">{t.purpose || '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.is_business
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {t.is_business ? 'Business' : 'Personal'}
                        </span>
                      </td>
                      <td className="px-4 py-2">${t.rate.toFixed(2)}</td>
                      <td className="px-4 py-2">${t.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {t.is_business ? (
                          <span className="font-semibold text-emerald-600">${tripDeduction.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 max-w-[200px] truncate" title={`${t.start_location || 'Unknown'} → ${t.end_location || 'Unknown'}`}>
                        {t.start_location ? `${t.start_location.split(',')[0]}` : '?'} → {t.end_location ? `${t.end_location.split(',')[0]}` : '?'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTrip(t.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className="mt-6 flex items-center gap-4">
          <button onClick={exportToCSV} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Export CSV</button>
          <Link href="/expenses/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">← Back to Dashboard</Link>
        </div>
      </main>

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Trip</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="font-medium">{new Date(editingTrip.date).toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Distance</p>
                <p className="font-medium">{editingTrip.distance.toFixed(2)} miles</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Route</p>
                <p className="text-sm">{editingTrip.start_location?.split(',')[0] || '?'} → {editingTrip.end_location?.split(',')[0] || '?'}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Purpose</label>
                <input
                  type="text"
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  placeholder="e.g., Client meeting, Site visit"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editIsBusiness}
                    onChange={(e) => setEditIsBusiness(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Business trip</span>
                </label>
                {editIsBusiness && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Tax deduction: ${(editingTrip.distance * (editingTrip.rate || getCurrentMileageRate())).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingTrip(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
