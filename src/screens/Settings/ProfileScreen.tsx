import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Picker } from '@react-native-picker/picker';
import { INDUSTRY_CATEGORIES, INDUSTRIES } from '../../services/industryCategories';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface UserProfile {
  full_name: string;
  industry: string;
  business_name: string;
  phone: string;
}

export default function ProfileScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    industry: '',
    business_name: '',
    phone: '',
  });
  const [email, setEmail] = useState('');
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile.industry) {
      setSuggestedCategories(INDUSTRY_CATEGORIES[profile.industry] || []);
    } else {
      setSuggestedCategories([]);
    }
  }, [profile.industry]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || '');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        // Don't throw error - profile might not exist yet and will be created on first save
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          industry: data.industry || '',
          business_name: data.business_name || '',
          phone: data.phone || '',
        });
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      // Don't show alert for profile not found - will be created on first save
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          industry: profile.industry,
          business_name: profile.business_name,
          phone: profile.phone,
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Save error:', error);
        throw error;
      }

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Save profile error:', error);
      Alert.alert('Error', `Failed to save profile: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.disabledInput}>
          <Text style={styles.disabledText}>{email}</Text>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={profile.full_name}
          onChangeText={(text) => setProfile({ ...profile, full_name: text })}
          placeholder="Enter your full name"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={profile.phone}
          onChangeText={(text) => setProfile({ ...profile, phone: text })}
          placeholder="Enter your phone number"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>

        <Text style={styles.label}>Business Name (Optional)</Text>
        <TextInput
          style={styles.input}
          value={profile.business_name}
          onChangeText={(text) => setProfile({ ...profile, business_name: text })}
          placeholder="Enter your business name"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Industry</Text>
        <Text style={styles.helperText}>
          Select your industry to get personalized expense category suggestions
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={profile.industry}
            onValueChange={(value) => setProfile({ ...profile, industry: value })}
            style={styles.picker}
          >
            <Picker.Item label="Select an industry..." value="" />
            {INDUSTRIES.map((industry) => (
              <Picker.Item key={industry} label={industry} value={industry} />
            ))}
          </Picker>
        </View>
      </View>

      {suggestedCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Expense Categories</Text>
          <Text style={styles.helperText}>
            Based on your industry, here are common expense categories you might use:
          </Text>
          <View style={styles.categoriesGrid}>
            {suggestedCategories.map((category) => (
              <View key={category} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{category}</Text>
              </View>
            ))}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 These categories are automatically available when adding expenses in your Business profile.
              You can also add custom categories in the Categories screen.
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  disabledInput: {
    backgroundColor: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
  },
  disabledText: {
    fontSize: 16,
    color: '#6b7280',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoryChip: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
