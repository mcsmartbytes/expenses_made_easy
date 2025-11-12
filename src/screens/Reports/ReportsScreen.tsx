import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../hooks/useTheme';
import { Expense, MileageTrip, IRS_MILEAGE_RATE } from '../../types';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { buildTaxPackZip, shareFile } from '../../services/taxExportService';
import { useProfile } from '../../context/ProfileContext';

type ReportsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Reports'>;

interface Props {
  navigation: ReportsScreenNavigationProp;
}

type ReportTemplate = 'simple' | 'detailed' | 'irs';

export default function ReportsScreen({ navigation }: Props) {
  const { activeProfile } = useProfile();
  const theme = useTheme();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [template, setTemplate] = useState<ReportTemplate>('detailed');
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<MileageTrip[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const fetchReportData = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch expenses filtered by profile
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // Fetch mileage trips filtered by profile
      const { data: tripsData, error: tripsError } = await supabase
        .from('mileage_trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`)
        .order('start_time', { ascending: true });

      if (tripsError) throw tripsError;
      setTrips(tripsData || []);

      setShowPreview(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (expenses.length === 0 && trips.length === 0) {
      await fetchReportData();
      if (expenses.length === 0 && trips.length === 0) {
        Alert.alert('No Data', 'No expenses or trips found for the selected date range');
        return;
      }
    }

    setLoading(true);
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });

      // Share or save the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Expense Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', `Report saved to: ${uri}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = async () => {
    if (expenses.length === 0 && trips.length === 0) {
      await fetchReportData();
      if (expenses.length === 0 && trips.length === 0) {
        Alert.alert('No Data', 'No expenses or trips found for the selected date range');
        return;
      }
    }

    setLoading(true);
    try {
      let csvContent = 'Type,Date,Category/Purpose,Description,Amount\n';

      // Add expenses
      expenses.forEach(exp => {
        const amount = exp.amount.toFixed(2);
        const description = exp.description.replace(/"/g, '""');
        csvContent += `Expense,${exp.date},${exp.category},"${description}",${amount}\n`;
      });

      // Add mileage trips
      trips.forEach(trip => {
        const date = trip.start_time.split('T')[0];
        const reimbursement = (trip.distance_miles * IRS_MILEAGE_RATE).toFixed(2);
        const description = `${trip.distance_miles.toFixed(1)} miles - ${trip.start_location.address || 'Unknown'} to ${trip.end_location?.address || 'Unknown'}`;
        csvContent += `Mileage,${date},${trip.purpose},"${description}",${reimbursement}\n`;
      });

      const fileUri = (FileSystem as any).documentDirectory + `expense_report_${startDate}_to_${endDate}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: ((FileSystem as any).EncodingType?.UTF8 ?? 'utf8') as any,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share Expense Report (CSV)',
        });
      } else {
        Alert.alert('Success', `Report saved to: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTaxPack = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }
    setLoading(true);
    try {
      if (expenses.length === 0 && trips.length === 0) {
        await fetchReportData();
      }
      const zipPath = await buildTaxPackZip({
        startDate,
        endDate,
        expenses: expenses.map(e => ({ id: e.id, date: e.date, category: e.category, description: e.description, amount: e.amount, receipt_url: e.receipt_url })),
        trips: trips.map(t => ({ id: t.id, start_time: t.start_time, distance_miles: t.distance_miles, purpose: t.purpose, start_location: t.start_location, end_location: t.end_location })),
        companyName,
      });
      await shareFile(zipPath, 'Share Year-End Tax Pack');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate tax pack');
    } finally {
      setLoading(false);
    }
  };

  const generateHTML = (): string => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const businessTrips = trips.filter(t => t.purpose === 'business');
    const totalMileage = businessTrips.reduce((sum, trip) => sum + trip.distance_miles, 0);
    const totalMileageReimbursement = totalMileage * IRS_MILEAGE_RATE;
    const grandTotal = totalExpenses + totalMileageReimbursement;

    const companyHeader = companyName ? `<h2 style="color: #6b7280; margin: 0 0 20px 0;">${companyName}</h2>` : '';

    const irsNote = template === 'irs' ? `
      <div style="background-color: #fef3c7; border-left: 4px solid: #f59e0b; padding: 12px; margin: 20px 0;">
        <strong>IRS Compliance Note:</strong> This report follows IRS guidelines for expense and mileage reporting.
        Standard mileage rate: $${IRS_MILEAGE_RATE}/mile for business use of vehicles.
      </div>
    ` : '';

    let expensesTable = '';
    if (expenses.length > 0) {
      expensesTable = `
        <h3 style="color: #1f2937; margin: 30px 0 15px 0;">Expenses</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Date</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Category</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(exp => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(exp.date).toLocaleDateString()}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${exp.category}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${exp.description}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${exp.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background-color: #f9fafb; font-weight: bold;">
              <td colspan="3" style="padding: 12px; border-top: 2px solid #e5e7eb;">Total Expenses</td>
              <td style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb; color: #ea580c;">$${totalExpenses.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    let mileageTable = '';
    if (businessTrips.length > 0) {
      mileageTable = `
        <h3 style="color: #1f2937; margin: 30px 0 15px 0;">Business Mileage</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Date</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">From/To</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Miles</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Reimbursement</th>
            </tr>
          </thead>
          <tbody>
            ${businessTrips.map(trip => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(trip.start_time).toLocaleDateString()}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trip.start_location.address || 'Unknown'} → ${trip.end_location?.address || 'Unknown'}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">${trip.distance_miles.toFixed(1)}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${(trip.distance_miles * IRS_MILEAGE_RATE).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background-color: #f9fafb; font-weight: bold;">
              <td colspan="2" style="padding: 12px; border-top: 2px solid #e5e7eb;">Total Mileage</td>
              <td style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb;">${totalMileage.toFixed(1)} mi</td>
              <td style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb; color: #ea580c;">$${totalMileageReimbursement.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Expense Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; }
          </style>
        </head>
        <body>
          <div style="margin-bottom: 30px;">
            ${companyHeader}
            <h1 style="color: #1f2937; margin: 0 0 10px 0;">Expense Report</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">
              ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin: 5px 0 0 0;">
              Generated on ${new Date().toLocaleDateString()}
            </p>
          </div>

          ${irsNote}

          ${expensesTable}
          ${mileageTable}

          <div style="margin-top: 40px; padding: 20px; background-color: #fef2f2; border-radius: 8px;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">Grand Total</h3>
            <p style="font-size: 28px; font-weight: bold; color: #ea580c; margin: 0;">$${grandTotal.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const businessTrips = trips.filter(t => t.purpose === 'business');
  const totalMileage = businessTrips.reduce((sum, trip) => sum + trip.distance_miles, 0);
  const totalMileageReimbursement = totalMileage * IRS_MILEAGE_RATE;
  const grandTotal = totalExpenses + totalMileageReimbursement;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Generate Report</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Create PDF or Excel reports for your expenses and mileage</Text>

      <View style={[styles.profileIndicator, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }] }>
        <Text style={[styles.profileIndicatorText, { color: theme.colors.text.secondary }]}>
          {activeProfile === 'business' ? '💼 Business' : '🏠 Personal'} Report
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Company Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Your Company Name"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Start Date <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            End Date <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Report Template</Text>
          <View style={styles.templateButtons}>
            <TouchableOpacity
              style={[styles.templateButton, template === 'simple' && styles.templateButtonActive]}
              onPress={() => setTemplate('simple')}
            >
              <Text style={[styles.templateButtonText, template === 'simple' && styles.templateButtonTextActive]}>
                Simple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.templateButton, template === 'detailed' && styles.templateButtonActive]}
              onPress={() => setTemplate('detailed')}
            >
              <Text style={[styles.templateButtonText, template === 'detailed' && styles.templateButtonTextActive]}>
                Detailed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.templateButton, template === 'irs' && styles.templateButtonActive]}
              onPress={() => setTemplate('irs')}
            >
              <Text style={[styles.templateButtonText, template === 'irs' && styles.templateButtonTextActive]}>
                IRS Compliant
              </Text>
            </TouchableOpacity>
          </View>
          {template === 'irs' && (
            <View style={styles.irsTooltip}>
              <Text style={styles.irsTooltipText}>
                ℹ️ IRS-compliant reports include all required information for tax documentation including standard mileage rates and proper categorization.
              </Text>
            </View>
          )}
        </View>
      </View>

      {showPreview && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Report Preview</Text>

          <View style={[styles.previewCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Expenses:</Text>
              <Text style={styles.previewValue}>{expenses.length} items</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Expenses:</Text>
              <Text style={styles.previewValue}>{formatCurrency(totalExpenses)}</Text>
            </View>
          </View>

          <View style={[styles.previewCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Business Trips:</Text>
              <Text style={styles.previewValue}>{businessTrips.length} trips</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Miles:</Text>
              <Text style={styles.previewValue}>{totalMileage.toFixed(1)} mi</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Mileage Reimbursement:</Text>
              <Text style={styles.previewValue}>{formatCurrency(totalMileageReimbursement)}</Text>
            </View>
          </View>

          <View style={[styles.previewCard, styles.grandTotalCard, { borderColor: theme.colors.border.light }]}>
            <View style={styles.previewRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.previewButton, loading && styles.buttonDisabled]}
          onPress={fetchReportData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ea580c" />
          ) : (
            <Text style={styles.previewButtonText}>Preview Report</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pdfButton, loading && styles.buttonDisabled]}
          onPress={generatePDF}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.pdfButtonText}>📄 Export as PDF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.csvButton, loading && styles.buttonDisabled]}
          onPress={generateCSV}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
          <Text style={styles.csvButtonText}>📊 Export as CSV/Excel</Text>
        )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.csvButton, loading && styles.buttonDisabled]}
          onPress={generateTaxPack}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.csvButtonText}>📦 Year‑End Tax Pack (ZIP)</Text>
          )}
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
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
  templateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  templateButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  templateButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  templateButtonTextActive: {
    color: '#fff',
  },
  irsTooltip: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  irsTooltipText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  grandTotalCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  actions: {
    gap: 12,
  },
  previewButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ea580c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#ea580c',
    fontSize: 16,
    fontWeight: '600',
  },
  pdfButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  csvButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  csvButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  profileIndicator: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ea580c',
    alignItems: 'center',
  },
  profileIndicatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ea580c',
  },
});
