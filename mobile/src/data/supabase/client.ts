import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  AESEncryptionKey,
  AESKeySize,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import { getConfig } from '@/config/env';

import type { Database } from './database.types';
import { createEncryptedStorage, type AuthStorage, type Cipher } from './encryptedStorage';

export type AppSupabaseClient = SupabaseClient<Database>;

const aesGcmCipher: Cipher = {
  async generateKey() {
    const key = await AESEncryptionKey.generate(AESKeySize.AES256);
    return key.encoded('base64');
  },
  async encrypt(plaintextBase64, keyBase64) {
    const key = await AESEncryptionKey.import(keyBase64, 'base64');
    const sealed = await aesEncryptAsync(plaintextBase64, key);
    return sealed.combined('base64');
  },
  async decrypt(sealedBase64, keyBase64) {
    const key = await AESEncryptionKey.import(keyBase64, 'base64');
    return aesDecryptAsync(AESSealedData.fromCombined(sealedBase64), key, { output: 'base64' });
  },
};

const secureKeyStore: AuthStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

let client: AppSupabaseClient | null = null;

/** The app's single Supabase client, created on first use. */
export function getSupabase(): AppSupabaseClient {
  if (client) {
    return client;
  }
  const { supabaseUrl, supabasePublishableKey } = getConfig();
  client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      // Web has no SecureStore; the browser keeps its own session storage.
      storage:
        Platform.OS === 'web'
          ? undefined
          : createEncryptedStorage({
              keyStore: secureKeyStore,
              valueStore: AsyncStorage,
              cipher: aesGcmCipher,
            }),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // PKCE: password-reset links only work on the device that asked for them.
      flowType: 'pkce',
    },
  });

  // Refresh tokens only while the app is in the foreground (Supabase guidance for React Native).
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void client?.auth.startAutoRefresh();
      } else {
        void client?.auth.stopAutoRefresh();
      }
    });
  }

  return client;
}
