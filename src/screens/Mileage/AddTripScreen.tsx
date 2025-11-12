import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { MileageTrip, IRS_MILEAGE_RATE } from '../../types';
import * as Location from 'expo-location';
import { useProfile } from '../../context/ProfileContext';
import { getTodayFormatted, formatDateDisplay, formatDateForDatabase } from '../../utils/dateUtils';

type AddTripScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddTrip'>;
type AddTripScreenRouteProp = RouteProp<RootStackParamList, 'AddTrip'>;

interface Props {
  navigation: AddTripScreenNavigationProp;
  route: AddTripScreenRouteProp;
}

export default function AddTripScreen({ navigation, route }: Props) {
  const { tripId } = route.params || {};
  const isEditMode = !!tripId;
  const { activeProfile } = useProfile();

  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getTodayFormatted()); // MM/DD/YYYY format
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [endTime, setEndTime] = useState('');
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [distance, setDistance] = useState('');
  const [purpose, setPurpose] = useState<'business' | 'personal'>('business');
  const [notes, setNotes] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mileage_trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;
      if (data) {
        const startDateTime = new Date(data.start_time);
        setStartDate(formatDateDisplay(data.start_time.split('T')[0])); // Convert to MM/DD/YYYY
        setStartTime(startDateTime.toTimeString().slice(0, 5));

        if (data.end_time) {
          const endDateTime = new Date(data.end_time);
          setEndTime(endDateTime.toTimeString().slice(0, 5));
        }

        setStartAddress(data.start_location.address || '');
        setEndAddress(data.end_location?.address || '');
        setDistance(data.distance_miles.toString());
        setPurpose(data.purpose);
        setNotes(data.notes || '');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const formattedAddress = `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`.trim();
        setStartAddress(formattedAddress);
      }
    } catch (error: any) {
      Alert.alert('Location Error', error.message);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!startDate || !startTime || !endTime || !startAddress || !endAddress || !distance) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const parsedDistance = parseFloat(distance);
    if (isNaN(parsedDistance) || parsedDistance <= 0) {
      Alert.alert('Error', 'Please enter a valid distance');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Combine date and time (convert MM/DD/YYYY to YYYY-MM-DD first)
      const dbDate = formatDateForDatabase(startDate);
      const startDateTime = new Date(`${dbDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${dbDate}T${endTime}`).toISOString();

      const tripData = {
        user_id: user.id,
        start_time: startDateTime,
        end_time: endDateTime,
        start_location: {
          latitude: 0, // Will be improved with actual GPS coords
          longitude: 0,
          address: startAddress,
        },
        end_location: {
          latitude: 0,
          longitude: 0,
          address: endAddress,
        },
        distance_miles: parsedDistance,
        purpose,
        profile: activeProfile,
        notes: notes || null,
        fuel_stops: [],
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('mileage_trips')
          .update(tripData)
          .eq('id', tripId);

        if (error) throw error;
        Alert.alert('Success', 'Trip updated successfully');
      } else {
        const { error } = await supabase
          .from('mileage_trips')
          .insert([tripData]);

        if (error) throw error;
        Alert.alert('Success', 'Trip added successfully');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const reimbursement = distance ? parseFloat(distance) * IRS_MILEAGE_RATE : 0;

  if (loading && isEditMode) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{isEditMode ? 'Edit Trip' : 'Add Manual Trip'}</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>
              Date <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>
                Start Time <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={[styles.field, styles.halfField]}>
              <Text style={styles.label}>
                End Time <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Starting Location <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={startAddress}
              onChangeText={setStartAddress}
              placeholder="Enter starting address"
              placeholderTextColor="#9ca3af"
              multiline
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color="#ea580c" />
              ) : (
                <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Destination <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={endAddress}
              onChangeText={setEndAddress}
              placeholder="Enter destination address"
              placeholderTextColor="#9ca3af"
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Distance (miles) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={setDistance}
              placeholder="0.0"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Trip Purpose <Text style={styles.required}>*</Text>
            </Text>
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

          {purpose === 'business' && distance && (
            <View style={styles.reimbursementCard}>
              <Text style={styles.reimbursementLabel}>IRS Reimbursement (${IRS_MILEAGE_RATE}/mi)</Text>
              <Text style={styles.reimbursementValue}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reimbursement)}
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add trip notes, client name, etc..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Update Trip' : 'Save Trip'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  halfField: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ea580c',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationButton: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ea580c',
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '600',
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
    padding: 16,
    alignItems: 'center',
  },
  purposeButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  purposeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  purposeButtonTextActive: {
    color: '#fff',
  },
  reimbursementCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  reimbursementLabel: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  reimbursementValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
