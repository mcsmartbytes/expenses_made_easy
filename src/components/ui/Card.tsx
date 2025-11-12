import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outline' | 'plain';
  padding?: number;
}

export default function Card({ children, style, variant = 'elevated', padding }: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: padding ?? 16,
  };

  let variantStyle: ViewStyle = {};
  if (variant === 'elevated') {
    variantStyle = {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    };
  } else if (variant === 'outline') {
    variantStyle = {
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    };
  } else {
    variantStyle = {};
  }

  return <View style={[base, variantStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({});
