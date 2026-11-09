import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { AuthButton } from '../components/AuthButton';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { isAtLeast13, normalizeDateOfBirth, PRIVACY_NOTICE_VERSION, TERMS_VERSION } from '../constants/legal';

type AuthMode = 'options' | 'signup' | 'signin';
type PolicyDocument = 'terms' | 'privacy' | null;

export function SignupScreen() {
  const { signIn, signUp } = useAuth();
  const dateOfBirthInputRef = useRef<TextInput>(null);
  const displayNameInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('options');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [signupStage, setSignupStage] = useState<'age' | 'details'>('age');
  const [ageDenied, setAgeDenied] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [policyDocument, setPolicyDocument] = useState<PolicyDocument>(null);
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
    if (nextMode === 'signup') {
      setSignupStage('age');
      setDateOfBirth('');
      setAcceptedPolicies(false);
    }
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
          if (signupStage === 'age') {
            dateOfBirthInputRef.current?.focus();
            return;
          }
          displayNameInputRef.current?.focus();
          return;
        }

        emailInputRef.current?.focus();
      }, 250);
      return () => clearTimeout(focusTimer);
    }

    return undefined;
  }, [isSigninMode, isSignupMode, signupStage]);

  async function handleEmailSignup() {
    if (busy) {
      return;
    }

    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!acceptedPolicies) {
      setError('Please agree to the Terms and acknowledge the Privacy Notice to continue.');
      return;
    }

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
        password,
        dateOfBirth,
        termsVersion: TERMS_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        acceptedPolicies: true
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  }

  function continueFromAgeCheck() {
    const normalizedDate = normalizeDateOfBirth(dateOfBirth);
    if (!normalizedDate) {
      setError('Enter a valid date of birth in YYYY-MM-DD format.');
      return;
    }
    if (!isAtLeast13(normalizedDate)) {
      setDateOfBirth('');
      setAgeDenied(true);
      setError('Deoly is for people age 13 and older. You can’t create an account.');
      return;
    }
    setDateOfBirth(normalizedDate);
    setError(null);
    setSignupStage('details');
  }

  function returnFromSignupDetails() {
    setError(null);
    setAcceptedPolicies(false);
    setSignupStage('age');
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
              <Pressable accessibilityLabel={isSignupMode && signupStage === 'details' ? 'Back to age check' : 'Back to sign up options'} accessibilityRole="button" onPress={isSignupMode && signupStage === 'details' ? returnFromSignupDetails : returnToOptions} style={styles.backButton}>
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
            {isSignupMode && signupStage === 'age' ? (
              <View style={styles.form}>
                <Text style={styles.fieldLabel}>Date of birth</Text>
                <TextInput
                  accessibilityLabel="Date of birth in year-month-day format"
                  autoCapitalize="none"
                  editable={!busy && !ageDenied}
                  keyboardType="numbers-and-punctuation"
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9D8D7D"
                  ref={dateOfBirthInputRef}
                  returnKeyType="done"
                  style={styles.input}
                  value={dateOfBirth}
                />
                <Text style={styles.helperText}>Enter your birth date to check whether you can create an account.</Text>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {ageDenied ? null : <AuthButton label="Continue" variant="primary" onPress={continueFromAgeCheck} />}
              </View>
            ) : isSignupMode ? (
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

                <View style={styles.policyRow}>
                  <Pressable
                    accessibilityLabel={acceptedPolicies ? 'Policies accepted' : 'Accept the Terms and Privacy Notice'}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: acceptedPolicies }}
                    onPress={() => setAcceptedPolicies((current) => !current)}
                    style={styles.policyCheckbox}
                  >
                    <Ionicons name={acceptedPolicies ? 'checkbox' : 'square-outline'} size={22} color="#7A5A3C" />
                  </Pressable>
                  <Text style={styles.policyText}>
                    I agree to the <Text onPress={() => setPolicyDocument('terms')} style={styles.policyLink}>Terms of Service</Text> and acknowledge the <Text onPress={() => setPolicyDocument('privacy')} style={styles.policyLink}>Privacy Notice</Text>.
                  </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <AuthButton
                  disabled={busy || !acceptedPolicies}
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
      <Modal animationType="slide" onRequestClose={() => setPolicyDocument(null)} transparent visible={policyDocument !== null}>
        <View style={styles.policyModalBackdrop}>
          <View style={styles.policyModal}>
            <View style={styles.policyModalHeader}>
              <Text style={styles.policyModalTitle}>{policyDocument === 'terms' ? 'Terms of Service' : 'Privacy Notice'}</Text>
              <Pressable accessibilityLabel="Close policy" accessibilityRole="button" onPress={() => setPolicyDocument(null)} style={styles.backButton}>
                <Ionicons name="close" size={22} color="#5F4630" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.policyModalBody}>
              <Text style={styles.policyDraft}>Draft for legal review before public launch · {policyDocument === 'terms' ? TERMS_VERSION : PRIVACY_NOTICE_VERSION}</Text>
              {policyDocument === 'terms' ? (
                <>
                  <Text style={styles.policyParagraph}>Deoly is for people age 13 and older. By using Deoly, you agree to provide accurate account information, keep your password private, and use the service lawfully and respectfully.</Text>
                  <Text style={styles.policyParagraph}>You are responsible for the content you share. Do not harass, threaten, impersonate, or share content you do not have permission to post. You can block users and delete your account in the app.</Text>
                  <Text style={styles.policyParagraph}>These draft terms need legal review and final contact, dispute, and service details before public launch.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.policyParagraph}>Deoly uses the account details you provide, such as your display name, username, and email, to create and secure your account. Passwords are stored as protected hashes.</Text>
                  <Text style={styles.policyParagraph}>If you add profile details, photos, posts, comments, reactions, or friendships, Deoly processes them to provide the app’s social features. Your profile and posts are shown according to the app’s visibility settings.</Text>
                  <Text style={styles.policyParagraph}>The date of birth you enter is checked during signup and is not saved to your account. You can request account deletion from the app’s settings.</Text>
                  <Text style={styles.policyParagraph}>This draft still needs legal review and final details about service providers, retention, launch regions, and a support contact before public launch.</Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  fieldLabel: {
    color: '#5F4630',
    fontFamily: typography.bodyFamily,
    fontSize: 14,
    fontWeight: '600'
  },
  helperText: {
    color: '#74685C',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 19
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  policyCheckbox: {
    paddingTop: 1
  },
  policyText: {
    flex: 1,
    color: '#74685C',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    lineHeight: 19
  },
  policyLink: {
    color: '#5F4630',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  policyModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 20, 15, 0.45)'
  },
  policyModal: {
    maxHeight: '82%',
    minHeight: '55%',
    backgroundColor: '#FBF6EF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg
  },
  policyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  policyModalTitle: {
    color: '#2D251E',
    fontFamily: typography.titleFamily,
    fontSize: 24,
    fontWeight: '700'
  },
  policyModalBody: {
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  policyDraft: {
    color: '#A4493D',
    fontFamily: typography.bodyFamily,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19
  },
  policyParagraph: {
    color: '#5F5347',
    fontFamily: typography.bodyFamily,
    fontSize: 15,
    lineHeight: 23
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
