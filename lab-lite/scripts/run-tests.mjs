import { spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test", quiet: true });
process.env.DOTENV_CONFIG_PATH = ".env.test";
const leaseKeys=generateKeyPairSync("ed25519");
process.env.DEVICE_AUTH_PEPPER="synthetic-phase-three-device-auth-pepper-0001";
process.env.DEVICE_LEASE_PRIVATE_KEY_PEM_BASE64=Buffer.from(leaseKeys.privateKey.export({type:"pkcs8",format:"pem"})).toString("base64");
process.env.DEVICE_LEASE_PUBLIC_KEY_PEM_BASE64=Buffer.from(leaseKeys.publicKey.export({type:"spki",format:"pem"})).toString("base64");

const migration = spawnSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(), env: { ...process.env }, stdio: "inherit",
});
if (migration.status !== 0) process.exit(migration.status ?? 1);

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", "tests/catalog-master.test.ts", "tests/phase1.test.ts", "tests/phase2.test.ts", "tests/phase3.test.ts"], {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: "inherit",
});
process.exit(result.status ?? 1);
