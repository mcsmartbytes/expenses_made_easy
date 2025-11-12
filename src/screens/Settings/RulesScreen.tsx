import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../theme/colors';
import { CategorizationRule, RulesEngine, RuleMatchField, RuleOperator } from '../../services/rulesEngine';

type RulesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Categories'>;

interface Props { navigation: RulesScreenNavigationProp }

const FIELDS: RuleMatchField[] = ['merchant', 'description', 'notes'];
const OPS: RuleOperator[] = ['contains', 'starts_with', 'equals', 'regex'];

export default function RulesScreen(_props: Props) {
  const theme = useTheme();
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [draft, setDraft] = useState<Partial<CategorizationRule>>({
    enabled: true,
    field: 'description',
    operator: 'contains',
    value: '',
    setCategory: '',
    setProfile: undefined,
    priority: 100,
  });

  useEffect(() => {
    (async () => setRules(await RulesEngine.list()))();
  }, []);

  const addRule = async () => {
    if (!draft.value || !draft.setCategory) {
      Alert.alert('Missing fields', 'Match value and category are required');
      return;
    }
    const newRule = await RulesEngine.add({
      enabled: draft.enabled ?? true,
      field: (draft.field as RuleMatchField) || 'description',
      operator: (draft.operator as RuleOperator) || 'contains',
      value: draft.value!,
      setCategory: draft.setCategory,
      setProfile: draft.setProfile,
      priority: draft.priority ?? 100,
    });
    setRules(prev => [...prev, newRule].sort((a,b)=>a.priority-b.priority));
    setDraft({ enabled: true, field: 'description', operator: 'contains', value: '', setCategory: '', setProfile: undefined, priority: 100 });
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await RulesEngine.update(id, { enabled });
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
  };

  const deleteRule = async (id: string) => {
    await RulesEngine.remove(id);
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const renderItem = ({ item }: { item: CategorizationRule }) => (
    <View style={[styles.ruleCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }] }>
      <View style={styles.ruleHeader}>
        <Text style={[styles.ruleTitle, { color: theme.colors.text.primary }]}>
          If {item.field} {item.operator.replace('_',' ')} "{item.value}"
        </Text>
        <Switch value={item.enabled} onValueChange={(v)=>toggleRule(item.id, v)} />
      </View>
      <Text style={[styles.ruleAction, { color: theme.colors.text.secondary }]}>
        → Set Category: <Text style={{ fontWeight: '700' }}>{item.setCategory || '—'}</Text>
        {item.setProfile ? `, Profile: ${item.setProfile}` : ''}
      </Text>
      <View style={styles.ruleFooter}>
        <Text style={[styles.ruleMeta, { color: theme.colors.text.tertiary }]}>Priority {item.priority}</Text>
        <TouchableOpacity onPress={() => deleteRule(item.id)}>
          <Text style={[styles.deleteText, { color: theme.colors.error[600] }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>Auto-Categorization Rules</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Create rules to auto-fill category/profile based on merchant, description, or notes.</Text>

      <View style={[styles.card, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.light }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>New Rule</Text>
        <View style={styles.row}> 
          <TextInput
            style={styles.input}
            value={draft.value || ''}
            onChangeText={(t)=>setDraft(d => ({...d, value: t}))}
            placeholder="Match value (e.g., UBER)"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.row}> 
          <TextInput
            style={styles.input}
            value={draft.setCategory || ''}
            onChangeText={(t)=>setDraft(d => ({...d, setCategory: t}))}
            placeholder="Set Category (e.g., Transportation)"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={draft.setProfile || ''}
            onChangeText={(t)=>setDraft(d => ({...d, setProfile: (t === 'business' || t === 'personal') ? (t as any) : undefined}))}
            placeholder="Optional Profile (business/personal)"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={String(draft.priority ?? 100)}
            onChangeText={(t)=>setDraft(d => ({...d, priority: Math.max(0, parseInt(t || '100') || 100)}))}
            placeholder="Priority (lower runs first)"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={draft.field}
            onChangeText={(t)=> setDraft(d => ({...d, field: (FIELDS.includes(t as any) ? (t as any) : 'description')}))}
            placeholder="Field (merchant/description/notes)"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={draft.operator}
            onChangeText={(t)=> setDraft(d => ({...d, operator: (OPS.includes(t as any) ? (t as any) : 'contains')}))}
            placeholder="Operator (contains/starts_with/equals/regex)"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addRule}>
          <Text style={styles.addButtonText}>Add Rule</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rules}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: staticTheme.colors.background.primary, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  row: { marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, color: '#111827' },
  addButton: { backgroundColor: '#ea580c', padding: 12, borderRadius: 10, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600' },
  listContent: { paddingBottom: 24 },
  ruleCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ruleTitle: { fontSize: 15, fontWeight: '600' },
  ruleAction: { fontSize: 13, marginBottom: 6 },
  ruleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ruleMeta: { fontSize: 12 },
  deleteText: { fontSize: 14, fontWeight: '600' },
});

