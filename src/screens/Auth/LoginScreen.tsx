import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../theme/colors';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data?.session) {
        // Navigate to dashboard
        navigation.replace('Dashboard');
      } else {
        throw new Error('No session created');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      Alert.alert('Login Failed', error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>💰</Text>
          <Text style={[styles.appName, { color: theme.colors.text.primary }]}>Expenses Made Easy</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Track expenses & mileage effortlessly</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border.light,
              color: theme.colors.text.primary
            }]}
            placeholder="Email"
            placeholderTextColor={theme.colors.text.tertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border.light,
              color: theme.colors.text.primary
            }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.text.tertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary[600] }, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.colors.text.inverse }]}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.colors.border.light }]} />
            <Text style={[styles.dividerText, { color: theme.colors.text.tertiary }]}>or</Text>
            <View style={[styles.line, { backgroundColor: theme.colors.border.light }]} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.primary[600] }]}
            onPress={() => navigation.navigate('Signup')}
            disabled={loading}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary[600] }]}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
            Same account works on web and mobile
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: staticTheme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 64,
    marginBottom: staticTheme.spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: staticTheme.typography.weights.bold,
    color: staticTheme.colors.text.primary,
    marginBottom: staticTheme.spacing.sm,
  },
  subtitle: {
    fontSize: staticTheme.typography.sizes.md,
    color: staticTheme.colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: staticTheme.colors.border.light,
    borderRadius: staticTheme.borderRadius.lg,
    paddingHorizontal: staticTheme.spacing.md,
    fontSize: staticTheme.typography.sizes.md,
    marginBottom: staticTheme.spacing.md,
    backgroundColor: staticTheme.colors.background.secondary,
    color: staticTheme.colors.text.primary,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: staticTheme.colors.primary[600],
    borderRadius: staticTheme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: staticTheme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: staticTheme.colors.text.inverse,
    fontSize: 18,
    fontWeight: staticTheme.typography.weights.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: staticTheme.spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: staticTheme.colors.border.light,
  },
  dividerText: {
    marginHorizontal: staticTheme.spacing.md,
    color: staticTheme.colors.text.tertiary,
    fontSize: staticTheme.typography.sizes.sm,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: staticTheme.colors.primary[600],
    borderRadius: staticTheme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: staticTheme.colors.primary[600],
    fontSize: staticTheme.typography.sizes.md,
    fontWeight: staticTheme.typography.weights.semibold,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: staticTheme.colors.text.secondary,
    fontSize: staticTheme.typography.sizes.sm,
    textAlign: 'center',
  },
});
