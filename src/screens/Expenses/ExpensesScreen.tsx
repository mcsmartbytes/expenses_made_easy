import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Expense } from '../../types';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../theme/colors';
import { formatDateDisplay } from '../../utils/dateUtils';

type ExpensesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Expenses'>;

interface Props {
  navigation: ExpensesScreenNavigationProp;
}

export default function ExpensesScreen({ navigation }: Props) {
  const { activeProfile } = useProfile();
  const theme = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [activeProfile]);

  useEffect(() => {

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchExpenses();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            fetchExpenses();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString); // Returns MM/DD/YYYY format
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={[styles.expenseCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}
      onPress={() => navigation.navigate('AddExpense', { expenseId: item.id })}
      onLongPress={() => deleteExpense(item.id)}
    >
      <View style={styles.expenseHeader}>
        <Text style={[styles.expenseCategory, { color: theme.colors.primary[600] }]}>{item.category}</Text>
        <Text style={[styles.expenseAmount, { color: theme.colors.text.primary }]}>{formatCurrency(item.amount)}</Text>
      </View>
      <Text style={[styles.expenseDescription, { color: theme.colors.text.secondary }]}>{item.description}</Text>
      <View style={styles.expenseFooter}>
        <Text style={[styles.expenseDate, { color: theme.colors.text.tertiary }]}>{formatDate(item.date)}</Text>
        {item.payment_method && (
          <Text style={[styles.expensePayment, { color: theme.colors.text.tertiary }]}>{item.payment_method}</Text>
        )}
        {item.receipt_url && (
          <TouchableOpacity onPress={() => setSelectedReceipt(item.receipt_url)}>
            <Text style={[styles.receiptBadge, { color: theme.colors.primary[600] }]}>📎 Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const getTotalAmount = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>My Expenses 💰</Text>
        <View style={[styles.totalCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
          <Text style={[styles.totalLabel, { color: theme.colors.text.secondary }]}>Total Expenses</Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary[600] }]}>{formatCurrency(getTotalAmount())}</Text>
        </View>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No expenses yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>Tap the button below to add your first expense</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
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

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary[600] }]}
        onPress={() => navigation.navigate('AddExpense', {})}
      >
        <Text style={[styles.addButtonText, { color: theme.colors.text.inverse }]}>+ Add Expense</Text>
      </TouchableOpacity>

      <Modal
        visible={!!selectedReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedReceipt(null)}
          >
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedReceipt || '' }}
                style={styles.receiptImageLarge}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.primary[600] }]}
                onPress={() => setSelectedReceipt(null)}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.text.inverse }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
  totalCard: {
    backgroundColor: staticTheme.colors.background.secondary,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    borderWidth: 1,
    borderColor: staticTheme.colors.border.light,
  },
  totalLabel: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.text.secondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.primary[600],
  },
  listContent: {
    padding: staticTheme.spacing.lg,
    paddingTop: 8,
  },
  expenseCard: {
    backgroundColor: staticTheme.colors.background.secondary,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: staticTheme.colors.border.light,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseCategory: {
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
    color: staticTheme.colors.primary[600],
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.text.primary,
  },
  expenseDescription: {
    fontSize: staticTheme.typography.sizes.sm,
    color: staticTheme.colors.text.secondary,
    marginBottom: 8,
  },
  expenseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseDate: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.tertiary,
  },
  expensePayment: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.text.tertiary,
  },
  receiptBadge: {
    fontSize: staticTheme.typography.sizes.xs,
    color: staticTheme.colors.primary[600],
    marginLeft: 'auto',
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
  addButton: {
    backgroundColor: staticTheme.colors.primary[600],
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.md,
    margin: staticTheme.spacing.lg,
    alignItems: 'center',
  },
  addButtonText: {
    color: staticTheme.colors.text.inverse,
    fontSize: 18,
    fontWeight: staticTheme.typography.weights.semibold,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  receiptImageLarge: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height - 200,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: staticTheme.colors.primary[600],
    borderRadius: staticTheme.borderRadius.md,
    paddingHorizontal: staticTheme.spacing.lg,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: staticTheme.colors.text.inverse,
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
  },
});
