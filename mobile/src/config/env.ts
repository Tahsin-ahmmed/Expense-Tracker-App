/**
 * Public runtime configuration, read from EXPO_PUBLIC_* environment variables
 * (see mobile/.env.example). These values are bundled into the app, so only
 * public values belong here: never the Supabase secret / service-role key.
 */
export interface AppConfig {
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export interface RawEnv {
  supabaseUrl: string | undefined;
  supabasePublishableKey: string | undefined;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new ConfigError(
      `Missing ${name}. Copy mobile/.env.example to mobile/.env and fill it in, then restart Expo.`,
    );
  }
  return value.trim();
}

/**
 * Expo replaces `process.env.EXPO_PUBLIC_*` with literal values at build time,
 * and only when written out in full like this.
 */
function readEnv(): RawEnv {
  return {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

/** Validates configuration. Called lazily, so code that never talks to Supabase needs no env. */
export function getConfig(env: RawEnv = readEnv()): AppConfig {
  const supabaseUrl = required('EXPO_PUBLIC_SUPABASE_URL', env.supabaseUrl);
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
    throw new ConfigError('EXPO_PUBLIC_SUPABASE_URL must look like https://<project>.supabase.co');
  }
  return {
    supabaseUrl,
    supabasePublishableKey: required(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      env.supabasePublishableKey,
    ),
  };
}
