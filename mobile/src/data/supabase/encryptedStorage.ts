/**
 * Encrypted key-value storage for the Supabase session.
 *
 * Sessions are larger than SecureStore's ~2 KB limit, so (as in Supabase's
 * Expo guide) each value is encrypted and stored in AsyncStorage, while the
 * random 256-bit key protecting it lives in SecureStore (Android Keystore /
 * iOS Keychain). We use AES-GCM from expo-crypto, which also detects
 * tampering, instead of the guide's AES-CTR via extra packages.
 */

/** Minimal storage interface Supabase's auth client expects. */
export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Symmetric cipher working on base64 strings (injected for testing). */
export interface Cipher {
  /** Creates a new random key, returned base64-encoded. */
  generateKey(): Promise<string>;
  /** Encrypts base64 plaintext; returns base64 of IV + ciphertext + tag. */
  encrypt(plaintextBase64: string, keyBase64: string): Promise<string>;
  /** Reverses `encrypt`. Throws if the data was altered or the key is wrong. */
  decrypt(sealedBase64: string, keyBase64: string): Promise<string>;
}

export interface EncryptedStorageDeps {
  /** Small secure store for keys (SecureStore). */
  keyStore: AuthStorage;
  /** Large plain store for encrypted values (AsyncStorage). */
  valueStore: AuthStorage;
  cipher: Cipher;
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Text → base64 without TextEncoder: percent-encode to ASCII first so any
 * Unicode (e.g. Bangla names in user metadata) survives.
 */
export function textToBase64(text: string): string {
  const ascii = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  let output = '';
  for (let i = 0; i < ascii.length; i += 3) {
    const a = ascii.charCodeAt(i);
    const b = i + 1 < ascii.length ? ascii.charCodeAt(i + 1) : NaN;
    const c = i + 2 < ascii.length ? ascii.charCodeAt(i + 2) : NaN;
    const triple = (a << 16) | ((b || 0) << 8) | (c || 0);
    output += BASE64_ALPHABET[(triple >> 18) & 63] + BASE64_ALPHABET[(triple >> 12) & 63];
    output += Number.isNaN(b) ? '=' : BASE64_ALPHABET[(triple >> 6) & 63];
    output += Number.isNaN(c) ? '=' : BASE64_ALPHABET[triple & 63];
  }
  return output;
}

/** Reverses `textToBase64`. */
export function base64ToText(base64: string): string {
  const clean = base64.replace(/=+$/, '');
  let bytes = '';
  for (let i = 0; i < clean.length; i += 4) {
    const values = [0, 1, 2, 3].map((offset) =>
      i + offset < clean.length ? BASE64_ALPHABET.indexOf(clean[i + offset]) : 0,
    );
    const triple = (values[0] << 18) | (values[1] << 12) | (values[2] << 6) | values[3];
    bytes += String.fromCharCode((triple >> 16) & 255);
    if (i + 2 < clean.length) bytes += String.fromCharCode((triple >> 8) & 255);
    if (i + 3 < clean.length) bytes += String.fromCharCode(triple & 255);
  }
  return decodeURIComponent(
    bytes.replace(/[\s\S]/g, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`),
  );
}

/** SecureStore keys may only contain letters, digits, ".", "-" and "_". */
function keyNameFor(key: string): string {
  return `hb_key_${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

export function createEncryptedStorage({
  keyStore,
  valueStore,
  cipher,
}: EncryptedStorageDeps): AuthStorage {
  return {
    async getItem(key) {
      const sealed = await valueStore.getItem(key);
      if (sealed === null) {
        return null;
      }
      const encryptionKey = await keyStore.getItem(keyNameFor(key));
      if (encryptionKey === null) {
        return null;
      }
      try {
        return base64ToText(await cipher.decrypt(sealed, encryptionKey));
      } catch {
        // Corrupt or tampered data: treat as signed out rather than crashing.
        return null;
      }
    },

    async setItem(key, value) {
      // A fresh key per write, so an old leaked key never decrypts new sessions.
      const encryptionKey = await cipher.generateKey();
      const sealed = await cipher.encrypt(textToBase64(value), encryptionKey);
      await keyStore.setItem(keyNameFor(key), encryptionKey);
      await valueStore.setItem(key, sealed);
    },

    async removeItem(key) {
      await valueStore.removeItem(key);
      await keyStore.removeItem(keyNameFor(key));
    },
  };
}
