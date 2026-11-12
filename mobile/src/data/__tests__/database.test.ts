import { openDatabaseAsync } from 'expo-sqlite';

function fakeDb(userVersion: number) {
  const executed: string[] = [];
  const db = {
    executed,
    execAsync: jest.fn(async (sql: string) => {
      executed.push(sql);
    }),
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: userVersion }),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  };
  return db;
}

async function openWith(userVersion: number) {
  const db = fakeDb(userVersion);
  (openDatabaseAsync as jest.Mock).mockResolvedValue(db);
  // Fresh module so the cached database promise is reset for each test.
  let getDatabase!: typeof import('../database').getDatabase;
  jest.isolateModules(() => {
    ({ getDatabase } = jest.requireActual<typeof import('../database')>('../database'));
  });
  await getDatabase();
  return db;
}

describe('database migrations', () => {
  it('creates all tables on a fresh install', async () => {
    const db = await openWith(0);
    const sql = db.executed.join('\n');

    expect(sql).toContain('CREATE TABLE transactions');
    expect(sql).toContain('CREATE TABLE budgets');
    expect(sql).toContain('PRAGMA user_version = 2');
  });

  it('upgrades a version 1 database by adding budgets only', async () => {
    const db = await openWith(1);
    const sql = db.executed.join('\n');

    expect(sql).not.toContain('CREATE TABLE transactions');
    expect(sql).toContain('CREATE TABLE budgets');
    expect(sql).toContain('PRAGMA user_version = 2');
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
  });

  it('does nothing when already up to date', async () => {
    const db = await openWith(2);

    expect(db.withTransactionAsync).not.toHaveBeenCalled();
  });

  it('retries opening after a failure', async () => {
    (openDatabaseAsync as jest.Mock).mockRejectedValueOnce(new Error('locked'));
    let getDatabase!: typeof import('../database').getDatabase;
    jest.isolateModules(() => {
      ({ getDatabase } = jest.requireActual<typeof import('../database')>('../database'));
    });

    await expect(getDatabase()).rejects.toThrow('locked');

    (openDatabaseAsync as jest.Mock).mockResolvedValueOnce(fakeDb(2));
    await expect(getDatabase()).resolves.toBeDefined();
  });
});
