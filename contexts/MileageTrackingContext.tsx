'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { nativeMileageTracker, TripData } from '@/utils/nativeMileageTracker';
import { supabase } from '@/utils/supabase';
import { useUserMode } from '@/contexts/UserModeContext';
import { getCurrentMileageRate } from '@/lib/irsRates';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const MIN_ACCURACY_METERS = 100;
const DEFAULT_MIN_SPEED_MPH = 5;

interface MileageTrackingContextType {
  isTracking: boolean;
  isNativeMode: boolean;
  distance: number;
  currentSpeed: number;
  startLocation: string;
  idleTime: number;
  purpose: string;
  setPurpose: (p: string) => void;
  isBusiness: boolean;
  setIsBusiness: (b: boolean) => void;
  startTracking: (lat?: number, lon?: number) => Promise<void>;
  stopTracking: (isAutoSave?: boolean) => Promise<void>;
  minSpeedMph: number;
  onTripSaved: (callback: () => void) => () => void;
}

const MileageTrackingContext = createContext<MileageTrackingContextType | undefined>(undefined);

export function MileageTrackingProvider({ children }: { children: ReactNode }) {
  const { isBusiness: defaultIsBusiness } = useUserMode();

  const [isTracking, setIsTracking] = useState(false);
  const [isNativeMode, setIsNativeMode] = useState(false);
  const [distance, setDistance] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [startLocation, setStartLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isBusiness, setIsBusiness] = useState(defaultIsBusiness);
  const [idleTime, setIdleTime] = useState(0);
  const [minSpeedMph, setMinSpeedMph] = useState(DEFAULT_MIN_SPEED_MPH);

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lon: number; timestamp: number } | null>(null);
  const autoStartTriggered = useRef(false);
  const isTrackingRef = useRef(false);
  const distanceRef = useRef(0);
  const lastMovementTimeRef = useRef<number>(Date.now());
  const idleCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startLocationRef = useRef('');
  const purposeRef = useRef('');
  const isBusinessRef = useRef(true);
  const minSpeedMphRef = useRef(DEFAULT_MIN_SPEED_MPH);
  const tripSavedListeners = useRef<Set<() => void>>(new Set());
  const initStarted = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { purposeRef.current = purpose; }, [purpose]);
  useEffect(() => { isBusinessRef.current = isBusiness; }, [isBusiness]);

  // Update isBusiness when mode changes (only when not tracking)
  useEffect(() => {
    if (!isTracking) {
      setIsBusiness(defaultIsBusiness);
    }
  }, [defaultIsBusiness, isTracking]);

  // Register callback for trip saved events
  const onTripSaved = useCallback((callback: () => void) => {
    tripSavedListeners.current.add(callback);
    return () => { tripSavedListeners.current.delete(callback); };
  }, []);

  function notifyTripSaved() {
    tripSavedListeners.current.forEach(cb => cb());
  }

  // --- Geocoding ---
  async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch { return `${lat.toFixed(4)}, ${lon.toFixed(4)}`; }
  }

  // --- Distance ---
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8;
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- Wake lock ---
  async function acquireWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch { /* not available */ }
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }

  // --- Save trip ---
  async function saveTrip(tripData: TripData, isAutoSave: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rate = getCurrentMileageRate();
      const amount = tripData.distance * rate;
      const tripPurpose = isAutoSave ? (purposeRef.current || 'Auto-saved trip') : (purposeRef.current || null);
      const tripIsBusiness = isAutoSave ? isBusinessRef.current : isBusinessRef.current;

      await supabase.from('mileage').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        distance: tripData.distance,
        start_location: tripData.startLocation || null,
        end_location: tripData.endLocation || null,
        purpose: tripPurpose,
        is_business: tripIsBusiness,
        rate,
        amount,
      });

      setPurpose('');
      setIsBusiness(defaultIsBusiness);
      purposeRef.current = '';
      isBusinessRef.current = defaultIsBusiness;
      notifyTripSaved();

      if (isAutoSave) {
        console.log(`Trip auto-saved: ${tripData.distance.toFixed(2)} miles`);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  }

  // --- Web speed monitoring ---
  function startSpeedMonitoring() {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;
        const timestamp = position.timestamp;

        let speedMph = 0;
        if (speed !== null && speed >= 0) {
          speedMph = speed * 2.237;
        } else if (lastPositionRef.current) {
          const timeDiff = (timestamp - lastPositionRef.current.timestamp) / 1000;
          if (timeDiff > 0) {
            const dist = calculateDistance(lastPositionRef.current.lat, lastPositionRef.current.lon, latitude, longitude);
            speedMph = (dist / timeDiff) * 3600;
          }
        }

        setCurrentSpeed(speedMph);

        // Auto-start when driving
        if (speedMph >= minSpeedMphRef.current && !isTrackingRef.current && !autoStartTriggered.current) {
          autoStartTriggered.current = true;
          handleStartTracking(latitude, longitude);
        }

        const isAccuracyGood = accuracy <= MIN_ACCURACY_METERS;

        // Accumulate distance while tracking
        if (isTrackingRef.current && lastPositionRef.current) {
          if (timestamp > lastPositionRef.current.timestamp) {
            const distanceMiles = calculateDistance(
              lastPositionRef.current.lat, lastPositionRef.current.lon,
              latitude, longitude
            );

            const timeDiffSeconds = (timestamp - lastPositionRef.current.timestamp) / 1000;
            const maxReasonableDistance = Math.min(0.5, (timeDiffSeconds / 3600) * 100);

            if (distanceMiles > 0.001 && distanceMiles < maxReasonableDistance) {
              if (isAccuracyGood || distanceMiles < 0.05) {
                distanceRef.current += distanceMiles;
                setDistance(distanceRef.current);

                if (speedMph >= 2) {
                  lastMovementTimeRef.current = Date.now();
                }
              }
            }

            lastPositionRef.current = { lat: latitude, lon: longitude, timestamp };
          }
        } else {
          lastPositionRef.current = { lat: latitude, lon: longitude, timestamp };
        }
      },
      (error) => { console.error('Geolocation error:', error.message); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  // --- Start tracking ---
  async function handleStartTracking(initialLat?: number, initialLon?: number) {
    setIsTracking(true);
    isTrackingRef.current = true;
    distanceRef.current = 0;
    setDistance(0);
    lastMovementTimeRef.current = Date.now();

    if (isNativeMode) {
      await nativeMileageTracker.startTracking(initialLat, initialLon);
      const state = nativeMileageTracker.getState();
      if (state.startLocation) {
        setStartLocation(state.startLocation);
        startLocationRef.current = state.startLocation;
      }
      return;
    }

    // Web fallback — keep screen on
    acquireWakeLock();

    if (initialLat !== undefined && initialLon !== undefined) {
      lastPositionRef.current = { lat: initialLat, lon: initialLon, timestamp: Date.now() };
      const start = await reverseGeocode(initialLat, initialLon);
      setStartLocation(start);
      startLocationRef.current = start;
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        lastPositionRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude, timestamp: pos.timestamp };
        const start = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setStartLocation(start);
        startLocationRef.current = start;
      });
    }
  }

  // --- Stop tracking ---
  async function handleStopTracking(isAutoSave = false) {
    setIsTracking(false);
    isTrackingRef.current = false;
    autoStartTriggered.current = false;
    releaseWakeLock();

    if (isNativeMode) {
      const tripData = await nativeMileageTracker.stopTracking();
      if (tripData && tripData.distance >= 0.01) {
        await saveTrip(tripData, isAutoSave);
      } else {
        setPurpose('');
        setIsBusiness(defaultIsBusiness);
      }
      distanceRef.current = 0;
      setDistance(0);
      return;
    }

    // Web fallback
    const finalDistance = distanceRef.current;

    if (finalDistance < 0.01) {
      distanceRef.current = 0;
      setDistance(0);
      setPurpose('');
      setIsBusiness(defaultIsBusiness);
      return;
    }

    try {
      let endLocation = '';
      if (lastPositionRef.current) {
        endLocation = await reverseGeocode(lastPositionRef.current.lat, lastPositionRef.current.lon);
      }

      const tripData: TripData = {
        distance: finalDistance,
        startLocation: startLocationRef.current || null,
        endLocation: endLocation || null,
        startTime: new Date(),
        endTime: new Date(),
      };

      await saveTrip(tripData, isAutoSave);
      distanceRef.current = 0;
      setDistance(0);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  }

  // --- Idle check interval ---
  useEffect(() => {
    if (isTracking) {
      idleCheckIntervalRef.current = setInterval(() => {
        const idleMs = Date.now() - lastMovementTimeRef.current;
        setIdleTime(Math.floor(idleMs / 1000));

        if (idleMs >= IDLE_TIMEOUT_MS && isTrackingRef.current && distanceRef.current > 0) {
          console.log('Auto-saving trip after 15 minutes idle');
          handleStopTracking(true);
        }
      }, 30000);
    } else {
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
        idleCheckIntervalRef.current = null;
      }
      setIdleTime(0);
    }
    return () => {
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [isTracking]);

  // --- Load user preferences ---
  async function loadUserPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('user_id', user.id)
        .single();
      if (profile?.preferences?.mileage_auto_start_speed) {
        const speed = Number(profile.preferences.mileage_auto_start_speed);
        if (speed > 0) {
          setMinSpeedMph(speed);
          minSpeedMphRef.current = speed;
          nativeMileageTracker.setAutoStartSpeed(speed);
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  // --- Initialize once on mount, never destroy ---
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    loadUserPreferences();

    (async () => {
      const nativeInitialized = await nativeMileageTracker.initialize({
        onDistanceUpdate: (dist) => {
          distanceRef.current = dist;
          setDistance(dist);
        },
        onSpeedUpdate: (speed) => {
          setCurrentSpeed(speed);
        },
        onAutoStart: () => {
          setIsTracking(true);
          isTrackingRef.current = true;
          autoStartTriggered.current = true;
          const state = nativeMileageTracker.getState();
          if (state.startLocation) setStartLocation(state.startLocation);
        },
        onAutoStop: async (tripData: TripData) => {
          await saveTrip(tripData, true);
          setIsTracking(false);
          isTrackingRef.current = false;
          setDistance(0);
          distanceRef.current = 0;
        },
        onError: (error) => {
          console.error('Native tracker error:', error);
        },
      });

      if (nativeInitialized) {
        setIsNativeMode(true);
        console.log('Using native background tracking');
      } else {
        setIsNativeMode(false);
        console.log('Using web-based tracking (foreground only)');
        startSpeedMonitoring();
      }
    })();

    // NO cleanup / destroy — watcher persists for the entire app session
  }, []);

  const value: MileageTrackingContextType = {
    isTracking,
    isNativeMode,
    distance,
    currentSpeed,
    startLocation,
    idleTime,
    purpose,
    setPurpose,
    isBusiness,
    setIsBusiness,
    startTracking: handleStartTracking,
    stopTracking: handleStopTracking,
    minSpeedMph,
    onTripSaved,
  };

  return (
    <MileageTrackingContext.Provider value={value}>
      {children}
    </MileageTrackingContext.Provider>
  );
}

export function useMileageTracking() {
  const context = useContext(MileageTrackingContext);
  if (context === undefined) {
    throw new Error('useMileageTracking must be used within a MileageTrackingProvider');
  }
  return context;
}
