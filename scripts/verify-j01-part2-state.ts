import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function main() {
  const order = await prisma.labOrder.findFirst({
    where: { orderNumber: "LAB-000004", patient: { patientNumber: "PT-000009" } },
    include: {
      samples: { orderBy: { accessionNumber: "asc" } },
      labResults: {
        include: {
          labOrderTest: true,
          items: true,
          verifications: { where: { decision: "VERIFIED" } },
          reportRelease: true,
        },
      },
    },
  });
  assert(Boolean(order), "LAB-000004 belongs to PT-000009");
  assert(order!.samples.map((sample) => sample.accessionNumber).join(",") === "ACC-000011,ACC-000012", "Only the expected accessions exist");
  assert(order!.samples.every((sample) => sample.receivedAt && sample.receivedById), "Both samples retain receipt user and timestamp");
  assert(order!.labResults.length === 3, "CBC, TSH, and Free T4 results exist");
  assert(order!.labResults.every((result) => result.status === "VERIFIED"), "All results are verified");
  assert(order!.labResults.every((result) => result.verifications.length > 0), "Every result has a verified audit decision");

  const item = (code: string) => order!.labResults.flatMap((result) => result.items).find((entry) => entry.parameterCode === code);
  assert(item("HGB")?.abnormalFlag === "NORMAL", "HGB is NORMAL");
  assert(item("WBC")?.numericValue?.toString() === "7200" && item("WBC")?.abnormalFlag === "NORMAL", "WBC is 7200 /cumm and NORMAL");
  assert(item("PLT")?.numericValue?.toString() === "250000" && item("PLT")?.abnormalFlag === "NORMAL", "PLT is 250000 /cumm and NORMAL");
  assert(item("TSH")?.numericValue?.toString() === "6.8" && item("TSH")?.abnormalFlag === "HIGH", "TSH is 6.8 mIU/L and HIGH");
  assert(item("FT4")?.numericValue?.toString() === "1.2" && item("FT4")?.abnormalFlag === "NORMAL", "Free T4 is 1.2 ng/dL and NORMAL");

  const releases = order!.labResults.map((result) => result.reportRelease).filter((release) => release !== null);
  assert(releases.length === 3, "Three report releases exist");
  assert(releases.every((release) => release.status === "RELEASED"), "All reports are RELEASED");
  assert(releases.every((release) => release.portalPublishedAt), "All reports are published to the portal");
  assert(releases.every((release) => !release.billingHoldActive && !release.qualityHoldActive), "No billing or quality hold is active");
  assert(releases.map((release) => release.reportNumber).sort().join(",") === "RPT-0000012,RPT-0000013,RPT-0000014", "Expected report numbers were allocated");

  const lisMessages = await prisma.analyzerImportQueue.findMany({
    where: { messageControlId: { startsWith: "J01P2-" } },
    orderBy: { createdAt: "asc" },
  });
  assert(lisMessages.some((message) => message.messageControlId === "J01P2-CBC-001" && message.processedStatus === "SUCCESS"), "Original CBC LIS message is audited");
  assert(lisMessages.some((message) => message.messageControlId === "J01P2-CBC-002" && message.processedStatus === "SUCCESS"), "Corrected CBC LIS message is audited");
  assert(lisMessages.some((message) => message.messageControlId === "J01P2-TSH-001" && message.processedStatus === "SUCCESS"), "TSH LIS message succeeded");
  assert(lisMessages.some((message) => message.messageControlId === "J01P2-FT4-001" && message.processedStatus === "SUCCESS"), "Free T4 LIS message succeeded");

  const outbox = await prisma.notificationOutbox.findMany({
    where: { entityId: { in: releases.map((release) => release.id) }, eventType: "LAB_REPORT_READY" },
  });
  assert(outbox.length === 3, "One idempotent LAB_REPORT_READY notification is queued per report");
  console.log(JSON.stringify({
    reports: releases.map((release) => ({ reportNumber: release.reportNumber, portalPublishedAt: release.portalPublishedAt, downloadCount: release.downloadCount })),
    notifications: outbox.map((entry) => ({ id: entry.id, status: entry.status, attemptCount: entry.attemptCount, providerReference: entry.providerReference })),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
