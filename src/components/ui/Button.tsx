import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type ButtonColor = 'primary' | 'secondary' | 'danger' | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const SIZE_STYLES: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 40, paddingH: 12, fontSize: 14 },
  md: { height: 48, paddingH: 16, fontSize: 16 },
  lg: { height: 56, paddingH: 20, fontSize: 18 },
};

export default function Button({
  title,
  children,
  onPress,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const palette = theme.colors;

  const colorMap = {
    primary: { bg: palette.primary[600], border: palette.primary[600], fg: palette.text.inverse },
    secondary: { bg: palette.secondary[600], border: palette.secondary[600], fg: palette.text.inverse },
    danger: { bg: palette.error[600], border: palette.error[600], fg: palette.text.inverse },
    neutral: { bg: palette.background.secondary, border: palette.border.light, fg: palette.text.primary },
  } as const;

  const c = colorMap[color];
  const s = SIZE_STYLES[size];

  const base: ViewStyle = {
    height: s.height,
    paddingHorizontal: s.paddingH,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  let container: ViewStyle = {};
  let label: TextStyle = { fontSize: s.fontSize, fontWeight: '600' };

  if (variant === 'solid') {
    container = { backgroundColor: c.bg };
    label = { ...label, color: c.fg };
  } else if (variant === 'outline') {
    container = { backgroundColor: palette.background.primary, borderWidth: 2, borderColor: c.border };
    label = { ...label, color: c.border };
  } else {
    // ghost
    container = { backgroundColor: 'transparent' };
    label = { ...label, color: c.border };
  }

  const disabledStyle: ViewStyle = disabled || loading ? { opacity: 0.6 } : {};

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.9}
      onPress={disabled || loading ? undefined : onPress}
      style={[base, container, styles.shadow, disabledStyle, style]}
      testID={testID}
    >
      <View style={styles.row}>
        {loading && <ActivityIndicator size="small" color={(label.color as string) || palette.text.inverse} style={{ marginRight: 8 }} />}
        {title ? <Text style={[label, textStyle]}>{title}</Text> : children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
});
