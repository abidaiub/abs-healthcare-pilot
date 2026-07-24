import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient() {
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function isPrismaClientReady(client: PrismaClient | undefined): client is PrismaClient {
  return Boolean(
    client &&
      typeof client.userBranch?.findFirst === "function" &&
      typeof client.patient?.findFirst === "function" &&
      typeof client.appointment?.findFirst === "function" &&
      typeof client.clinicalEncounter?.findFirst === "function" &&
      typeof client.prescription?.findFirst === "function" &&
      typeof client.medicationCatalogItem?.findFirst === "function" &&
      typeof client.labOrder?.findFirst === "function" &&
      typeof client.labResult?.findFirst === "function" &&
      typeof client.labResultVerification?.findFirst === "function",
  );
}

function getPrismaClient(): PrismaClient {
  if (isPrismaClientReady(globalForPrisma.prisma)) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
