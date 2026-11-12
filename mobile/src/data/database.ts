import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'hisabbondhu.db';

/**
 * Schema migrations, applied in order. Each entry moves the database from
 * version `index` to `index + 1` (tracked with SQLite's `user_version`).
 * Never edit a released migration: append a new one instead.
 */
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE transactions (
    id             TEXT PRIMARY KEY NOT NULL,
    type           TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount_poisha  INTEGER NOT NULL CHECK (amount_poisha > 0),
    category_id    TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    note           TEXT,
    occurred_on    TEXT NOT NULL,
    created_at     TEXT NOT NULL
  );
  CREATE INDEX idx_transactions_occurred_on ON transactions (occurred_on DESC, created_at DESC);
  `,
];

async function migrate(db: SQLiteDatabase): Promise<SQLiteDatabase> {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const migration = MIGRATIONS[version];
    const nextVersion = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration);
      await db.execAsync(`PRAGMA user_version = ${nextVersion}`);
    });
    version = nextVersion;
  }

  return db;
}

let databasePromise: Promise<SQLiteDatabase> | null = null;

/** Opens the local database once and applies pending migrations. */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME)
      .then(migrate)
      .catch((error: unknown) => {
        // Allow a later call to retry instead of caching the failure.
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
}
