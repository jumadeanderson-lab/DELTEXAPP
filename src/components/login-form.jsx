import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

function GoogleGlyph() {
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48" accessibilityLabel="Google">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M47 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.7 6C44.4 38 47 31.8 47 24.6z" />
      <Path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.2z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48z" />
    </Svg>
  );
}

export default function LoginForm() {
  const { user, loading, signInWithGoogle, signInWithCredentials, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  async function handleSignOut() {
    setSignOutLoading(true);
    try {
      await Promise.resolve(signOut());
    } finally {
      setSignOutLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Verifying access</Text>
        </View>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.successHeader}>
            <Text style={styles.successTitle}>Access Verified</Text>
            <Text style={styles.successEmail}>{user.email}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, signOutLoading && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={signOutLoading}
          >
            {signOutLoading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.buttonText} numberOfLines={1}>Sign Out</Text>}
          </Pressable>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Return to Dashboard</Text>
          </Link>
        </View>
      </View>
    );
  }

  async function handleSubmit() {
    if (!email) return;
    setLocalLoading(true);
    await signInWithCredentials(email.trim(), password);
    setLocalLoading(false);
  }

  async function handleGoogle() {
    setLocalLoading(true);
    await signInWithGoogle();
    setLocalLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Access Your Ideas</Text>
        <Text style={styles.subtitle}>Secure AI-Protected Data</Text>
      </View>

      <View style={styles.formCard}>
        <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#666"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            editable={!localLoading}
          />
        </View>

        <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused, { marginTop: 12 }]}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            editable={!localLoading}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (localLoading || !email) && styles.buttonDisabled,
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={localLoading || !email}
        >
          <View style={styles.buttonContent}>
            {localLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText} numberOfLines={1}>Continue</Text>
            )}
          </View>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.secondaryButton,
            localLoading && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleGoogle}
          disabled={localLoading}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
        >
          <View style={styles.socialButtonContent}>
            {localLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <GoogleGlyph />
                <Text style={styles.secondaryButtonText} numberOfLines={1}>Continue with Google</Text>
              </>
            )}
          </View>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.securityNote}>Secured with AI Protection</Text>
        <Text style={styles.legalNote}>By continuing you agree to our Terms</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    fontWeight: '400',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    transition: 'all 200ms',
  },
  inputFocused: {
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  button: {
    marginTop: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    backgroundColor: '#2563eb',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#2563eb',
    borderWidth: 0,
    borderColor: '#2563eb',
  },
  buttonPressed: {
    backgroundColor: '#1d4ed8',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    flexShrink: 1,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    flexShrink: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  successEmail: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  securityNote: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
    marginBottom: 4,
  },
  legalNote: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
});
