import * as SecureStore from 'expo-secure-store';

const CHALLENGE_TOKEN_KEY = 'employee_2fa_challenge';

export async function saveTwoFactorChallenge(
  challengeToken: string
) {
  await SecureStore.setItemAsync(
    CHALLENGE_TOKEN_KEY,
    challengeToken
  );
}

export async function getTwoFactorChallenge() {
  return SecureStore.getItemAsync(
    CHALLENGE_TOKEN_KEY
  );
}

export async function removeTwoFactorChallenge() {
  await SecureStore.deleteItemAsync(
    CHALLENGE_TOKEN_KEY
  );
}