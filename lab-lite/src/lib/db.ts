import pg, { type PoolClient, type QueryResultRow } from "pg";

const globalDb = globalThis as unknown as { labLitePool?: pg.Pool; labLiteIdentity?: Promise<void> };

export const pool = globalDb.labLitePool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== "production") globalDb.labLitePool = pool;

export async function verifyDatabaseIdentity(): Promise<void> {
  const expected = process.env.EXPECTED_DATABASE_NAME;
  if (!expected || !/^abs_lab_lite_(dev|test|qc|production)$/.test(expected)) throw new Error("Unsafe or missing EXPECTED_DATABASE_NAME");
  globalDb.labLiteIdentity ??= pool.query<{ name: string }>("select current_database() name").then((result) => {
    if (result.rows[0]?.name !== expected) throw new Error(`Database identity mismatch: expected ${expected}`);
  });
  return globalDb.labLiteIdentity;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  await verifyDatabaseIdentity();
  return pool.query<T>(text, values);
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  await verifyDatabaseIdentity();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
