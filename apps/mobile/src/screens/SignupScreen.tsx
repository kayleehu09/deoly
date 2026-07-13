import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { AuthButton } from '../components/AuthButton';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'options' | 'signup' | 'signin';

export function SignupScreen() {
  const { signIn, signUp } = useAuth();
  const displayNameInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('options');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignupMode = authMode === 'signup';
  const isSigninMode = authMode === 'signin';
  const isEmailMode = authMode !== 'options';

  function showSocialProviderNotice(provider: 'Apple' | 'Google') {
    Alert.alert(`${provider} sign in`, `${provider} sign in needs provider credentials before it can be enabled.`);
  }

  function switchMode(nextMode: AuthMode) {
    setError(null);
    setAuthMode(nextMode);
  }

  function returnToOptions() {
    setBusy(false);
    switchMode('options');
  }

  useEffect(() => {
    if (isSignupMode || isSigninMode) {
      const focusTimer = setTimeout(() => {
        if (isSignupMode) {
          displayNameInputRef.current?.focus();
          return;
        }

        emailInputRef.current?.focus();
      }, 250);
      return () => clearTimeout(focusTimer);
    }

    return undefined;
  }, [isSigninMode, isSignupMode]);

  async function handleEmailSignup() {
    if (busy) {
      return;
    }

    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDisplayName || !trimmedUsername || !trimmedEmail || password.length < 8) {
      setError('Add your name, username, email, and a password with at least 8 characters.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await signUp({
        displayName: trimmedDisplayName,
        username: trimmedUsername,
        email: trimmedEmail,
        password
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSignin() {
    if (busy) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail || password.length < 8) {
      setError('Enter your email and password.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await signIn({
        email: trimmedEmail,
        password
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundWash} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={[styles.container, isEmailMode && styles.emailContainer]}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isEmailMode ? (
            <View style={styles.emailTopBar}>
              <Pressable accessibilityLabel="Back to sign up options" accessibilityRole="button" onPress={returnToOptions} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#5F4630" />
              </Pressable>
              <Text style={styles.emailTopBarTitle}>{isSignupMode ? 'Create account' : 'Sign in'}</Text>
              <View style={styles.topBarSpacer} />
            </View>
          ) : null}

          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Ionicons name="heart-outline" size={20} color="#7A5A3C" />
            </View>
            <Text style={styles.appName}>Deoly</Text>
          </View>

          <View style={styles.hero}>
            <Text style={[styles.headline, isEmailMode && styles.emailHeadline]}>
              {isSignupMode ? 'Create your account.' : isSigninMode ? 'Welcome back.' : "Share what's on your heart."}
            </Text>
            <Text style={[styles.subheadline, isEmailMode && styles.emailSubheadline]}>
              {isSignupMode
                ? 'Choose your name, username, and password to start your private circle.'
                : isSigninMode
                  ? 'Use the email and password from your Deoly account.'
                : 'A private space for faith, friendship, and encouragement.'}
            </Text>
          </View>

          <View style={styles.actions}>
            {isSignupMode ? (
              <View style={styles.form}>
                <TextInput
                  autoCapitalize="words"
                  autoComplete="name"
                  blurOnSubmit={false}
                  editable={!busy}
                  onChangeText={setDisplayName}
                  onSubmitEditing={() => usernameInputRef.current?.focus()}
                  placeholder="Display name"
                  placeholderTextColor="#9D8D7D"
                  ref={displayNameInputRef}
                  returnKeyType="next"
                  style={styles.input}
                  textContentType="name"
                  value={displayName}
                />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  editable={!busy}
                  onChangeText={setUsername}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  placeholder="Username"
                  placeholderTextColor="#9D8D7D"
                  ref={usernameInputRef}
                  returnKeyType="next"
                  style={styles.input}
                  textContentType="username"
                  value={username}
                />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  editable={!busy}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  placeholder="Email"
                  placeholderTextColor="#9D8D7D"
                  ref={emailInputRef}
                  returnKeyType="next"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!busy}
                  onChangeText={setPassword}
                  onSubmitEditing={handleEmailSignup}
                  placeholder="Password"
                  placeholderTextColor="#9D8D7D"
                  ref={passwordInputRef}
                  returnKeyType="done"
                  secureTextEntry
                  style={styles.input}
                  textContentType="newPassword"
                  value={password}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <AuthButton
                  disabled={busy}
                  label={busy ? 'Creating account...' : 'Create account'}
                  loading={busy}
                  variant="primary"
                  onPress={handleEmailSignup}
                />
              </View>
            ) : isSigninMode ? (
              <View style={styles.form}>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  editable={!busy}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  placeholder="Email"
                  placeholderTextColor="#9D8D7D"
                  ref={emailInputRef}
                  returnKeyType="next"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!busy}
                  onChangeText={setPassword}
                  onSubmitEditing={handleEmailSignin}
                  placeholder="Password"
                  placeholderTextColor="#9D8D7D"
                  ref={passwordInputRef}
                  returnKeyType="done"
                  secureTextEntry
                  style={styles.input}
                  textContentType="password"
                  value={password}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <AuthButton
                  disabled={busy}
                  label={busy ? 'Signing in...' : 'Sign in'}
                  loading={busy}
                  variant="primary"
                  onPress={handleEmailSignin}
                />
                <AuthButton
                  disabled={busy}
                  label="Create a new account"
                  variant="ghost"
                  onPress={() => switchMode('signup')}
                />
              </View>
            ) : (
              <>
                <AuthButton
                  label="Continue with Apple"
                  variant="primary"
                  icon={<Ionicons name="logo-apple" size={20} color={colors.surface} />}
                  onPress={() => showSocialProviderNotice('Apple')}
                />
                <AuthButton
                  label="Continue with Google"
                  icon={<FontAwesome name="google" size={18} color={colors.text} />}
                  onPress={() => showSocialProviderNotice('Google')}
                />

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <AuthButton label="Create account with email" variant="ghost" onPress={() => switchMode('signup')} />
              </>
            )}
          </View>

          <Text style={styles.footerText}>
            {isSigninMode ? 'New here? ' : 'Already have an account? '}
            <Text style={styles.signInText} onPress={() => switchMode(isSigninMode ? 'signup' : 'signin')}>
              {isSigninMode ? 'Create account' : 'Sign in'}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF6EF'
  },
  backgroundWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: '46%',
    backgroundColor: '#F5EADF',
    borderBottomLeftRadius: 56,
    borderBottomRightRadius: 56
  },
  keyboardContainer: {
    flex: 1
  },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg
  },
  emailContainer: {
    justifyContent: 'flex-start',
    gap: spacing.lg,
    paddingBottom: spacing.xl
  },
  emailTopBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emailTopBarTitle: {
    color: '#5F4630',
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0
  },
  topBarSpacer: {
    width: 44
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(122, 90, 60, 0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  appName: {
    color: '#5F4630',
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm
  },
  headline: {
    color: '#2D251E',
    fontFamily: typography.titleFamily,
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 44,
    textAlign: 'center'
  },
  emailHeadline: {
    fontSize: 31,
    lineHeight: 37
  },
  subheadline: {
    maxWidth: 310,
    color: '#74685C',
    fontFamily: typography.bodyFamily,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center'
  },
  emailSubheadline: {
    fontSize: 16,
    lineHeight: 24
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm
  },
  form: {
    width: '100%',
    gap: spacing.sm
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(64, 50, 37, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    color: colors.text,
    fontFamily: typography.bodyFamily,
    fontSize: 16,
    paddingHorizontal: spacing.md
  },
  errorText: {
    color: '#A4493D',
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center'
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(64, 50, 37, 0.12)'
  },
  dividerText: {
    color: '#88786A',
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '600'
  },
  footerText: {
    color: '#74685C',
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  signInText: {
    color: '#5F4630',
    fontWeight: '600'
  }
});
