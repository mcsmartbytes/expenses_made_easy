import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { MileageTrip, IRS_MILEAGE_RATE } from '../../types';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useProfile } from '../../context/ProfileContext';

const LOCATION_TASK_NAME = 'background-location-task';

type ActiveTripScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ActiveTrip'>;

interface Props {
  navigation: ActiveTripScreenNavigationProp;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
}

export default function ActiveTripScreen({ navigation }: Props) {
  const { activeProfile } = useProfile();
  const [activeTrip, setActiveTrip] = useState<MileageTrip | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [distance, setDistance] = useState(0);
  const [purpose, setPurpose] = useState<'business' | 'personal'>('business');
  const [fuelStops, setFuelStops] = useState<Array<any>>([]);
  const [gettingInitialLocation, setGettingInitialLocation] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const lastLocation = useRef<LocationPoint | null>(null);

  useEffect(() => {
    checkForActiveTrip();
    // Get initial location when screen loads
    if (!tracking) {
      getInitialLocation();
    }

    return () => {
      stopLocationTracking();
    };
  }, []);

  const getInitialLocation = async () => {
    try {
      setGettingInitialLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGettingInitialLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting initial location:', error);
      Alert.alert('Location Error', 'Could not get your location. Please check your GPS settings and try again.');
    } finally {
      setGettingInitialLocation(false);
    }
  };

  useEffect(() => {
    if (tracking && currentLocation && lastLocation.current) {
      const dist = calculateDistance(
        lastLocation.current.latitude,
        lastLocation.current.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );
      setDistance(prev => prev + dist);
    }
    lastLocation.current = currentLocation;
  }, [currentLocation]);

  const checkForActiveTrip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mileage_trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .is('end_time', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setActiveTrip(data);
        setDistance(data.distance_miles);
        setPurpose(data.purpose);
        setFuelStops(data.fuel_stops || []);
        setTracking(true);
        await startLocationTracking();
      }
    } catch (error: any) {
      console.error('Error checking for active trip:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startLocationTracking = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track trips');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Permission',
          'Background location is recommended for accurate tracking, but you can continue without it.'
        );
      }

      // Start foreground location tracking
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      );
    } catch (error: any) {
      Alert.alert('Location Error', error.message);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const startTrip = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Request location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track trips');
        setLoading(false);
        return;
      }

      // Get current location with a timeout
      Alert.alert('Getting Location', 'Finding your location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const formattedAddress = address[0]
        ? `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`.trim()
        : 'Unknown location';

      const tripData = {
        user_id: user.id,
        start_time: new Date().toISOString(),
        end_time: null,
        start_location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: formattedAddress,
        },
        end_location: null,
        distance_miles: 0,
        purpose,
        profile: activeProfile,
        notes: null,
        fuel_stops: [],
      };

      const { data, error } = await supabase
        .from('mileage_trips')
        .insert([tripData])
        .select()
        .single();

      if (error) throw error;

      setActiveTrip(data);
      setTracking(true);
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        address: formattedAddress,
      });
      lastLocation.current = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      await startLocationTracking();
      Alert.alert('Trip Started', 'Your trip is now being tracked');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addFuelStop = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available');
      return;
    }

    // Prompt for fuel cost
    Alert.prompt(
      'Fuel Stop',
      'Enter the fuel cost (optional):',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: async (fuelCost?: string) => {
            const newFuelStop = {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              timestamp: new Date().toISOString(),
              amount: fuelCost && !isNaN(parseFloat(fuelCost)) ? parseFloat(fuelCost) : undefined,
            };

            const updatedFuelStops = [...fuelStops, newFuelStop];
            setFuelStops(updatedFuelStops);

            if (activeTrip) {
              try {
                await supabase
                  .from('mileage_trips')
                  .update({ fuel_stops: updatedFuelStops })
                  .eq('id', activeTrip.id);

                Alert.alert('Fuel Stop Added', fuelCost ? `Fuel stop marked with cost $${parseFloat(fuelCost).toFixed(2)}` : 'Fuel stop has been marked on your trip');
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const endTrip = async () => {
    if (!activeTrip) return;

    Alert.alert(
      'End Trip',
      'Are you sure you want to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const location = await Location.getCurrentPositionAsync({});
              const address = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              const formattedAddress = address[0]
                ? `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`.trim()
                : 'Unknown location';

              const { error } = await supabase
                .from('mileage_trips')
                .update({
                  end_time: new Date().toISOString(),
                  end_location: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    address: formattedAddress,
                  },
                  distance_miles: distance,
                  purpose,
                  fuel_stops: fuelStops,
                })
                .eq('id', activeTrip.id);

              if (error) throw error;

              stopLocationTracking();
              setTracking(false);
              Alert.alert('Trip Ended', 'Your trip has been saved', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const updateTripInRealtime = async () => {
    if (!activeTrip) return;

    try {
      await supabase
        .from('mileage_trips')
        .update({
          distance_miles: distance,
          purpose,
        })
        .eq('id', activeTrip.id);
    } catch (error: any) {
      console.error('Error updating trip:', error);
    }
  };

  useEffect(() => {
    if (activeTrip && tracking) {
      const interval = setInterval(updateTripInRealtime, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeTrip, distance, purpose, tracking]);

  const reimbursement = purpose === 'business' ? distance * IRS_MILEAGE_RATE : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {!tracking ? (
        <View style={styles.startContainer}>
          <Text style={styles.title}>Start a New Trip 🚗</Text>
          <Text style={styles.subtitle}>Track your mileage automatically with GPS</Text>

          {gettingInitialLocation && (
            <View style={styles.locationStatusCard}>
              <ActivityIndicator color="#ea580c" />
              <Text style={styles.locationStatusText}>Getting your location...</Text>
            </View>
          )}

          {!gettingInitialLocation && currentLocation && (
            <View style={[styles.locationStatusCard, styles.locationFoundCard]}>
              <Text style={styles.locationFoundText}>📍 Location Ready</Text>
            </View>
          )}

          {!gettingInitialLocation && !currentLocation && (
            <View style={[styles.locationStatusCard, styles.locationErrorCard]}>
              <Text style={styles.locationErrorText}>⚠️ Location not available</Text>
              <TouchableOpacity onPress={getInitialLocation} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.purposeSection}>
            <Text style={styles.label}>Trip Purpose</Text>
            <View style={styles.purposeButtons}>
              <TouchableOpacity
                style={[
                  styles.purposeButton,
                  purpose === 'business' && styles.purposeButtonActive,
                ]}
                onPress={() => setPurpose('business')}
              >
                <Text
                  style={[
                    styles.purposeButtonText,
                    purpose === 'business' && styles.purposeButtonTextActive,
                  ]}
                >
                  💼 Business
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.purposeButton,
                  purpose === 'personal' && styles.purposeButtonActive,
                ]}
                onPress={() => setPurpose('personal')}
              >
                <Text
                  style={[
                    styles.purposeButtonText,
                    purpose === 'personal' && styles.purposeButtonTextActive,
                  ]}
                >
                  🏠 Personal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.startButton, (loading || gettingInitialLocation) && styles.buttonDisabled]}
            onPress={startTrip}
            disabled={loading || gettingInitialLocation}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Start Tracking</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => navigation.navigate('AddTrip', {})}
          >
            <Text style={styles.manualButtonText}>Or Add Trip Manually</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.trackingContainer}>
          <View style={styles.trackingHeader}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording</Text>
            </View>
            <View style={[styles.badge, purpose === 'business' ? styles.businessBadge : styles.personalBadge]}>
              <Text style={styles.badgeText}>{purpose === 'business' ? '💼 Business' : '🏠 Personal'}</Text>
            </View>
          </View>

          <View style={styles.distanceCard}>
            <Text style={styles.distanceLabel}>Distance Traveled</Text>
            <Text style={styles.distanceValue}>{distance.toFixed(2)} mi</Text>
            {purpose === 'business' && (
              <Text style={styles.reimbursementText}>
                Reimbursement: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reimbursement)}
              </Text>
            )}
          </View>

          {currentLocation && (
            <View style={styles.locationCard}>
              <Text style={styles.cardTitle}>Current Location</Text>
              <Text style={styles.locationText}>
                📍 {currentLocation.address || `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
              </Text>
            </View>
          )}

          {fuelStops.length > 0 && (
            <View style={styles.fuelStopsCard}>
              <Text style={styles.cardTitle}>Fuel Stops ({fuelStops.length})</Text>
              {fuelStops.map((stop, index) => (
                <View key={index} style={styles.fuelStopItem}>
                  <Text style={styles.fuelStopText}>
                    ⛽ Stop {index + 1} - {new Date(stop.timestamp).toLocaleTimeString()}
                  </Text>
                  {stop.amount && (
                    <Text style={styles.fuelStopAmount}>
                      ${stop.amount.toFixed(2)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.fuelStopButton}
              onPress={addFuelStop}
              disabled={!currentLocation}
            >
              <Text style={styles.fuelStopButtonText}>⛽ Mark Fuel Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.purposeToggleButton}
              onPress={() => setPurpose(purpose === 'business' ? 'personal' : 'business')}
            >
              <Text style={styles.purposeToggleText}>
                Switch to {purpose === 'business' ? 'Personal' : 'Business'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.endButton, loading && styles.buttonDisabled]}
              onPress={endTrip}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.endButtonText}>End Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 24,
  },
  startContainer: {
    flex: 1,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  purposeSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  purposeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  purposeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  purposeButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  purposeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  purposeButtonTextActive: {
    color: '#fff',
  },
  startButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  manualButton: {
    padding: 16,
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  trackingContainer: {
    paddingTop: 20,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  businessBadge: {
    backgroundColor: '#dbeafe',
  },
  personalBadge: {
    backgroundColor: '#f3f4f6',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  distanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  distanceLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  distanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ea580c',
    marginBottom: 8,
  },
  reimbursementText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fuelStopsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  fuelStopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  fuelStopText: {
    fontSize: 14,
    color: '#6b7280',
  },
  fuelStopAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  fuelStopButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ea580c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fuelStopButtonText: {
    color: '#ea580c',
    fontSize: 16,
    fontWeight: '600',
  },
  purposeToggleButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  purposeToggleText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  locationStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  locationFoundCard: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  locationErrorCard: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
    flexDirection: 'column',
    gap: 8,
  },
  locationStatusText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  locationFoundText: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  locationErrorText: {
    fontSize: 16,
    color: '#d97706',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
