import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    disableTwoFactor,
    getTwoFactorStatus,
    setupTwoFactor,
    verifyTwoFactorSetup,
} from '@/api/employeeAuth';

import { removeToken } from '@/storage/authStorage';
import { removeTwoFactorChallenge } from '@/storage/twoFactorStorage';

type SetupData = {
  qrCode: string;
  expiresAt: string;
};

export default function SecurityScreen() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [setupLoading, setSetupLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  const [error, setError] = useState('');

  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  async function loadTwoFactorStatus() {
    try {
      setLoading(true);
      setError('');

      const data = await getTwoFactorStatus();

      setEnabled(Boolean(data.enabled));
    } catch (err: any) {
      console.log(
        '2FA status error:',
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          'Unable to load security status.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEnableTwoFactor() {
    try {
      setSetupLoading(true);
      setError('');

      const data = await setupTwoFactor();

      setSetupData({
        qrCode: data.qrCode,
        expiresAt: data.expiresAt,
      });

      setVerificationCode('');
      setRecoveryCodes([]);
    } catch (err: any) {
      console.log(
        '2FA setup error:',
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          'Unable to start two-factor authentication setup.'
      );
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleVerifyTwoFactorSetup() {
    const code = verificationCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setError(
        'Enter the 6-digit authenticator code from your authenticator app.'
      );
      return;
    }

    try {
      setVerificationLoading(true);
      setError('');

      const data = await verifyTwoFactorSetup(code);

      setEnabled(true);
      setSetupData(null);
      setVerificationCode('');

      setRecoveryCodes(
        Array.isArray(data.recoveryCodes)
          ? data.recoveryCodes
          : []
      );
    } catch (err: any) {
      console.log(
        '2FA verification error:',
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          'Invalid authenticator code.'
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  function cancelSetup() {
    setSetupData(null);
    setVerificationCode('');
    setError('');
  }

  function closeRecoveryCodes() {
    Alert.alert(
      'Recovery codes',
      'Make sure you have safely stored your recovery codes. They will not be shown again from this screen.',
      [
        {
          text: 'I saved them',
          onPress: () => setRecoveryCodes([]),
        },
      ]
    );
  }

  function openDisableForm() {
    setError('');
    setDisablePassword('');
    setDisableCode('');
    setShowDisableForm(true);
  }

  function cancelDisable() {
    setDisablePassword('');
    setDisableCode('');
    setShowDisableForm(false);
    setError('');
  }

  async function handleDisableTwoFactor() {
    const password = disablePassword.trim();
    const code = disableCode.trim();

    if (!password) {
      setError('Enter your account password.');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the current 6-digit authenticator code.');
      return;
    }

    try {
      setDisableLoading(true);
      setError('');

      await disableTwoFactor(password, code);

      setEnabled(false);
      setShowDisableForm(false);
      setDisablePassword('');
      setDisableCode('');
      setRecoveryCodes([]);

      Alert.alert(
        '2FA disabled',
        'Two-factor authentication has been disabled for your account.'
      );
    } catch (err: any) {
      console.log(
        '2FA disable error:',
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          'Unable to disable two-factor authentication.'
      );
    } finally {
      setDisableLoading(false);
    }
  }


  async function handleLogout() {
  Alert.alert(
    'Log out',
    'Are you sure you want to log out of your account?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
          await removeTwoFactorChallenge();

          router.replace('/');
        },
      },
    ]
  );
}


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Checking security status...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Security</Text>

      <Text style={styles.subtitle}>
        Manage your account security and two-factor authentication.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {recoveryCodes.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Save Your Recovery Codes
          </Text>

          <Text style={styles.cardText}>
            Two-factor authentication is now enabled. Store these
            recovery codes somewhere safe. Each code can be used once
            if you cannot access your authenticator.
          </Text>

          <View style={styles.recoveryContainer}>
            {recoveryCodes.map((code) => (
              <Text
                key={code}
                style={styles.recoveryCode}
              >
                {code}
              </Text>
            ))}
          </View>

          <Pressable
            style={styles.actionButton}
            onPress={closeRecoveryCodes}
          >
            <Text style={styles.actionButtonText}>
              I Saved My Recovery Codes
            </Text>
          </Pressable>
        </View>
      ) : null}

      {setupData ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Set Up Two-Factor Authentication
          </Text>

          <Text style={styles.cardText}>
            Scan this QR code using Google Authenticator, Aegis, or
            another compatible authenticator app.
          </Text>

          <View style={styles.qrContainer}>
            <Image
              source={{ uri: setupData.qrCode }}
              style={styles.qrCode}
            />
          </View>

          <Text style={styles.instructionTitle}>
            Verify setup
          </Text>

          <Text style={styles.cardText}>
            Enter the current 6-digit code shown by your authenticator
            app.
          </Text>

          <TextInput
            value={verificationCode}
            onChangeText={(value) =>
              setVerificationCode(
                value.replace(/\D/g, '').slice(0, 6)
              )
            }
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            autoCorrect={false}
            autoComplete="one-time-code"
            style={styles.codeInput}
          />

          <Pressable
            style={[
              styles.actionButton,
              verificationLoading && styles.buttonDisabled,
            ]}
            onPress={handleVerifyTwoFactorSetup}
            disabled={verificationLoading}
          >
            {verificationLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>
                Verify & Enable 2FA
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={cancelSetup}
            disabled={verificationLoading}
          >
            <Text style={styles.cancelButtonText}>
              Cancel Setup
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!setupData && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Two-Factor Authentication
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                enabled
                  ? styles.statusEnabled
                  : styles.statusDisabled,
              ]}
            />

            <Text style={styles.statusText}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <Text style={styles.cardText}>
            {enabled
              ? 'Your account is protected with two-factor authentication.'
              : 'Two-factor authentication is currently disabled.'}
          </Text>

          {!enabled ? (
            <Pressable
              style={[
                styles.actionButton,
                setupLoading && styles.buttonDisabled,
              ]}
              onPress={handleEnableTwoFactor}
              disabled={setupLoading}
            >
              {setupLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Enable 2FA
                </Text>
              )}
            </Pressable>
          ) : !showDisableForm ? (
            <Pressable
              style={styles.disableButton}
              onPress={openDisableForm}
            >
              <Text style={styles.disableButtonText}>
                Disable 2FA
              </Text>
            </Pressable>
          ) : (
            <View style={styles.disableForm}>
              <Text style={styles.instructionTitle}>
                Disable Two-Factor Authentication
              </Text>

              <Text style={styles.formLabel}>
                Account password
              </Text>

              <TextInput
                value={disablePassword}
                onChangeText={setDisablePassword}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.textInput}
              />

              <Text style={styles.formLabel}>
                Authenticator code
              </Text>

              <TextInput
                value={disableCode}
                onChangeText={(value) =>
                  setDisableCode(
                    value.replace(/\D/g, '').slice(0, 6)
                  )
                }
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.codeInput}
              />

              <Pressable
                style={[
                  styles.disableConfirmButton,
                  disableLoading && styles.buttonDisabled,
                ]}
                onPress={handleDisableTwoFactor}
                disabled={disableLoading}
              >
                {disableLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    Disable 2FA
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={cancelDisable}
                disabled={disableLoading}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>



            </View>
          )}
        </View>
      )}


<Pressable
  style={styles.logoutButton}
  onPress={handleLogout}
>
  <Text style={styles.logoutButtonText}>Log out</Text>
</Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },


logoutButton: {
  height: 52,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#d0d0d0',
  backgroundColor: '#fff',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 24,
},

logoutButtonText: {
  color: '#c62828',
  fontSize: 15,
  fontWeight: '600',
},


  container: {
    padding: 28,
    paddingTop: 60,
    paddingBottom: 40,
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
    alignSelf: 'flex-start',
    marginBottom: 28,
  },

  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 30,
  },

  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },

  cardText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 23,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  statusEnabled: {
    backgroundColor: '#2e7d32',
  },

  statusDisabled: {
    backgroundColor: '#999999',
  },

  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },

  actionButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  disableButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#c62828',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  disableButtonText: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '600',
  },

  disableForm: {
    marginTop: 22,
  },

  disableConfirmButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#c62828',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },

  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },

  textInput: {
    height: 52,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#fafafa',
  },

  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    padding: 16,
    backgroundColor: '#ffffff',
  },

  qrCode: {
    width: 240,
    height: 240,
  },

  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginTop: 8,
    marginBottom: 6,
  },

  codeInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 10,
    marginTop: 18,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 6,
    color: '#111111',
    backgroundColor: '#fafafa',
  },

  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 10,
  },

  cancelButtonText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '600',
  },

  recoveryContainer: {
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },

  recoveryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: 2,
    marginVertical: 5,
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