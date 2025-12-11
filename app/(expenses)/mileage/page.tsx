'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

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
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<MileageTrip[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [startLocation, setStartLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isBusiness, setIsBusiness] = useState(true);
  const [rate, setRate] = useState(0.67);

  const [typeFilter, setTypeFilter] = useState<'all' | 'business' | 'personal'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const autoStartTriggered = useRef(false);

  useEffect(() => {
    loadTrips();
    startSpeedMonitoring();
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

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

  function startSpeedMonitoring() {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition((position) => {
      const speed = position.coords.speed || 0;
      const speedMph = speed * 2.237;
      setCurrentSpeed(speedMph);
      if (speedMph >= 5 && !isTracking && !autoStartTriggered.current) { autoStartTriggered.current = true; handleStartTracking(); }
      if (isTracking && lastPositionRef.current) {
        const distanceMiles = calculateDistance(lastPositionRef.current.coords.latitude, lastPositionRef.current.coords.longitude, position.coords.latitude, position.coords.longitude);
        setDistance(prev => prev + distanceMiles);
      }
      lastPositionRef.current = position;
    }, () => {}, { enableHighAccuracy: true, maximumAge: 1000 });
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8; const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async function handleStartTracking() {
    setIsTracking(true); setDistance(0);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const start = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setStartLocation(start);
      });
    }
  }

  async function handleStopTracking() {
    setIsTracking(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let endLocation = '';
      if (navigator.geolocation && lastPositionRef.current) { endLocation = await reverseGeocode(lastPositionRef.current.coords.latitude, lastPositionRef.current.coords.longitude); }
      const amount = distance * rate;
      await supabase.from('mileage').insert({ user_id: user.id, date: new Date().toISOString().split('T')[0], distance, start_location: startLocation || null, end_location: endLocation || null, purpose: purpose || null, is_business: isBusiness, rate, amount });
      setDistance(0); setPurpose(''); setIsBusiness(true);
      loadTrips();
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  }

  async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch { return `${lat.toFixed(4)}, ${lon.toFixed(4)}`; }
  }

  async function deleteTrip(id: string) { if (!confirm('Delete this trip?')) return; const { error } = await supabase.from('mileage').delete().eq('id', id); if (!error) loadTrips(); }

  function exportToCSV() {
    if (filteredTrips.length === 0) { alert('No trips to export'); return; }
    const headers = ['Date', 'Distance (miles)', 'Purpose', 'Type', 'Rate', 'Amount', 'Start Location', 'End Location'];
    const rows = filteredTrips.map(trip => [trip.date, trip.distance.toFixed(2), `"${trip.purpose || 'No purpose'}"`, trip.is_business ? 'Business' : 'Personal', trip.rate.toFixed(2), trip.amount.toFixed(2), `"${trip.start_location || ''}"`, `"${trip.end_location || ''}"`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })); link.download = `mileage_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="expenses" />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mileage Tracker</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Auto-Tracking</h2>
              <p className="text-sm text-gray-600">Automatically starts when you drive over 5 mph</p>
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
                  <p className="text-green-700">Distance: {distance.toFixed(2)} miles</p>
                  <p className="text-sm text-green-600">From: {startLocation || 'Loading...'}</p>
                </div>
                <button onClick={handleStopTracking} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Stop & Save Trip</button>
              </div>

              <div className="mt-4 space-y-2">
                <input type="text" placeholder="Trip purpose (optional)" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                <label className="flex items-center gap-2"><input type="checkbox" checked={isBusiness} onChange={(e) => setIsBusiness(e.target.checked)} className="w-4 h-4" /><span className="text-sm">Business trip</span></label>
              </div>
            </div>
          )}

          {!isTracking && (<button onClick={handleStartTracking} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Start Manual Tracking</button>)}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Total Miles</p><p className="text-2xl font-bold text-gray-900">{totalMiles.toFixed(1)}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Business Miles</p><p className="text-2xl font-bold text-gray-900">{businessMiles.toFixed(1)}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Personal Miles</p><p className="text-2xl font-bold text-gray-900">{personalMiles.toFixed(1)}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Total Amount</p><p className="text-2xl font-bold text-blue-700">${totalAmount.toFixed(2)}</p></div>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">No trips yet</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Date</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Distance (mi)</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Purpose</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Type</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Rate</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Amount</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Start</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">End</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((t, idx) => (
                  <tr key={t.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-2">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{t.distance.toFixed(2)}</td>
                    <td className="px-4 py-2">{t.purpose || '—'}</td>
                    <td className="px-4 py-2">{t.is_business ? 'Business' : 'Personal'}</td>
                    <td className="px-4 py-2">${t.rate.toFixed(2)}</td>
                    <td className="px-4 py-2">${t.amount.toFixed(2)}</td>
                    <td className="px-4 py-2">{t.start_location || '—'}</td>
                    <td className="px-4 py-2">{t.end_location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <button onClick={exportToCSV} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Export CSV</button>
          <Link href="/expenses/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">← Back to Dashboard</Link>
        </div>
      </main>
    </div>
  );
}
