import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollView';
import {
  BrandColor,
  BrandColorLight,
  CardShadow,
  Colors,
  PlaceholderColor,
  Spacing,
} from '@/constants/theme';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SignupScreen() {
  const { session, profile, signUp, createRestaurant } = useAuth();

  // If the account already exists but has no restaurant (e.g. signed up with
  // email confirmation on, then confirmed + signed in), we only need the
  // restaurant details to finish onboarding.
  const finishSetup = !!session && !profile;

  const [restaurantName, setRestaurantName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!restaurantName.trim() || !fullName.trim()) {
      Alert.alert('Error', 'Please enter your restaurant name and your name.');
      return;
    }
    if (!finishSetup && (!email.trim() || !password)) {
      Alert.alert('Error', 'Please enter an email and password.');
      return;
    }

    setLoading(true);
    try {
      if (!finishSetup) {
        const { error, needsEmailConfirmation } = await signUp(email.trim(), password);
        if (error) {
          Alert.alert('Sign Up Failed', error.message);
          return;
        }
        if (needsEmailConfirmation) {
          Alert.alert(
            'Confirm Your Email',
            'We sent you a confirmation link. After confirming, sign in to finish setting up your restaurant.',
          );
          router.replace('/(auth)/login');
          return;
        }
      }

      const { error } = await createRestaurant({
        restaurantName: restaurantName.trim(),
        fullName: fullName.trim(),
        currency: currency.trim() || 'GBP',
      });
      if (error) {
        Alert.alert('Setup Failed', error.message);
        return;
      }

      router.replace('/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🍴</Text>
            </View>
            <Text style={styles.appName}>OrderFlow</Text>
            <Text style={styles.subtitle}>DIGITAL HEARTH OPERATIONS</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {finishSetup ? 'Finish Setup' : 'Create Your Restaurant'}
            </Text>
            <Text style={styles.titleSub}>
              {finishSetup
                ? 'Tell us about your restaurant to get started.'
                : 'Set up your restaurant and admin account.'}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>RESTAURANT NAME</Text>
            <TextInput
              style={styles.inputStandalone}
              placeholder="e.g. The Copper Kettle"
              placeholderTextColor={PlaceholderColor}
              value={restaurantName}
              onChangeText={setRestaurantName}
            />

            <Text style={styles.label}>YOUR NAME</Text>
            <TextInput
              style={styles.inputStandalone}
              placeholder="Full name"
              placeholderTextColor={PlaceholderColor}
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.label}>CURRENCY</Text>
            <TextInput
              style={styles.inputStandalone}
              placeholder="GBP"
              placeholderTextColor={PlaceholderColor}
              value={currency}
              onChangeText={setCurrency}
              autoCapitalize="characters"
            />

            {!finishSetup && (
              <>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={styles.inputStandalone}
                  placeholder="you@restaurant.com"
                  placeholderTextColor={PlaceholderColor}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />

                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.inputStandalone}
                  placeholder="••••••••"
                  placeholderTextColor={PlaceholderColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password-new"
                />
              </>
            )}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {finishSetup ? 'Create Restaurant  →' : 'Create Account  →'}
                </Text>
              )}
            </Pressable>

            {!finishSetup && (
              <Pressable
                style={styles.linkButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Sign in</Text>
                </Text>
              </Pressable>
            )}
          </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: BrandColorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  logoIcon: {
    fontSize: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
    fontWeight: '500',
  },
  titleSection: {
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  titleSub: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  inputStandalone: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    padding: Spacing.three,
    fontSize: 16,
    color: Colors.light.text,
  },
  button: {
    backgroundColor: BrandColor,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.four,
    ...CardShadow,
    shadowColor: BrandColor,
    shadowOpacity: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  linkText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  linkTextBold: {
    color: BrandColor,
    fontWeight: '700',
  },
});
