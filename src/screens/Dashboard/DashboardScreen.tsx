import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Expense, MileageTrip, IRS_MILEAGE_RATE } from '../../types';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../theme/colors';
import { formatDateShort } from '../../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HelpCard from '../../components/ui/HelpCard';
import { BudgetsService, MonthlyBudget } from '../../services/budgetsService';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface CategoryStat {
  category: string;
  total: number;
  count: number;
}

export default function DashboardScreen({ navigation }: Props) {
  const { activeProfile, setActiveProfile } = useProfile();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [mileageStats, setMileageStats] = useState({ totalMiles: 0, businessMiles: 0, reimbursement: 0 });
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [budgetSpend, setBudgetSpend] = useState<Record<string, number>>({});
  const [showPhase1Help, setShowPhase1Help] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    loadBudgets();
  }, [activeProfile]);

  useEffect(() => {
    (async () => {
      const dismissed = await AsyncStorage.getItem('eme:help:phase1:dismissed');
      setShowPhase1Help(!dismissed);
    })();
  }, []);

  useEffect(() => {

    // Subscribe to realtime changes
    const expensesSubscription = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const mileageSubscription = supabase
      .channel('mileage_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mileage_trips' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      expensesSubscription.unsubscribe();
      mileageSubscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month's start date
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      // Fetch all expenses for current month filtered by profile
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .gte('date', monthStart)
        .order('date', { ascending: false });

      if (error) throw error;

      const expenseData = data || [];
      setExpenses(expenseData.slice(0, 5)); // Keep only recent 5

      // Calculate monthly total
      const total = expenseData.reduce((sum, exp) => sum + exp.amount, 0);
      setMonthlyTotal(total);

      // Calculate category stats
      const categoryMap = new Map<string, { total: number; count: number }>();
      expenseData.forEach((exp) => {
        const current = categoryMap.get(exp.category) || { total: 0, count: 0 };
        categoryMap.set(exp.category, {
          total: current.total + exp.amount,
          count: current.count + 1,
        });
      });

      const stats = Array.from(categoryMap.entries())
        .map(([category, { total, count }]) => ({ category, total, count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setCategoryStats(stats);

      // Fetch mileage data filtered by profile
      const { data: mileageData, error: mileageError } = await supabase
        .from('mileage_trips')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .gte('start_time', monthStart);

      if (mileageError) throw mileageError;

      const trips = mileageData || [];
      const totalMiles = trips.reduce((sum, trip) => sum + trip.distance_miles, 0);
      const businessMiles = trips.filter(t => t.purpose === 'business').reduce((sum, trip) => sum + trip.distance_miles, 0);
      const reimbursement = businessMiles * IRS_MILEAGE_RATE;

      setMileageStats({ totalMiles, businessMiles, reimbursement });

      // Budget spend map for current month
      const spendMap: Record<string, number> = {};
      expenseData.forEach(e => {
        spendMap[e.category] = (spendMap[e.category] || 0) + e.amount;
      });
      setBudgetSpend(spendMap);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    const all = await BudgetsService.list();
    setBudgets(all.filter(b => b.profile === activeProfile));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateShort(dateString); // Returns MM/DD or MM/DD/YYYY format
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary[600]}
          colors={[theme.colors.primary[600]]}
        />
      }
    >
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Welcome! 👋</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Your expense tracking dashboard</Text>

      <ProfileSwitcher activeProfile={activeProfile} onProfileChange={setActiveProfile} />

      {showPhase1Help && (
        <HelpCard
          title="New: Rules, Budgets, Tax Pack"
          onDismiss={async () => { setShowPhase1Help(false); await AsyncStorage.setItem('eme:help:phase1:dismissed', '1'); }}
          actions={[
            { label: 'Setup Rules', onPress: () => navigation.navigate('Rules') },
            { label: 'Set Budgets', onPress: () => navigation.navigate('Budgets') },
            { label: 'Export Tax Pack', onPress: () => navigation.navigate('Reports') },
          ]}
        >
          <Text style={{ color: theme.colors.text.secondary, lineHeight: 18 }}>
            • Auto‑categorize expenses with your own rules.
            {'\n'}• Track monthly category budgets with soft alerts.
            {'\n'}• Export a year‑end ZIP with CSVs and receipts.
          </Text>
        </HelpCard>
      )}

      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Expenses</Text>
          <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{formatCurrency(monthlyTotal)}</Text>
          <Text style={[styles.statSubtext, { color: theme.colors.text.tertiary }]}>{expenses.length} this month</Text>
        </Card>
        <Card style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Mileage</Text>
          <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{mileageStats.totalMiles.toFixed(0)} mi</Text>
          <Text style={[styles.statSubtext, { color: theme.colors.text.tertiary }]}>{formatCurrency(mileageStats.reimbursement)}</Text>
        </Card>
      </View>

      {categoryStats.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Top Categories</Text>
          {categoryStats.map((stat) => (
            <View key={stat.category} style={[styles.categoryItem, { backgroundColor: theme.colors.background.secondary, borderBottomColor: theme.colors.border.light }]}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: theme.colors.text.primary }]}>{stat.category}</Text>
                <Text style={[styles.categoryCount, { color: theme.colors.text.tertiary }]}>{stat.count} expense{stat.count !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={[styles.categoryAmount, { color: theme.colors.primary[600] }]}>{formatCurrency(stat.total)}</Text>
            </View>
          ))}
        </View>
      )}

      {budgets.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Budgets This Month</Text>
          {budgets.slice(0, 3).map(b => {
            const spent = budgetSpend[b.category] || 0;
            const pct = Math.min(100, Math.round((spent / b.amount) * 100));
            const barColor = pct >= 100 ? theme.colors.error[600] : pct >= 80 ? theme.colors.warning[600] : theme.colors.primary[600];
            return (
              <View key={b.id} style={[styles.budgetItem, { backgroundColor: theme.colors.background.secondary, borderBottomColor: theme.colors.border.light }]}>
                <View style={styles.budgetHeaderRow}>
                  <Text style={[styles.categoryName, { color: theme.colors.text.primary }]}>{b.category}</Text>
                  <Text style={[styles.categoryAmount, { color: theme.colors.primary[600] }]}>{formatCurrency(spent)} / {formatCurrency(b.amount)}</Text>
                </View>
                <View style={styles.progressTrack}><View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: barColor }]} /></View>
              </View>
            );
          })}
        </View>
      )}

      {expenses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary[600] }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {expenses.map((expense) => (
            <TouchableOpacity
              key={expense.id}
              style={[styles.expenseItem, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => navigation.navigate('AddExpense', { expenseId: expense.id })}
            >
              <View style={styles.expenseInfo}>
                <Text style={[styles.expenseName, { color: theme.colors.text.primary }]}>{expense.description}</Text>
                <View style={styles.expenseMeta}>
                  <Text style={[styles.expenseCategory, { color: theme.colors.secondary[600] }]}>{expense.category}</Text>
                  <Text style={[styles.expenseDate, { color: theme.colors.text.tertiary }]}> • {formatDate(expense.date)}</Text>
                </View>
              </View>
              <Text style={[styles.expenseAmount, { color: theme.colors.text.primary }]}>{formatCurrency(expense.amount)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {expenses.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No expenses this month</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>Start tracking your expenses today!</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button variant="outline" title="📝 View All Expenses" onPress={() => navigation.navigate('Expenses')} />
        <Button variant="outline" title="🚗 View Mileage Tracking" onPress={() => navigation.navigate('Mileage')} />
        <Button variant="outline" title="📊 Generate Reports" onPress={() => navigation.navigate('Reports')} />
        <Button variant="outline" title="📈 Analytics & Charts" onPress={() => navigation.navigate('Analytics')} />
        <Button variant="outline" title="🏷️ Manage Categories" onPress={() => navigation.navigate('Categories')} />
        <Button variant="outline" title="⚙️ Auto‑Categorization Rules" onPress={() => navigation.navigate('Rules')} />
        <Button variant="outline" title="💵 Monthly Budgets" onPress={() => navigation.navigate('Budgets')} />
        <Button variant="outline" title="👤 My Profile" onPress={() => navigation.navigate('Profile')} />
        <Button variant="solid" color="primary" title="+ Add Expense" onPress={() => navigation.navigate('AddExpense', {})} />
        <Button variant="ghost" color="neutral" title="Logout" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background.secondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticTheme.colors.background.secondary,
  },
  scrollContent: {
    padding: staticTheme.spacing.lg,
  },
  title: {
    fontSize: staticTheme.typography.sizes.xxxl,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.text.primary,
    marginBottom: staticTheme.spacing.sm,
  },
  subtitle: {
    fontSize: staticTheme.typography.sizes.md,
    color: staticTheme.colors.text.secondary,
    marginBottom: staticTheme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: staticTheme.spacing.md,
    marginBottom: staticTheme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: staticTheme.colors.background.primary,
    borderRadius: staticTheme.borderRadius.xl,
    padding: staticTheme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.text.secondary,
    marginBottom: staticTheme.spacing.sm,
    fontWeight: staticTheme.typography.weights.medium,
  },
  statValue: {
    fontSize: 36,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.primary[700],
    marginBottom: staticTheme.spacing.xs,
  },
  statSubtext: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.tertiary,
  },
  section: {
    marginBottom: staticTheme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: staticTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: staticTheme.typography.sizes.xl,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.text.primary,
    marginBottom: staticTheme.spacing.md,
  },
  seeAllText: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.primary[600],
    fontWeight: staticTheme.typography.weights.semibold,
  },
  categoryItem: {
    backgroundColor: staticTheme.colors.background.primary,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    marginBottom: staticTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
    color: staticTheme.colors.text.primary,
    marginBottom: staticTheme.spacing.xs,
  },
  categoryCount: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.tertiary,
  },
  categoryAmount: {
    fontSize: staticTheme.typography.sizes.lg,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.primary[700],
  },
  budgetItem: {
    backgroundColor: staticTheme.colors.background.primary,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    marginBottom: staticTheme.spacing.sm,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: staticTheme.spacing.xs,
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    borderRadius: 6,
    backgroundColor: staticTheme.colors.primary[600],
  },
  expenseItem: {
    backgroundColor: staticTheme.colors.background.primary,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    marginBottom: staticTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
    color: staticTheme.colors.text.primary,
    marginBottom: staticTheme.spacing.xs,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.secondary[600],
    fontWeight: staticTheme.typography.weights.medium,
  },
  expenseDate: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.tertiary,
  },
  expenseAmount: {
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.text.primary,
  },
  emptyCard: {
    backgroundColor: staticTheme.colors.background.primary,
    borderRadius: staticTheme.borderRadius.xl,
    padding: staticTheme.spacing.xl,
    alignItems: 'center',
    marginBottom: staticTheme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: staticTheme.typography.sizes.lg,
    fontWeight: staticTheme.typography.weights.semibold,
    color: staticTheme.colors.text.secondary,
    marginBottom: staticTheme.spacing.sm,
  },
  emptySubtext: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.text.tertiary,
    textAlign: 'center',
  },
  actions: {
    gap: staticTheme.spacing.md,
  },
  button: {
    backgroundColor: staticTheme.colors.background.primary,
    borderWidth: 2,
    borderColor: staticTheme.colors.primary[600],
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    color: staticTheme.colors.primary[600],
    fontSize: staticTheme.typography.sizes.lg,
    fontWeight: staticTheme.typography.weights.semibold,
  },
  addButton: {
    backgroundColor: staticTheme.colors.primary[600],
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: staticTheme.colors.text.inverse,
    fontSize: staticTheme.typography.sizes.lg,
    fontWeight: staticTheme.typography.weights.bold,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: staticTheme.colors.border.medium,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: staticTheme.colors.text.secondary,
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
  },
});
