import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase } from '../services/supabase';

const TASK_NAME = 'auto-start-trip';
const SPEED_THRESHOLD_MS = 3.0; // ~6.7 mph

// Ensure the task is defined exactly once
// Expo requires defineTask at the module scope
try {
  TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('AutoStart task error:', error);
      return;
    }
    const payload = data as { locations?: Location.LocationObject[] } | undefined;
    if (!payload?.locations || payload.locations.length === 0) return;

    const loc = payload.locations[payload.locations.length - 1];
    const sp = typeof loc.coords.speed === 'number' ? loc.coords.speed : null;
    if (sp == null || sp < SPEED_THRESHOLD_MS) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already have an active trip
      const { data: existing, error: exErr } = await supabase
        .from('mileage_trips')
        .select('id')
        .eq('user_id', user.id)
        .eq('profile', 'business') // default if unknown in background
        .is('end_time', null)
        .maybeSingle();
      if (exErr) throw exErr;
      if (existing) return;

      const addrArr = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const address = addrArr[0]
        ? `${addrArr[0].street || ''}, ${addrArr[0].city || ''}, ${addrArr[0].region || ''}`.trim()
        : 'Unknown location';

      const tripData = {
        user_id: user.id,
        start_time: new Date().toISOString(),
        end_time: null,
        start_location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address,
        },
        end_location: null,
        distance_miles: 0,
        purpose: 'business',
        profile: 'business',
        notes: null,
        fuel_stops: [],
      };
      const { error: insErr } = await supabase.from('mileage_trips').insert([tripData]);
      if (insErr) throw insErr;
    } catch (e) {
      console.error('AutoStart trip (background) failed:', e);
    }
  });
} catch (e) {
  // ignore re-definition in fast refresh
}

export const AUTO_START_TASK_NAME = TASK_NAME;

