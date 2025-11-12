import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Expense } from '../../types';
import { useProfile } from '../../context/ProfileContext';
import { theme } from '../../theme/colors';
import CategoryPieChart from '../../components/Charts/CategoryPieChart';
import SpendingLineChart from '../../components/Charts/SpendingLineChart';
import MonthlyBarChart from '../../components/Charts/MonthlyBarChart';

type AnalyticsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Analytics'
>;

interface Props {
  navigation: AnalyticsScreenNavigationProp;
}

export default function AnalyticsScreen({ navigation }: Props) {
  const { activeProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, [activeProfile, timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterMonth, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Fetch expenses
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare category data for pie chart
  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();
    let total = 0;

    expenses.forEach((exp) => {
      const current = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, current + exp.amount);
      total += exp.amount;
    });

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Prepare daily spending data for line chart
  const getDailySpendingData = () => {
    const dailyMap = new Map<string, number>();

    expenses.forEach((exp) => {
      const current = dailyMap.get(exp.date) || 0;
      dailyMap.set(exp.date, current + exp.amount);
    });

    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Prepare monthly data for bar chart
  const getMonthlyData = () => {
    const monthlyMap = new Map<string, number>();

    expenses.forEach((exp) => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const current = monthlyMap.get(monthName) || 0;
      monthlyMap.set(monthName, current + exp.amount);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }));
  };

  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgDaily = expenses.length > 0 ? totalSpending / new Set(expenses.map(e => e.date)).size : 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>
          {activeProfile === 'business' ? '💼 Business' : '🏠 Personal'} • {timeRange === 'month' ? 'This Month' : timeRange === 'quarter' ? 'This Quarter' : 'This Year'}
        </Text>
      </View>

      <View style={styles.timeRangeButtons}>
        <TouchableOpacity
          style={[styles.timeButton, timeRange === 'month' && styles.timeButtonActive]}
          onPress={() => setTimeRange('month')}
        >
          <Text style={[styles.timeButtonText, timeRange === 'month' && styles.timeButtonTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeButton, timeRange === 'quarter' && styles.timeButtonActive]}
          onPress={() => setTimeRange('quarter')}
        >
          <Text style={[styles.timeButtonText, timeRange === 'quarter' && styles.timeButtonTextActive]}>
            Quarter
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeButton, timeRange === 'year' && styles.timeButtonActive]}
          onPress={() => setTimeRange('year')}
        >
          <Text style={[styles.timeButtonText, timeRange === 'year' && styles.timeButtonTextActive]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Spending</Text>
          <Text style={styles.statValue}>${totalSpending.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Avg Per Day</Text>
          <Text style={styles.statValue}>${avgDaily.toFixed(2)}</Text>
        </View>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No expenses found for this period</Text>
          <Text style={styles.emptySubtext}>Start adding expenses to see analytics</Text>
        </View>
      ) : (
        <>
          <CategoryPieChart data={getCategoryData()} />
          <SpendingLineChart data={getDailySpendingData()} />
          <MonthlyBarChart data={getMonthlyData()} />
        </>
      )}
    </ScrollView>
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
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: theme.colors.primary[600],
  },
  timeButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary[600],
  },
  timeButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary[700],
  },
  emptyContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
