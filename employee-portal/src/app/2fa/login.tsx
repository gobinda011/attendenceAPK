import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    verifyTwoFactorLogin,
    verifyTwoFactorRecovery,
} from '@/api/employeeAuth';

import {
    getTwoFactorChallenge,
    removeTwoFactorChallenge,
} from '@/storage/twoFactorStorage';

import { saveToken } from '@/storage/authStorage';

type LoginMode = 'totp' | 'recovery';

export default function TwoFactorLoginScreen() {
  const [mode, setMode] = useState<LoginMode>('totp');

  const [challengeToken, setChallengeToken] =
    useState<string | null>(null);

  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    loadChallenge();
  }, []);

  async function loadChallenge() {
    try {
      const challenge =
        await getTwoFactorChallenge();

      if (!challenge) {
        setError(
          'Your two-factor login session has expired. Please log in again.'
        );
        return;
      }

      setChallengeToken(challenge);
    } catch (err) {
      console.log(
        '2FA challenge loading error:',
        err
      );

      setError(
        'Unable to continue two-factor authentication.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!challengeToken) {
      setError(
        'Your two-factor login session has expired. Please log in again.'
      );
      return;
    }

    const value = code.trim();

    if (mode === 'totp') {
      if (!/^\d{6}$/.test(value)) {
        setError(
          'Enter the current 6-digit authenticator code.'
        );
        return;
      }
    } else {
      if (!value) {
        setError('Enter your recovery code.');
        return;
      }
    }

    try {
      setVerifying(true);
      setError('');

      const response =
        mode === 'totp'
          ? await verifyTwoFactorLogin(
              challengeToken,
              value
            )
          : await verifyTwoFactorRecovery(
              challengeToken,
              value
            );

      if (!response?.token) {
        throw new Error(
          'Authentication token was not returned.'
        );
      }

      await saveToken(response.token);
      await removeTwoFactorChallenge();

      router.replace('/home');
    } catch (err: any) {
      console.log(
        '2FA login error:',
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          'Authentication failed. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  }

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setCode('');
    setError('');
  }

  function goBackToLogin() {
    removeTwoFactorChallenge();
    router.replace('/');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Preparing secure login...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={goBackToLogin}
        >
          <Text style={styles.backText}>
            ← Back to login
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Two-Factor Authentication
        </Text>

        <Text style={styles.subtitle}>
          {mode === 'totp'
            ? 'Enter the 6-digit code from your authenticator app to continue.'
            : 'Enter one of your unused recovery codes to continue.'}
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>
          {mode === 'totp'
            ? 'Authenticator code'
            : 'Recovery code'}
        </Text>

        <TextInput
          value={code}
          onChangeText={(value) => {
            if (mode === 'totp') {
              setCode(
                value
                  .replace(/\D/g, '')
                  .slice(0, 6)
              );
            } else {
              setCode(
                value
                  .toUpperCase()
                  .slice(0, 20)
              );
            }
          }}
          placeholder={
            mode === 'totp'
              ? '000000'
              : 'XXXXXXXXXX'
          }
          keyboardType={
            mode === 'totp'
              ? 'number-pad'
              : 'default'
          }
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={mode === 'totp' ? 6 : 20}
          secureTextEntry={false}
          style={[
            styles.input,
            mode === 'totp' &&
              styles.totpInput,
          ]}
        />

        <Pressable
          style={[
            styles.primaryButton,
            verifying &&
              styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Verify & Continue
            </Text>
          )}
        </Pressable>

        {mode === 'totp' ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              switchMode('recovery')
            }
            disabled={verifying}
          >
            <Text style={styles.secondaryButtonText}>
              Use a recovery code
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              switchMode('totp')
            }
            disabled={verifying}
          >
            <Text style={styles.secondaryButtonText}>
              Use authenticator code
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  container: {
    flex: 1,
    padding: 28,
    paddingTop: 60,
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666666',
  },

  backButton: {
    position: 'absolute',
    top: 60,
    left: 28,
  },

  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#111111',
    backgroundColor: '#fafafa',
  },

  totpInput: {
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '600',
    letterSpacing: 7,
  },

  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  secondaryButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  secondaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
  },

  errorBox: {
    borderWidth: 1,
    borderColor: '#e0b4b4',
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },

  errorText: {
    color: '#b71c1c',
    fontSize: 14,
    lineHeight: 20,
  },
});