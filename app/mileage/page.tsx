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
  const [isTracking, setIsTracking] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [startLocation, setStartLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isBusiness, setIsBusiness] = useState(true);
  const [rate, setRate] = useState(0.67);
  
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const autoStartTriggered = useRef(false);

  useEffect(() => {
    loadTrips();
    startSpeedMonitoring();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  async function loadTrips() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('mileage')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  }

  function startSpeedMonitoring() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const speed = position.coords.speed || 0;
        const speedMph = speed * 2.237; // Convert m/s to mph
        setCurrentSpeed(speedMph);

        // Auto-start tracking when speed > 5 mph
        if (speedMph >= 5 && !isTracking && !autoStartTriggered.current) {
          autoStartTriggered.current = true;
          handleStartTracking();
        }

        // Calculate distance if tracking
        if (isTracking && lastPositionRef.current) {
          const distanceMiles = calculateDistance(
            lastPositionRef.current.coords.latitude,
            lastPositionRef.current.coords.longitude,
            position.coords.latitude,
            position.coords.longitude
          );
          setDistance((prev) => prev + distanceMiles);
        }

        lastPositionRef.current = position;
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async function handleStartTracking() {
    setIsTracking(true);
    setDistance(0);
    lastPositionRef.current = null;

    // Get current location name
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const location = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        setStartLocation(location);
      });
    }
  }

  async function handleStopTracking() {
    if (distance < 0.1) {
      alert('Distance too short to save');
      setIsTracking(false);
      autoStartTriggered.current = false;
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let endLocation = '';
      if (navigator.geolocation && lastPositionRef.current) {
        endLocation = await reverseGeocode(
          lastPositionRef.current.coords.latitude,
          lastPositionRef.current.coords.longitude
        );
      }

      const { error } = await supabase.from('mileage').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        distance: parseFloat(distance.toFixed(2)),
        start_location: startLocation || 'Unknown',
        end_location: endLocation || 'Unknown',
        purpose: purpose || 'Business trip',
        is_business: isBusiness,
        rate: rate,
      });

      if (!error) {
        alert(`Trip saved: ${distance.toFixed(2)} miles`);
        setIsTracking(false);
        setDistance(0);
        setPurpose('');
        autoStartTriggered.current = false;
        loadTrips();
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  }

  async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }

  async function deleteTrip(id: string) {
    if (!confirm('Delete this trip?')) return;

    const { error } = await supabase.from('mileage').delete().eq('id', id);

    if (!error) {
      loadTrips();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mileage Tracker</h1>

        {/* Auto-Tracking Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Auto-Tracking</h2>
              <p className="text-sm text-gray-600">
                Automatically starts when you drive over 5 mph
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
                  <p className="font-semibold text-green-900">🚗 Tracking Active</p>
                  <p className="text-green-700">Distance: {distance.toFixed(2)} miles</p>
                  <p className="text-sm text-green-600">From: {startLocation || 'Loading...'}</p>
                </div>
                <button
                  onClick={handleStopTracking}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Stop & Save Trip
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  placeholder="Trip purpose (optional)"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isBusiness}
                    onChange={(e) => setIsBusiness(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Business trip</span>
                </label>
              </div>
            </div>
          )}

          {!isTracking && (
            <button
              onClick={handleStartTracking}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Start Manual Tracking
            </button>
          )}
        </div>

        {/* Recent Trips */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Recent Trips</h2>
          </div>

          <div className="divide-y">
            {trips.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No trips recorded yet</div>
            ) : (
              trips.map((trip) => (
                <div key={trip.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{trip.distance.toFixed(2)} miles</span>
                        {trip.is_business && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Business
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{trip.purpose || 'No purpose'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(trip.date).toLocaleDateString()} • ${trip.amount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTrip(trip.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
