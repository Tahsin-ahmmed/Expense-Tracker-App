import { ConfigError, getConfig } from '../env';

describe('getConfig', () => {
  it('reads and trims the public Supabase settings', () => {
    expect(
      getConfig({
        supabaseUrl: ' https://abcxyz.supabase.co ',
        supabasePublishableKey: 'sb_publishable_123',
      }),
    ).toEqual({
      supabaseUrl: 'https://abcxyz.supabase.co',
      supabasePublishableKey: 'sb_publishable_123',
    });
  });

  it('explains how to fix missing settings', () => {
    const missingUrl = () =>
      getConfig({ supabaseUrl: undefined, supabasePublishableKey: 'sb_publishable_123' });
    expect(missingUrl).toThrow(ConfigError);
    expect(missingUrl).toThrow(/mobile\/.env.example/);

    expect(() =>
      getConfig({ supabaseUrl: 'https://abcxyz.supabase.co', supabasePublishableKey: ' ' }),
    ).toThrow(/EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it('rejects URLs that are not a Supabase project over HTTPS', () => {
    for (const supabaseUrl of ['http://abcxyz.supabase.co', 'https://evil.example.com']) {
      expect(() => getConfig({ supabaseUrl, supabasePublishableKey: 'k' })).toThrow(/supabase\.co/);
    }
  });
});
