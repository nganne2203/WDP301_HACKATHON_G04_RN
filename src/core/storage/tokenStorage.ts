import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEYS = {
  access: 'seal_access_token',
  refresh: 'seal_refresh_token',
} as const;

export async function getAccessToken() {
  return AsyncStorage.getItem(TOKEN_KEYS.access);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(TOKEN_KEYS.refresh);
}

export async function setTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [TOKEN_KEYS.access, accessToken],
    [TOKEN_KEYS.refresh, refreshToken],
  ]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEYS.access, TOKEN_KEYS.refresh]);
}
