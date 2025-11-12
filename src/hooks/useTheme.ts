import { useColorScheme } from 'react-native';
import { theme, darkTheme } from '../theme/colors';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colors: isDark ? darkTheme.colors : theme.colors,
    spacing: theme.spacing,
    typography: theme.typography,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
    isDark,
  };
};
