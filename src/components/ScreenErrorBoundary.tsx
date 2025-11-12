import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ErrorBoundary } from './ErrorBoundary';
import { theme } from '../theme/colors';

interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
}

/**
 * Screen-specific Error Boundary
 *
 * Wraps individual screens with error handling and provides
 * navigation fallback options.
 *
 * Usage:
 * <ScreenErrorBoundary screenName="Expenses">
 *   <ExpensesScreen />
 * </ScreenErrorBoundary>
 */
export function ScreenErrorBoundary({ children, screenName }: ScreenErrorBoundaryProps) {
  const navigation = useNavigation();

  const handleGoHome = () => {
    navigation.navigate('Dashboard' as never);
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      handleGoHome();
    }
  };

  const fallbackComponent = (error: Error, resetError: () => void) => (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>
        {screenName ? `${screenName} Error` : 'Screen Error'}
      </Text>
      <Text style={styles.message}>
        We couldn't load this screen. Your data is safe and you can try again or go back.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={resetError}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoBack}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
          <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Error Details:</Text>
          <Text style={styles.debugText}>{error.message}</Text>
          <Text style={styles.debugText}>{error.stack}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ErrorBoundary fallbackComponent={fallbackComponent}>
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
  debugContainer: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  debugTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.error[600],
    marginBottom: theme.spacing.sm,
  },
  debugText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
});
