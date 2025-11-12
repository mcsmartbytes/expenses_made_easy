// Teal Gradient Theme - Matches MC Smart Bytes Brand
// Option B: Modern, Tech-Forward, Perfect Brand Consistency

export const colors = {
  // Primary Colors - Teal Gradient (MC Smart Bytes Brand)
  primary: {
    50: '#EFF6FF',    // Lightest teal tint (backgrounds)
    100: '#DBEAFE',   // Very light teal
    200: '#BFDBFE',   // Light teal
    300: '#93C5FD',   // Medium-light teal
    400: '#60A5FA',   // Medium teal
    500: '#3B82F6',   // MC Smart Bytes Logo Teal ⭐
    600: '#2563EB',   // Deep teal (headers, nav)
    700: '#1D4ED8',   // Darker teal
    800: '#1E40AF',   // Very dark teal
    900: '#1E3A8A',   // Darkest teal
  },

  // Secondary Colors - Complementary Cyan (For variety)
  secondary: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Accent Colors - Amber (Attention-Grabbing)
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutral Colors - Gray Scale
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Status Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
  },

  // Text Colors
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    inverse: '#FFFFFF',
    link: '#2563EB',  // Deep teal (matches MC Smart Bytes)
  },

  // Border Colors
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },

  // Profile Colors
  business: '#2563EB',
  personal: '#22C55E'
};

// Spacing System (8px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography System
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Border Radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Dark Mode Colors
export const darkColors = {
  ...colors,

  // Override primary for better dark mode contrast
  primary: {
    ...colors.primary,
    500: '#60A5FA',
    600: '#3B82F6'
  },

  // Dark backgrounds
  background: {
    primary: '#0F172A',    // Dark charcoal
    secondary: '#111827',  // Lighter charcoal
    tertiary: '#1F2937',   // Card backgrounds
  },

  // Dark text colors (inverted)
  text: {
    primary: '#F9FAFB',      // Almost white
    secondary: '#CBD5E1',    // Light gray
    tertiary: '#94A3B8',     // Medium gray
    inverse: '#0F172A',      // Dark (for light backgrounds)
    link: '#93C5FD',         // Lighter teal for visibility
  },

  // Darker borders
  border: {
    light: '#334155',
    medium: '#475569',
    dark: '#64748B',
  },
};

// Export default theme object
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
};

// Export dark theme
export const darkTheme = {
  ...theme,
  colors: darkColors,
};

export default theme;
