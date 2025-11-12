import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { theme } from '../../theme/colors';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface Props {
  data: CategoryData[];
  title?: string;
}

const COLORS = [
  theme.colors.primary[600],
  theme.colors.secondary[600],
  theme.colors.accent[500],
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export default function CategoryPieChart({ data, title = 'Spending by Category' }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available for chart</Text>
      </View>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.category,
    amount: item.amount,
    color: COLORS[index % COLORS.length],
    legendFontColor: theme.colors.text.tertiary,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <PieChart
        data={chartData}
        width={Dimensions.get('window').width - 48}
        height={220}
        chartConfig={{
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="15"
        center={[0, 0]}
        absolute
      />

      <View style={styles.legend}>
        {data.slice(0, 5).map((item, index) => (
          <View key={item.category} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS[index % COLORS.length] }]} />
            <Text style={styles.legendText} numberOfLines={1}>
              {item.category}: ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
        {data.length > 5 && (
          <Text style={styles.moreText}>+ {data.length - 5} more categories</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  legend: {
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  legendText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  moreText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.tertiary,
  },
});
