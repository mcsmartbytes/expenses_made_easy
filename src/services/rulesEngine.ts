import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProfileType = 'business' | 'personal';

export type RuleMatchField = 'merchant' | 'description' | 'notes';
export type RuleOperator = 'contains' | 'starts_with' | 'equals' | 'regex';

export interface CategorizationRule {
  id: string;
  enabled: boolean;
  field: RuleMatchField;
  operator: RuleOperator;
  value: string;
  setCategory?: string;
  setProfile?: ProfileType;
  priority: number; // smaller number = higher priority
}

const STORAGE_KEY = 'eme:categorization:rules:v1';

export const RulesEngine = {
  async list(): Promise<CategorizationRule[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CategorizationRule[];
      return parsed.sort((a, b) => a.priority - b.priority);
    } catch {
      return [];
    }
  },

  async saveAll(rules: CategorizationRule[]): Promise<void> {
    const normalized = [...rules].sort((a, b) => a.priority - b.priority);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  },

  async add(rule: Omit<CategorizationRule, 'id'>): Promise<CategorizationRule> {
    const rules = await this.list();
    const newRule: CategorizationRule = { ...rule, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    rules.push(newRule);
    await this.saveAll(rules);
    return newRule;
  },

  async update(id: string, patch: Partial<CategorizationRule>): Promise<void> {
    const rules = await this.list();
    const next = rules.map(r => (r.id === id ? { ...r, ...patch } : r));
    await this.saveAll(next);
  },

  async remove(id: string): Promise<void> {
    const rules = await this.list();
    const next = rules.filter(r => r.id !== id);
    await this.saveAll(next);
  },

  evaluateSync(
    rules: CategorizationRule[],
    params: { merchant?: string; description?: string; notes?: string }
  ): { category?: string; profile?: ProfileType } {
    const haystacks: Record<RuleMatchField, string> = {
      merchant: (params.merchant || '').toLowerCase(),
      description: (params.description || '').toLowerCase(),
      notes: (params.notes || '').toLowerCase(),
    };

    for (const rule of rules) {
      if (!rule.enabled) continue;
      const value = (rule.value || '').toLowerCase();
      const hay = haystacks[rule.field] ?? '';
      let matched = false;
      switch (rule.operator) {
        case 'contains':
          matched = hay.includes(value);
          break;
        case 'starts_with':
          matched = hay.startsWith(value);
          break;
        case 'equals':
          matched = hay === value;
          break;
        case 'regex':
          try {
            matched = new RegExp(rule.value, 'i').test(hay);
          } catch {
            matched = false;
          }
          break;
      }
      if (matched) {
        return { category: rule.setCategory, profile: rule.setProfile };
      }
    }
    return {};
  },
};

