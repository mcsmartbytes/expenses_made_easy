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
  ScrollView,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../theme/colors';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Skip email confirmation for development
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      // Check if user was created and session exists
      if (data.user && data.session) {
        // User is automatically logged in (email confirmation disabled)
        Alert.alert(
          'Success!',
          'Account created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Dashboard'),
            },
          ]
        );
      } else if (data.user && !data.session) {
        // Email confirmation is required
        Alert.alert(
          'Check Your Email',
          'Please check your email to verify your account before logging in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      Alert.alert('Signup Failed', error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.primary[600] }]}>← Back to Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>💰</Text>
            <Text style={[styles.appName, { color: theme.colors.text.primary }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Start tracking your expenses and mileage
            </Text>
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
              placeholder="Password (min 6 characters)"
              placeholderTextColor={theme.colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />

            <TextInput
              style={[styles.input, {
                backgroundColor: theme.colors.background.secondary,
                borderColor: theme.colors.border.light,
                color: theme.colors.text.primary
              }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.colors.text.tertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary[600] }, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.text.inverse} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.text.inverse }]}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
              By signing up, you agree to use the same account on web and mobile
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticTheme.colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: staticTheme.spacing.lg,
  },
  backButton: {
    marginBottom: staticTheme.spacing.lg,
  },
  backButtonText: {
    fontSize: staticTheme.typography.sizes.md,
    color: staticTheme.colors.primary[600],
    fontWeight: staticTheme.typography.weights.semibold,
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
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    color: staticTheme.colors.text.secondary,
    fontSize: staticTheme.typography.sizes.xs,
    textAlign: 'center',
  },
});
