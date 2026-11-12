import {
  base64ToText,
  createEncryptedStorage,
  textToBase64,
  type AuthStorage,
  type Cipher,
} from '../encryptedStorage';

function memoryStore(): AuthStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

/** Reversible stand-in for AES: tags data with the key so a wrong key fails. */
const fakeCipher: Cipher = {
  generateKey: jest.fn(async () => `key-${Math.random()}`),
  encrypt: async (plain, key) => `${key}|${plain.split('').reverse().join('')}`,
  decrypt: async (sealed, key) => {
    const [usedKey, body] = sealed.split('|');
    if (usedKey !== key) {
      throw new Error('auth tag mismatch');
    }
    return body.split('').reverse().join('');
  },
};

describe('base64 text helpers', () => {
  it.each(['', 'a', 'ab', 'abc', '{"access_token":"x.y.z","user":{"id":"1"}}', 'নাম: রহিম ৳১২৫০'])(
    'round-trips %j',
    (text) => {
      expect(base64ToText(textToBase64(text))).toBe(text);
    },
  );

  it('produces standard base64', () => {
    expect(textToBase64('hello')).toBe('aGVsbG8=');
  });
});

describe('encrypted storage', () => {
  function setup() {
    const keyStore = memoryStore();
    const valueStore = memoryStore();
    const storage = createEncryptedStorage({ keyStore, valueStore, cipher: fakeCipher });
    return { keyStore, valueStore, storage };
  }

  it('stores values encrypted, with the key kept separately', async () => {
    const { keyStore, valueStore, storage } = setup();
    const session = '{"access_token":"secret-token"}';

    await storage.setItem('sb-abc-auth-token', session);

    expect(valueStore.data.get('sb-abc-auth-token')).not.toContain('secret-token');
    expect(keyStore.data.size).toBe(1);
    expect([...keyStore.data.keys()][0]).toMatch(/^[A-Za-z0-9._-]+$/);
    await expect(storage.getItem('sb-abc-auth-token')).resolves.toBe(session);
  });

  it('returns null for missing values or keys, and for tampered data', async () => {
    const { keyStore, valueStore, storage } = setup();
    await expect(storage.getItem('missing')).resolves.toBeNull();

    await storage.setItem('k', 'v');
    keyStore.data.clear();
    await expect(storage.getItem('k')).resolves.toBeNull();

    await storage.setItem('k', 'v');
    valueStore.data.set('k', 'other-key|tampered');
    await expect(storage.getItem('k')).resolves.toBeNull();
  });

  it('removes both the value and its key', async () => {
    const { keyStore, valueStore, storage } = setup();
    await storage.setItem('k', 'v');

    await storage.removeItem('k');

    expect(valueStore.data.size).toBe(0);
    expect(keyStore.data.size).toBe(0);
  });
});
