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
  Image,
} from 'react-native';
import Button from '../../components/ui/Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Expense } from '../../types';
import * as ImagePicker from 'expo-image-picker';
// Use legacy FS API for Base64 reading on Expo SDK 54
import * as FileSystem from 'expo-file-system/legacy';
import { useProfile } from '../../context/ProfileContext';
import { getIndustryCategories } from '../../services/industryCategories';
import { theme } from '../../theme/colors';
import { scanReceipt } from '../../services/ocrService';
import { decode as atob } from 'base-64';
import { getTodayFormatted, formatDateDisplay, formatDateForDatabase } from '../../utils/dateUtils';

type AddExpenseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

interface Props {
  navigation: AddExpenseScreenNavigationProp;
  route: AddExpenseScreenRouteProp;
}

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

export default function AddExpenseScreen({ navigation, route }: Props) {
  const { expenseId } = route.params || {};
  const isEditMode = !!expenseId;
  const { activeProfile } = useProfile();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [industryCategories, setIndustryCategories] = useState<string[]>([]);
  const [date, setDate] = useState(getTodayFormatted()); // MM/DD/YYYY format
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [userEditedCategory, setUserEditedCategory] = useState(false);

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Check', 'Other'];

  useEffect(() => {
    fetchUserIndustry();
    fetchCategories();
    if (isEditMode) {
      fetchExpense();
    }
  }, [expenseId, activeProfile]);

  const fetchUserIndustry = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only fetch industry categories for business profile
      if (activeProfile === 'business') {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('industry')
          .eq('user_id', user.id)
          .single();

        if (!error && data && data.industry) {
          const industryCats = getIndustryCategories(data.industry);
          setIndustryCategories(industryCats);
        }
      } else {
        setIndustryCategories([]);
      }
    } catch (error: any) {
      // Silent fail - industry categories are optional
      // This ensures the app still works even if profile table doesn't exist
      setIndustryCategories([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);

      // Set default category
      const allCats = getAllCategories();
      if (allCats.length > 0 && !category) {
        setCategory(allCats[0]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getAllCategories = (): string[] => {
    const customCats = categories.map(c => c.name);
    // For business profile, merge industry categories with custom categories
    if (activeProfile === 'business' && industryCategories.length > 0) {
      const merged = [...industryCategories, ...customCats];
      // Remove duplicates and sort
      return Array.from(new Set(merged)).sort();
    }
    return customCats.sort();
  };

  useEffect(() => {
    (async () => {
      if (userEditedCategory) return;
      const rules = await RulesEngine.list();
      const result = RulesEngine.evaluateSync(rules, { merchant: description, description, notes });
      if (result.category) {
        setCategory(result.category);
      }
    })();
  }, [description, notes, userEditedCategory]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (error) throw error;
      if (data) {
        setDate(formatDateDisplay(data.date)); // Convert to MM/DD/YYYY for display
        setCategory(data.category);
        setDescription(data.description);
        setAmount(data.amount.toString());
        setPaymentMethod(data.payment_method || '');
        setNotes(data.notes || '');
        setReceiptUrl(data.receipt_url);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      await uploadReceipt(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      await uploadReceipt(result.assets[0].uri);
    }
  };

  const scanReceiptWithOCR = async (source: 'camera' | 'gallery') => {
    try {
      setUploadingReceipt(true);

      // Scan receipt with OCR
      const receiptData = await scanReceipt(source);

      // Auto-populate form fields
      if (receiptData.amount) {
        setAmount(receiptData.amount.toString());
      }
      if (receiptData.date) {
        setDate(formatDateDisplay(receiptData.date)); // Convert OCR date to MM/DD/YYYY
      }
      if (receiptData.merchant) {
        setDescription(receiptData.merchant);
      }

      // Upload the receipt image if we have it
      if (receiptData.imageUri) {
        await uploadReceipt(receiptData.imageUri);
      }

      // Build success message with tax breakdown
      let message = 'Receipt scanned successfully!\n\n';
      if (receiptData.merchant) message += `📍 Merchant: ${receiptData.merchant}\n`;
      if (receiptData.date) message += `📅 Date: ${receiptData.date}\n`;

      message += '\n💰 Amount Breakdown:\n';

      // Always show what we found (or didn't find)
      if (receiptData.subtotal) {
        message += `Subtotal: $${receiptData.subtotal.toFixed(2)}\n`;
      } else {
        message += `Subtotal: Not detected\n`;
      }

      if (receiptData.tax) {
        message += `Tax: $${receiptData.tax.toFixed(2)}\n`;
      } else {
        message += `Tax: Not detected\n`;
      }

      if (receiptData.tip) {
        message += `Tip: $${receiptData.tip.toFixed(2)}\n`;
      }

      if (receiptData.total) {
        message += `Total: $${receiptData.total.toFixed(2)}\n`;
      } else if (receiptData.amount) {
        message += `Total: $${receiptData.amount.toFixed(2)}\n`;
      } else {
        message += `Total: Not detected\n`;
      }

      message += '\n✏️ Please review and adjust if needed.';

      Alert.alert('✅ OCR Success', message);
    } catch (error: any) {
      Alert.alert('Scan Failed', error.message || 'Failed to scan receipt. Please try again.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const base64ToArrayBuffer = (base64: string) => {
    const bin = atob(base64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  };

  const uploadReceipt = async (uri: string) => {
    try {
      setUploadingReceipt(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For RN/Expo, fetch the file as base64 and convert to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: (FileSystem as any).EncodingType?.Base64 || 'base64' });
      const arrayBuffer = base64ToArrayBuffer(base64);

      // Generate unique filename
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fallback to local storage
        setReceiptUrl(uri);
        Alert.alert('Info', 'Receipt saved locally (cloud upload unavailable)');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(fileName);

      setReceiptUrl(publicUrl);
      Alert.alert('Success', 'Receipt uploaded to cloud!');
    } catch (error: any) {
      console.error('Upload error:', error);
      // Fallback to local storage
      setReceiptUrl(uri);
      Alert.alert('Info', 'Receipt saved locally');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = () => {
    Alert.alert('Remove Receipt', 'Are you sure you want to remove this receipt?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setReceiptUri(null);
          setReceiptUrl(null);
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!date || !category || !description || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expenseData = {
        user_id: user.id,
        date: formatDateForDatabase(date), // Convert MM/DD/YYYY to YYYY-MM-DD for database
        category,
        description,
        amount: parsedAmount,
        payment_method: paymentMethod || null,
        notes: notes || null,
        receipt_url: receiptUrl || null,
        profile: activeProfile,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expenseId);

        if (error) throw error;
        Alert.alert('Success', 'Expense updated successfully');
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData]);

        if (error) throw error;
        try {
          const budgets = await BudgetsService.list();
          const b = budgets.find(x => x.profile === activeProfile && x.category.toLowerCase() === category.toLowerCase());
          if (b) {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const { data: sumRows } = await supabase
              .from('expenses')
              .select('amount, category')
              .eq('profile', activeProfile)
              .gte('date', monthStart)
              .eq('category', category);
            const spent = (sumRows || []).reduce((s, e: any) => s + (e.amount || 0), 0) + parsedAmount;
            const pct = Math.round((spent / b.amount) * 100);
            if (pct >= 100) {
              Alert.alert('Budget Reached', `You have exceeded the monthly budget for ${category} (${pct}%).`);
            } else if (pct >= 80) {
              Alert.alert('Budget Warning', `You have used ${pct}% of your monthly budget for ${category}.`);
            }
          }
        } catch {}
        Alert.alert('Success', 'Expense added successfully');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{isEditMode ? 'Edit Expense' : 'Add New Expense'}</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>
              Date <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            {activeProfile === 'business' && industryCategories.length > 0 && (
              <Text style={styles.helperText}>
                ✨ Industry-specific categories available
              </Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {getAllCategories().map((catName) => (
                <TouchableOpacity
                  key={catName}
                  style={[
                    styles.categoryChip,
                    category === catName && styles.categoryChipActive,
                  ]}
                  onPress={() => { setUserEditedCategory(true); setCategory(catName); }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === catName && styles.categoryChipTextActive,
                    ]}
                  >
                    {catName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What did you spend on?"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Amount <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.categoryChip,
                    paymentMethod === method && styles.categoryChipActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      paymentMethod === method && styles.categoryChipTextActive,
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Receipt Photo (Optional)</Text>

            {(receiptUri || receiptUrl) ? (
              <View style={styles.receiptContainer}>
                <Image
                  source={{ uri: receiptUri || receiptUrl || '' }}
                  style={styles.receiptImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeReceiptButton}
                  onPress={removeReceipt}
                >
                  <Text style={styles.removeReceiptText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* OCR Scan Buttons (Auto-fill data) */}
                <Text style={styles.scanLabel}>🤖 Smart Scan with OCR (Auto-fill):</Text>
                <View style={styles.receiptButtons}>
                  <TouchableOpacity
                    style={[styles.scanButton, uploadingReceipt && styles.buttonDisabled]}
                    onPress={() => scanReceiptWithOCR('camera')}
                    disabled={uploadingReceipt}
                  >
                    {uploadingReceipt ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.scanButtonIcon}>📸</Text>
                        <Text style={styles.scanButtonText}>Scan Receipt</Text>
                        <Text style={styles.scanButtonSubtext}>(Camera)</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.scanButton, uploadingReceipt && styles.buttonDisabled]}
                    onPress={() => scanReceiptWithOCR('gallery')}
                    disabled={uploadingReceipt}
                  >
                    <Text style={styles.scanButtonIcon}>🖼️</Text>
                    <Text style={styles.scanButtonText}>Scan Image</Text>
                    <Text style={styles.scanButtonSubtext}>(Gallery)</Text>
                  </TouchableOpacity>
                </View>

                {/* Regular Photo Buttons (Just photo, no OCR) */}
                <Text style={styles.scanLabel}>📷 Just take photo (No auto-fill):</Text>
                <View style={styles.receiptButtons}>
                  <TouchableOpacity
                    style={[styles.receiptButton, uploadingReceipt && styles.buttonDisabled]}
                    onPress={takePhoto}
                    disabled={uploadingReceipt}
                  >
                    <Text style={styles.receiptButtonIcon}>📷</Text>
                    <Text style={styles.receiptButtonText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.receiptButton, uploadingReceipt && styles.buttonDisabled]}
                    onPress={pickImage}
                    disabled={uploadingReceipt}
                  >
                    <Text style={styles.receiptButtonIcon}>🖼️</Text>
                    <Text style={styles.receiptButtonText}>Choose Image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title={isEditMode ? 'Update Expense' : 'Save Expense'} onPress={handleSave} loading={loading} />
          <Button title="Cancel" variant="outline" color="neutral" onPress={() => navigation.goBack()} disabled={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  required: {
    color: theme.colors.primary[600],
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
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scanLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  scanButton: {
    flex: 1,
    backgroundColor: theme.colors.primary[600],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  scanButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  scanButtonSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  receiptButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  receiptContainer: {
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeReceiptButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeReceiptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
