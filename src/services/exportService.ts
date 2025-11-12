import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Expense, MileageTrip } from '../types';
import { IRS_MILEAGE_RATE } from '../types';

/**
 * Export Service - Handles exporting data to CSV/Excel format
 */

// Convert array of objects to CSV string
const arrayToCSV = (data: any[], headers: string[]): string => {
  const headerRow = headers.join(',');
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

// Format date for CSV
const formatDateForCSV = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
};

// Format currency for CSV
const formatCurrencyForCSV = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

/**
 * Export expenses to CSV
 */
export const exportExpensesToCSV = async (
  expenses: Expense[],
  fileName: string = 'expenses_export'
): Promise<void> => {
  try {
    // Prepare data for export
    const exportData = expenses.map(expense => ({
      Date: formatDateForCSV(expense.date),
      Description: expense.description,
      Category: expense.category,
      Amount: formatCurrencyForCSV(expense.amount),
      Profile: expense.profile || 'personal',
      Notes: expense.notes || '',
    }));

    // Define headers
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Profile', 'Notes'];

    // Convert to CSV
    const csvContent = arrayToCSV(exportData, headers);

    // Create file path
    const fileUri = `${(FileSystem as any).documentDirectory}${fileName}.csv`;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: ((FileSystem as any).EncodingType?.UTF8 ?? 'utf8') as any,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Expenses',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting expenses:', error);
    throw error;
  }
};

/**
 * Export mileage trips to CSV
 */
export const exportMileageToCSV = async (
  trips: MileageTrip[],
  fileName: string = 'mileage_export'
): Promise<void> => {
  try {
    // Prepare data for export
    const exportData = trips.map(trip => ({
      Date: formatDateForCSV(trip.start_time),
      Purpose: trip.purpose,
      'Start Address': (trip.start_location?.address as string) || 'N/A',
      'End Address': (trip.end_location?.address as string) || 'N/A',
      Distance: `${trip.distance_miles.toFixed(2)} miles`,
      'Reimbursement Rate': `$${IRS_MILEAGE_RATE.toFixed(3)}`,
      'Total Reimbursement': formatCurrencyForCSV(trip.distance_miles * IRS_MILEAGE_RATE),
      Profile: trip.profile || 'business',
    }));

    // Define headers
    const headers = ['Date', 'Purpose', 'Start Address', 'End Address', 'Distance', 'Reimbursement Rate', 'Total Reimbursement', 'Profile'];

    // Convert to CSV
    const csvContent = arrayToCSV(exportData, headers);

    // Create file path
    const fileUri = `${(FileSystem as any).documentDirectory}${fileName}.csv`;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: ((FileSystem as any).EncodingType?.UTF8 ?? 'utf8') as any,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Mileage',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting mileage:', error);
    throw error;
  }
};

/**
 * Export combined report (expenses + mileage) to CSV
 */
export const exportCombinedReport = async (
  expenses: Expense[],
  trips: MileageTrip[],
  startDate: string,
  endDate: string,
  fileName: string = 'expense_report'
): Promise<void> => {
  try {
    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalMileage = trips.reduce((sum, trip) => sum + trip.distance_miles, 0);
    const totalReimbursement = trips.reduce((sum, trip) => sum + (trip.distance_miles * IRS_MILEAGE_RATE), 0);
    const grandTotal = totalExpenses + totalReimbursement;

    // Create report content
    let reportContent = `Expense Report\n`;
    reportContent += `Period: ${formatDateForCSV(startDate)} to ${formatDateForCSV(endDate)}\n`;
    reportContent += `Generated: ${new Date().toLocaleString()}\n`;
    reportContent += `\n`;
    reportContent += `Summary\n`;
    reportContent += `Total Expenses:,${formatCurrencyForCSV(totalExpenses)}\n`;
    reportContent += `Total Mileage:,${totalMileage.toFixed(2)} miles\n`;
    reportContent += `Mileage Reimbursement:,${formatCurrencyForCSV(totalReimbursement)}\n`;
    reportContent += `Grand Total:,${formatCurrencyForCSV(grandTotal)}\n`;
    reportContent += `\n`;

    // Add expenses section
    reportContent += `\nExpenses\n`;
    const expenseHeaders = ['Date', 'Description', 'Category', 'Amount'];
    reportContent += arrayToCSV(
      expenses.map(exp => ({
        Date: formatDateForCSV(exp.date),
        Description: exp.description,
        Category: exp.category,
        Amount: formatCurrencyForCSV(exp.amount),
      })),
      expenseHeaders
    );

    // Add mileage section
    reportContent += `\n\nMileage Trips\n`;
    const mileageHeaders = ['Date', 'Purpose', 'Distance', 'Reimbursement'];
    reportContent += arrayToCSV(
      trips.map(trip => ({
        Date: formatDateForCSV(trip.start_time),
        Purpose: trip.purpose,
        Distance: `${trip.distance_miles.toFixed(2)} miles`,
        Reimbursement: formatCurrencyForCSV(trip.distance_miles * IRS_MILEAGE_RATE),
      })),
      mileageHeaders
    );

    // Create file path
    const fileUri = `${(FileSystem as any).documentDirectory}${fileName}.csv`;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, reportContent, {
      encoding: ((FileSystem as any).EncodingType?.UTF8 ?? 'utf8') as any,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Report',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting combined report:', error);
    throw error;
  }
};

/**
 * Export expenses by category summary
 */
export const exportCategorySummary = async (
  expenses: Expense[],
  fileName: string = 'category_summary'
): Promise<void> => {
  try {
    // Group by category
    const categoryMap = new Map<string, { count: number; total: number }>();
    expenses.forEach(exp => {
      const current = categoryMap.get(exp.category) || { count: 0, total: 0 };
      categoryMap.set(exp.category, {
        count: current.count + 1,
        total: current.total + exp.amount,
      });
    });

    // Convert to array and sort by total
    const summaryData = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        Category: category,
        Count: stats.count,
        Total: formatCurrencyForCSV(stats.total),
        Average: formatCurrencyForCSV(stats.total / stats.count),
      }))
      .sort((a, b) => parseFloat(b.Total.replace('$', '')) - parseFloat(a.Total.replace('$', '')));

    // Add grand total row
    const grandTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    summaryData.push({
      Category: 'TOTAL',
      Count: expenses.length,
      Total: formatCurrencyForCSV(grandTotal),
      Average: formatCurrencyForCSV(grandTotal / expenses.length),
    });

    // Define headers
    const headers = ['Category', 'Count', 'Total', 'Average'];

    // Convert to CSV
    const csvContent = arrayToCSV(summaryData, headers);

    // Create file path
    const fileUri = `${(FileSystem as any).documentDirectory}${fileName}.csv`;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: ((FileSystem as any).EncodingType?.UTF8 ?? 'utf8') as any,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Category Summary',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting category summary:', error);
    throw error;
  }
};
