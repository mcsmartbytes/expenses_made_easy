import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MonthlyBudget {
  id: string; // `${profile}:${category}`
  profile: 'business' | 'personal';
  category: string;
  amount: number; // monthly budget in USD
}

const STORAGE_KEY = 'eme:budgets:v1';

export const BudgetsService = {
  async list(): Promise<MonthlyBudget[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MonthlyBudget[]) : [];
    } catch {
      return [];
    }
  },

  async saveAll(items: MonthlyBudget[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  async upsert(profile: 'business' | 'personal', category: string, amount: number): Promise<void> {
    const items = await this.list();
    const id = `${profile}:${category}`;
    const idx = items.findIndex(b => b.id === id);
    const rec: MonthlyBudget = { id, profile, category, amount };
    if (idx >= 0) items[idx] = rec; else items.push(rec);
    await this.saveAll(items);
  },

  async remove(profile: 'business' | 'personal', category: string): Promise<void> {
    const id = `${profile}:${category}`;
    const items = (await this.list()).filter(b => b.id !== id);
    await this.saveAll(items);
  },
};

