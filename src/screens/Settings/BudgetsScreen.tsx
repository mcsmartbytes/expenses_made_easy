import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../theme/colors';
import { BudgetsService, MonthlyBudget } from '../../services/budgetsService';
import { supabase } from '../../services/supabase';
import { useProfile } from '../../context/ProfileContext';

export default function BudgetsScreen() {
  const theme = useTheme();
  const { activeProfile } = useProfile();
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [monthSpend, setMonthSpend] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      setBudgets(await BudgetsService.list());
      await refreshSpend();
    })();
  }, [activeProfile]);

  const refreshSpend = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('profile', activeProfile)
        .gte('date', monthStart);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach(e => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
      setMonthSpend(map);
    } catch (e) {
      // silent
    }
  };

  const profileBudgets = useMemo(() => budgets.filter(b => b.profile === activeProfile), [budgets, activeProfile]);

  const addBudget = async () => {
    const amt = parseFloat(amount);
    if (!category.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid', 'Enter a category and positive amount');
      return;
    }
    await BudgetsService.upsert(activeProfile, category.trim(), amt);
    setBudgets(await BudgetsService.list());
    setCategory('');
    setAmount('');
  };

  const removeBudget = async (cat: string) => {
    await BudgetsService.remove(activeProfile, cat);
    setBudgets(await BudgetsService.list());
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Monthly Budgets</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Set optional monthly budgets per category for your {activeProfile} profile.
      </Text>

      <View style={[styles.card, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>Add / Update Budget</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Category name (e.g., Transportation)"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Monthly budget (e.g., 200)"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addButton} onPress={addBudget}>
          <Text style={styles.addButtonText}>Save Budget</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={profileBudgets}
        keyExtractor={(b)=>b.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const spent = monthSpend[item.category] || 0;
          const pct = Math.min(100, Math.round((spent / item.amount) * 100));
          const barColor = pct >= 100 ? theme.colors.error[600] : pct >= 80 ? theme.colors.warning[600] : theme.colors.primary[600];
          return (
            <View style={[styles.budgetCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.budgetTitle, { color: theme.colors.text.primary }]}>{item.category}</Text>
                <TouchableOpacity onPress={() => removeBudget(item.category)}>
                  <Text style={{ color: theme.colors.error[600], fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.budgetMeta, { color: theme.colors.text.secondary }]}>
                ${spent.toFixed(2)} / ${item.amount.toFixed(2)} • {pct}%
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: barColor }]} />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, color: '#111827', marginBottom: 8 },
  addButton: { backgroundColor: '#ea580c', padding: 12, borderRadius: 10, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600' },
  budgetCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetTitle: { fontSize: 16, fontWeight: '600' },
  budgetMeta: { fontSize: 13, marginTop: 6 },
  progressTrack: { height: 10, borderRadius: 8, backgroundColor: '#e5e7eb', marginTop: 8, overflow: 'hidden' },
  progressBar: { height: 10, borderRadius: 8 },
});

