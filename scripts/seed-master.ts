import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedHostDiagnosticCatalog } from "../prisma/seed/host-diagnostic-catalog";
import { seedModuleRegistry } from "../prisma/seed/tenant-diagnostic-masters";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  await seedHostDiagnosticCatalog(prisma);
  await seedModuleRegistry(prisma);
  process.stdout.write("Production-safe master seed complete: host diagnostic catalog and module registry\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
