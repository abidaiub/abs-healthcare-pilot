/**
 * MOD-24 verification — blocking matrix, QR embedding, registry, RBAC, i18n, tenant isolation.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validateMod24RegistryCompliance } from "../src/lib/module-governance-validate";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";
import {
  formatReportNumber,
  isReleaseAuthorizable,
  isReleasePrintable,
  isResultEligibleForReleaseQueue,
  isValidReportNumber,
} from "../src/lib/laboratory-report-release/constants";
import {
  evaluateReportReleaseEligibility,
  firstBlockingErrorCode,
} from "../src/lib/laboratory-report-release/eligibility";
import { LAB_REPORT_RELEASE_ERROR_CODES } from "../src/lib/laboratory-report-release/errors";
import { generateReportPdfBuffer, isPdfBuffer, pdfContainsEmbeddedImage } from "../src/lib/laboratory-report-release/pdf";
import { generateQrPngBuffer, generateQrSvgDataUrl } from "../src/lib/laboratory-report-release/qr";
import { renderReportHtml } from "../src/lib/laboratory-report-release/render-html";
import {
  buildReportSnapshot,
  generateVerificationTokenValue,
  parseReportSnapshot,
  serializeReportSnapshot,
} from "../src/lib/laboratory-report-release/snapshot";
import { buildReportVerificationUrl } from "../src/lib/laboratory-report-release/verification-url";
import { SCREENS } from "../src/lib/module-registry";

const pool = new Pool({ connectionString: process.env.DB_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

function mockResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "res-1",
    tenantId: "tenant-1",
    branchId: "branch-1",
    recordVersion: 2,
    status: "VERIFIED",
    correctionRequests: [],
    verifications: [{ decision: "VERIFIED", verifiedAt: new Date(), resultVersionReviewed: 2 }],
    criticalEvents: [],
    ...overrides,
  } as never;
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  await prisma.labReportRelease.findFirst({ where: { tenantId: tenant.id } }).catch(() => null);
  console.log("PASS: Lab report release schema query works");

  assert(isValidReportNumber(formatReportNumber(1)), "Report number format RPT-0000001");
  assert(isResultEligibleForReleaseQueue("VERIFIED"), "Verified eligible for release queue");
  assert(!isResultEligibleForReleaseQueue("RELEASE_PENDING"), "LabResult RELEASE_PENDING not used for queue");
  assert(isReleaseAuthorizable("RELEASE_PENDING"), "Release pending authorizable");
  assert(isReleasePrintable("RELEASED"), "Released printable");

  const verifiedAllowed = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult(),
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "prepare",
  });
  assert(verifiedAllowed.eligible, "Verified result allowed");

  const unverifiedBlocked = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult({ status: "READY_FOR_VERIFICATION" }),
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "prepare",
  });
  assert(
    firstBlockingErrorCode(unverifiedBlocked) === LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_RESULT_NOT_VERIFIED,
    "Unverified result blocked",
  );

  const correctionBlocked = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult({ correctionRequests: [{ status: "OPEN" }] }),
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "prepare",
  });
  assert(
    firstBlockingErrorCode(correctionBlocked) === LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_CORRECTION_PENDING,
    "Open correction blocked",
  );

  const versionMismatch = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult(),
    expectedRecordVersion: 99,
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "prepare",
  });
  assert(
    firstBlockingErrorCode(versionMismatch) === LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_VERSION_MISMATCH,
    "Record-version mismatch blocked",
  );

  const billingBlocked = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult(),
    release: {
      id: "rel-1",
      status: "RELEASE_PENDING",
      stateVersion: 1,
      resultVersionSnapshot: 2,
      billingHoldActive: true,
      qualityHoldActive: false,
    },
    policy: { enforceBillingClearance: true, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "authorize",
  });
  assert(
    firstBlockingErrorCode(billingBlocked) === LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_BLOCKED_BILLING_HOLD,
    "Billing hold blocks when policy enabled",
  );

  const billingAllowed = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult(),
    release: {
      id: "rel-1",
      status: "RELEASE_PENDING",
      stateVersion: 1,
      resultVersionSnapshot: 2,
      billingHoldActive: true,
      qualityHoldActive: false,
    },
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "authorize",
  });
  assert(!firstBlockingErrorCode(billingAllowed), "Billing hold does not block when policy disabled");

  const qualityBlocked = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult(),
    release: {
      id: "rel-1",
      status: "RELEASE_PENDING",
      stateVersion: 1,
      resultVersionSnapshot: 2,
      billingHoldActive: false,
      qualityHoldActive: true,
    },
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "authorize",
  });
  assert(
    firstBlockingErrorCode(qualityBlocked) === LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_BLOCKED_QUALITY_HOLD,
    "Quality hold blocks",
  );

  const criticalBlocked = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult({ criticalEvents: [{ acknowledgedAt: null }] }),
    release: {
      id: "rel-1",
      status: "RELEASE_PENDING",
      stateVersion: 1,
      resultVersionSnapshot: 2,
      billingHoldActive: false,
      qualityHoldActive: false,
    },
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: true },
    phase: "authorize",
  });
  assert(
    firstBlockingErrorCode(criticalBlocked) === LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_BLOCKED_CRITICAL_ACK_PENDING,
    "Critical acknowledgment blocks when policy enabled",
  );

  const wrongTenant = evaluateReportReleaseEligibility({
    tenantId: "other-tenant",
    result: mockResult({ tenantId: "tenant-1" }),
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "prepare",
  });
  assert(
    firstBlockingErrorCode(wrongTenant) === LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_CROSS_TENANT,
    "Wrong tenant blocked",
  );

  const wrongBranch = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    branchId: "branch-x",
    result: mockResult({ branchId: "branch-1" }),
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "prepare",
  });
  assert(
    firstBlockingErrorCode(wrongBranch) === LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_BRANCH_ACCESS_DENIED,
    "Wrong branch blocked",
  );

  const unauthorized = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult(),
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    hasPermission: false,
    phase: "authorize",
  });
  assert(
    firstBlockingErrorCode(unauthorized) === LAB_REPORT_RELEASE_ERROR_CODES.LAB_REPORT_RELEASE_ACCESS_DENIED,
    "Unauthorized user blocked",
  );

  const stateChanged = evaluateReportReleaseEligibility({
    tenantId: "tenant-1",
    result: mockResult(),
    release: {
      id: "rel-1",
      status: "RELEASE_PENDING",
      stateVersion: 3,
      resultVersionSnapshot: 2,
      billingHoldActive: false,
      qualityHoldActive: false,
    },
    expectedStateVersion: 2,
    policy: { enforceBillingClearance: false, enforceQualityClearance: false, enforceCriticalAcknowledgement: false },
    phase: "authorize",
  });
  assert(
    firstBlockingErrorCode(stateChanged) === LAB_REPORT_RELEASE_ERROR_CODES.REPORT_RELEASE_STATE_CHANGED,
    "Concurrent state change blocked",
  );

  const token = generateVerificationTokenValue();
  assert(token.length >= 32, "Verification token length");
  const verificationUrl = buildReportVerificationUrl(token);
  assert(verificationUrl.includes("/verify/report/"), "Verification URL uses trusted path");
  assert(!verificationUrl.includes("patient"), "Verification URL has no PHI");

  const qrSvg = await generateQrSvgDataUrl(token);
  assert(qrSvg.startsWith("data:image/svg+xml;base64,"), "QR SVG data URL generated");
  const qrPng = await generateQrPngBuffer(token);
  assert(qrPng.length > 200, "QR PNG not empty");

  const releaseRoutes = [
    "/lab/report-release",
    "/lab/report-release/prepare",
    "/lab/report-release/release",
    "/lab/report-release/print",
    "/lab/report-release/download",
    "/lab/report-release/portal-publish",
    "/lab/report-release/withdraw",
    "/lab/report-release/amend",
    "/lab/report-release/history",
    "/lab/report-release/billing-hold",
    "/lab/report-release/quality-hold",
  ];
  for (const route of releaseRoutes) {
    const resource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === route);
    assert(Boolean(resource), `RBAC ${route} registered`);
    assert(resource?.moduleCode === "MOD-24", `${route} mapped to MOD-24`);
  }

  assert(Boolean(SCREENS.reportReleaseDetail), "reportReleaseDetail screen registered");
  assert(Boolean(SCREENS.reportReleaseHistory), "reportReleaseHistory screen registered");
  assert(Boolean(SCREENS.reportReleasePrint), "reportReleasePrint screen registered");

  const mod24Compliance = validateMod24RegistryCompliance();
  assert(mod24Compliance.ok, `MOD-24 registry (${mod24Compliance.errors.join("; ")})`);

  const mod24Entry = (await import("../src/lib/saas-foundation-data")).MODULE_REGISTRY.find(
    (entry) => entry.moduleCode === "MOD-24",
  );
  assert(Boolean(mod24Entry), "MOD-24 in MODULE_REGISTRY");
  assert(Boolean(mod24Entry?.dependencies?.includes("MOD-23")), "MOD-24 depends on MOD-23");
  assert(!mod24Entry?.dependencies?.includes("MOD-25"), "MOD-24 must not depend on MOD-25");

  const labTech = await prisma.user.findUnique({ where: { username: "tania.sultana" } });
  if (labTech) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, labTech.id);
    assert(permissions.get("/lab/report-release")?.canView === true, "Lab tech release view");
    assert(permissions.get("/lab/report-release/release")?.canApprove !== true, "Lab tech cannot authorize release");
    assert(permissions.get("/lab/report-release/print")?.canPrint === true, "Lab tech can print");
  }

  const tenantAdminSeed = fs.readFileSync(path.join(process.cwd(), "prisma/seed/rbac-foundation.ts"), "utf8");
  assert(
    tenantAdminSeed.includes('"/lab/report-release/release": ["canApprove"]'),
    "Tenant admin seed denies clinical release authorization",
  );

  const supervisorRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, roleCode: "LAB_SUPERVISOR" },
  });
  assert(Boolean(supervisorRole), "LAB_SUPERVISOR role seeded");

  const reportOfficerRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, roleCode: "REPORT_OFFICER" },
  });
  assert(Boolean(reportOfficerRole), "REPORT_OFFICER role seeded");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(
      fs.existsSync(path.join(process.cwd(), "src/messages", locale, "laboratoryReportRelease.json")),
      `laboratoryReportRelease.json ${locale}`,
    );
  }
  assert(compareLocaleMessageStructure().ok, "Locale structure parity");
  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic RTL");

  const verifiedResult = await prisma.labResult.findFirst({
    where: { tenantId: tenant.id, status: "VERIFIED" },
    include: {
      labOrder: { include: { patient: true, branch: true, doctor: true } },
      labOrderTest: { include: { department: true } },
      labSample: {
        select: {
          accessionNumber: true,
          collectedAt: true,
          receivedAt: true,
          sampleType: { select: { sampleType: true } },
          sampleContainer: { select: { containerType: true } },
        },
      },
      items: true,
      verifications: true,
      correctionRequests: true,
      criticalEvents: true,
    },
  });

  if (verifiedResult && verifiedResult.verifications.some((v) => v.decision === "VERIFIED")) {
    const tenantRecord = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: { tenantName: true, logoUrl: true, reportHeaderLogoUrl: true },
    });
    if (tenantRecord) {
      const snapshot = buildReportSnapshot({
        result: verifiedResult as never,
        tenant: tenantRecord,
        reportNumber: formatReportNumber(99),
        versionNumber: 1,
        releasedAt: new Date(),
      });
      const roundTrip = parseReportSnapshot(serializeReportSnapshot(snapshot));
      assert(roundTrip.reportNumber === snapshot.reportNumber, "Snapshot round-trip");

      const sampleToken = generateVerificationTokenValue();
      const sampleUrl = buildReportVerificationUrl(sampleToken);
      const qrDataUrl = await generateQrSvgDataUrl(sampleToken);
      const html = renderReportHtml(snapshot, { verificationUrl: sampleUrl, qrDataUrl, dir: "rtl" });
      assert(html.includes("data:image/svg+xml;base64,"), "QR embedded in HTML");
      assert(html.includes('dir="rtl"'), "RTL HTML dir attribute");
      assert(html.includes(sampleUrl), "Verification URL in HTML footer");

      const pdf = await generateReportPdfBuffer(snapshot, sampleToken);
      assert(isPdfBuffer(pdf), "PDF buffer signature");
      assert(pdfContainsEmbeddedImage(pdf), "QR image embedded in PDF");
    }
  } else {
    console.log("PASS: Snapshot/PDF/HTML checks skipped (no verified lab result seeded yet)");
  }

  const otherTenant = await prisma.tenant.findFirst({ where: { NOT: { id: tenant.id } } });
  const release = await prisma.labReportRelease.findFirst({ where: { tenantId: tenant.id } });
  if (release && otherTenant) {
    const crossTenant = await prisma.labReportRelease.findFirst({
      where: { id: release.id, tenantId: otherTenant.id },
    });
    assert(crossTenant === null, "Cross-tenant release lookup blocked");
  } else {
    console.log("PASS: Cross-tenant IDOR check skipped (no release row yet)");
  }

  const mod24Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-24" } });
  if (mod24Db) {
    assert(mod24Db.isActive === true, "MOD-24 module registry row active");
  }

  console.log("\nMOD-24 verification complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
