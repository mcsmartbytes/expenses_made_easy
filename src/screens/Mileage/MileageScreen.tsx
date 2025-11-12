import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { MileageTrip, IRS_MILEAGE_RATE } from '../../types';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../theme/colors';
import { formatDateDisplay } from '../../utils/dateUtils';

type MileageScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Mileage'>;

interface Props {
  navigation: MileageScreenNavigationProp;
}

export default function MileageScreen({ navigation }: Props) {
  const { activeProfile } = useProfile();
  const theme = useTheme();
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTrip, setActiveTrip] = useState<MileageTrip | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number; t: number } | null>(null);
  const consecutiveMovingRef = useRef(0);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    fetchTrips();
  }, [activeProfile]);

  useEffect(() => {

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('mileage_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mileage_trips' }, () => {
        fetchTrips();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Foreground auto-start when user begins driving
  useEffect(() => {
    let isMounted = true;

    const startForegroundWatcher = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        // Lightweight watcher to detect motion
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2000,
            distanceInterval: 3,
          },
          async (loc) => {
            if (!isMounted || autoStartedRef.current) return;
            if (activeTrip) return; // already tracking

            const now = Date.now();
            const speedMs = typeof loc.coords.speed === 'number' && loc.coords.speed >= 0 ? loc.coords.speed : null;

            // Compute fallback speed from distance between fixes if needed
            let speed = speedMs ?? null;
            if (speed == null && lastPointRef.current) {
              const { lat, lon, t } = lastPointRef.current;
              const dt = (now - t) / 1000; // seconds
              if (dt > 0) {
                const dMeters = haversineMeters(lat, lon, loc.coords.latitude, loc.coords.longitude);
                speed = dMeters / dt;
              }
            }

            lastPointRef.current = { lat: loc.coords.latitude, lon: loc.coords.longitude, t: now };

            // If moving faster than ~6.7 mph (3.0 m/s), count consecutive readings
            const MOVING_THRESHOLD_MS = 3.0;
            if (speed != null && speed > MOVING_THRESHOLD_MS) {
              consecutiveMovingRef.current += 1;
            } else {
              consecutiveMovingRef.current = 0;
            }

            if (consecutiveMovingRef.current >= 2) {
              // Auto-start a new trip in DB, then navigate to ActiveTrip
              autoStartedRef.current = true;
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Ensure no active trip exists (race protection)
                const { data: existing, error: exErr } = await supabase
                  .from('mileage_trips')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('profile', activeProfile)
                  .is('end_time', null)
                  .maybeSingle();
                if (exErr) throw exErr;
                if (!existing) {
                  const addrArr = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                  const address = addrArr[0] ? `${addrArr[0].street || ''}, ${addrArr[0].city || ''}, ${addrArr[0].region || ''}`.trim() : 'Unknown location';
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
                    profile: activeProfile,
                    notes: null,
                    fuel_stops: [],
                  };
                  const { error } = await supabase.from('mileage_trips').insert([tripData]);
                  if (error) throw error;
                }
                // Navigate to active tracking UI
                navigation.navigate('ActiveTrip');
              } catch (e) {
                console.error('Auto-start trip failed:', e);
                autoStartedRef.current = false; // allow retry if it failed
              }
            }
          }
        );
      } catch (err) {
        // Ignore
      }
    };

    startForegroundWatcher();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [activeTrip, activeProfile, navigation]);

  const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // meters
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mileage_trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .order('start_time', { ascending: false });

      if (error) throw error;

      const allTrips = data || [];

      // Find active trip (one without end_time)
      const active = allTrips.find(trip => !trip.end_time);
      setActiveTrip(active || null);

      // Set completed trips
      setTrips(allTrips.filter(trip => trip.end_time));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  const deleteTrip = async (id: string) => {
    Alert.alert('Delete Trip', 'Are you sure you want to delete this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('mileage_trips').delete().eq('id', id);
            if (error) throw error;
            fetchTrips();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString); // Returns MM/DD/YYYY format
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const renderTripItem = ({ item }: { item: MileageTrip }) => {
    const reimbursement = item.distance_miles * IRS_MILEAGE_RATE;
    const totalFuelCost = item.fuel_stops?.reduce((sum, stop) => sum + (stop.amount || 0), 0) || 0;

    return (
      <TouchableOpacity
        style={[styles.tripCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}
        onPress={() => navigation.navigate('AddTrip', { tripId: item.id })}
        onLongPress={() => deleteTrip(item.id)}
      >
        <View style={styles.tripHeader}>
          <View style={[
            styles.badge,
            item.purpose === 'business'
              ? { backgroundColor: theme.colors.primary[100] }
              : { backgroundColor: theme.colors.background.tertiary }
          ]}>
            <Text style={[styles.badgeText, { color: theme.colors.text.primary }]}>
              {item.purpose === 'business' ? '💼 Business' : '🏠 Personal'}
            </Text>
          </View>
          <Text style={[styles.tripDistance, { color: theme.colors.text.primary }]}>{item.distance_miles.toFixed(1)} mi</Text>
        </View>

        <View style={styles.tripLocations}>
          <Text style={[styles.locationText, { color: theme.colors.text.secondary }]}>📍 {item.start_location.address || 'Starting point'}</Text>
          <Text style={[styles.locationArrow, { color: theme.colors.text.tertiary }]}>↓</Text>
          <Text style={[styles.locationText, { color: theme.colors.text.secondary }]}>📍 {item.end_location?.address || 'Destination'}</Text>
        </View>

        <View style={styles.tripFooter}>
          <Text style={[styles.tripDate, { color: theme.colors.text.tertiary }]}>{formatDate(item.start_time)}</Text>
          <Text style={[styles.tripTime, { color: theme.colors.text.tertiary }]}>{formatTime(item.start_time)} - {item.end_time ? formatTime(item.end_time) : 'In progress'}</Text>
          {item.purpose === 'business' && (
            <Text style={[styles.reimbursement, { color: theme.colors.primary[600] }]}>{formatCurrency(reimbursement)}</Text>
          )}
        </View>

        {item.fuel_stops && item.fuel_stops.length > 0 && (
          <View style={[styles.fuelStopsBadge, { borderTopColor: theme.colors.border.light }]}>
            <Text style={[styles.fuelStopsText, { color: theme.colors.text.secondary }]}>
              ⛽ {item.fuel_stops.length} fuel stop{item.fuel_stops.length !== 1 ? 's' : ''}
              {totalFuelCost > 0 && ` • ${formatCurrency(totalFuelCost)}`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getTotalStats = () => {
    const totalMiles = trips.reduce((sum, trip) => sum + trip.distance_miles, 0);
    const businessMiles = trips.filter(t => t.purpose === 'business').reduce((sum, trip) => sum + trip.distance_miles, 0);
    const totalReimbursement = businessMiles * IRS_MILEAGE_RATE;
    return { totalMiles, businessMiles, totalReimbursement };
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  const stats = getTotalStats();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Mileage Tracking 🚗</Text>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary[600] }]}>{stats.totalMiles.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total Miles</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary[600] }]}>{stats.businessMiles.toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Business Miles</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary[600] }]}>{formatCurrency(stats.totalReimbursement)}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Reimbursement</Text>
          </View>
        </View>
      </View>

      {activeTrip && (
        <TouchableOpacity
          style={[styles.activeTripBanner, { backgroundColor: theme.colors.error[50], borderColor: theme.colors.error[500] }]}
          onPress={() => navigation.navigate('ActiveTrip')}
        >
          <View style={styles.activeTripContent}>
            <Text style={[styles.activeTripTitle, { color: theme.colors.error[600] }]}>🔴 Trip in Progress</Text>
            <Text style={[styles.activeTripText, { color: theme.colors.error[700] }]}>{activeTrip.distance_miles.toFixed(1)} miles</Text>
          </View>
          <Text style={[styles.activeTripButton, { color: theme.colors.error[600] }]}>View →</Text>
        </TouchableOpacity>
      )}

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No trips yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>Start tracking your mileage today</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary[600]}
              colors={[theme.colors.primary[600]]}
            />
          }
        />
      )}

      <View style={styles.buttonContainer}>
        {!activeTrip && (
          <TouchableOpacity
            style={[styles.startTripButton, { backgroundColor: theme.colors.error[600] }]}
            onPress={() => navigation.navigate('ActiveTrip')}
          >
            <Text style={[styles.startTripButtonText, { color: theme.colors.text.inverse }]}>🚗 Start Trip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.primary[600] }]}
          onPress={() => navigation.navigate('AddTrip', {})}
        >
          <Text style={[styles.addButtonText, { color: theme.colors.primary[600] }]}>+ Add Manual Trip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticTheme.colors.background.primary,
  },
  header: {
    padding: staticTheme.spacing.lg,
    paddingBottom: staticTheme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.text.primary,
    marginBottom: staticTheme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: staticTheme.colors.background.secondary,
    borderRadius: staticTheme.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: staticTheme.colors.border.light,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.primary[600],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: staticTheme.colors.text.secondary,
    textAlign: 'center',
  },
  activeTripBanner: {
    backgroundColor: staticTheme.colors.error[50],
    borderWidth: 2,
    borderColor: staticTheme.colors.error[500],
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    marginHorizontal: staticTheme.spacing.lg,
    marginBottom: staticTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTripContent: {
    flex: 1,
  },
  activeTripTitle: {
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.error[600],
    marginBottom: 4,
  },
  activeTripText: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.error[700],
  },
  activeTripButton: {
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
    color: staticTheme.colors.error[600],
  },
  listContent: {
    padding: staticTheme.spacing.lg,
    paddingTop: 8,
  },
  tripCard: {
    backgroundColor: staticTheme.colors.background.secondary,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticTheme.colors.border.light,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    borderRadius: staticTheme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  businessBadge: {
    backgroundColor: staticTheme.colors.primary[100],
  },
  personalBadge: {
    backgroundColor: staticTheme.colors.background.tertiary,
  },
  badgeText: {
    fontSize: staticTheme.typography.sizes.xs,
    fontWeight: staticTheme.typography.weights.semibold,
    color: staticTheme.colors.text.primary,
  },
  tripDistance: {
    fontSize: 24,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.text.primary,
  },
  tripLocations: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.text.secondary,
    marginBottom: 4,
  },
  locationArrow: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.text.tertiary,
    marginLeft: 8,
    marginVertical: 2,
  },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripDate: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.tertiary,
  },
  tripTime: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.tertiary,
  },
  reimbursement: {
    fontSize: staticTheme.typography.sizes.sm,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.primary[600],
    marginLeft: 'auto',
  },
  fuelStopsBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: staticTheme.colors.border.light,
  },
  fuelStopsText: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: staticTheme.spacing.lg,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: staticTheme.typography.weights.semibold,
    color: staticTheme.colors.text.secondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.text.tertiary,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: staticTheme.spacing.lg,
    gap: 12,
  },
  startTripButton: {
    backgroundColor: staticTheme.colors.error[600],
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    alignItems: 'center',
  },
  startTripButtonText: {
    color: staticTheme.colors.text.inverse,
    fontSize: 18,
    fontWeight: staticTheme.typography.weights.semibold,
  },
  addButton: {
    backgroundColor: staticTheme.colors.background.secondary,
    borderWidth: 2,
    borderColor: staticTheme.colors.primary[600],
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: staticTheme.colors.primary[600],
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
  },
});
