import dotenv from "dotenv";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local", quiet: true });
const databaseUrl = process.env.DATABASE_URL;
const expected = process.env.EXPECTED_DATABASE_NAME;
if (!databaseUrl || !expected) throw new Error("DATABASE_URL and EXPECTED_DATABASE_NAME are required");
if (!/^abs_lab_lite_(dev|test|qc|production)$/.test(expected)) throw new Error(`Unsafe database identity: ${expected}`);

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  const identity = (await client.query("select current_database() as name")).rows[0]?.name;
  if (identity !== expected) throw new Error(`Database mismatch: expected ${expected}, connected ${identity}`);
  await client.query(`CREATE TABLE IF NOT EXISTS lab_lite_schema_migrations (
    name text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const migrationDir = path.resolve(process.cwd(), "migrations");
  const files = (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    const sql = await readFile(path.join(migrationDir, name), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query("select checksum from lab_lite_schema_migrations where name=$1", [name]);
    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Migration checksum changed: ${name}`);
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("insert into lab_lite_schema_migrations(name,checksum) values($1,$2)", [name, checksum]);
      await client.query("COMMIT");
      process.stdout.write(`applied ${name}\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  process.stdout.write(`database=${identity} migrations=${files.length}\n`);
} finally {
  await client.end();
}
