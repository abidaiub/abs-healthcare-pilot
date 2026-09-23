# Doctor contract production-build fix

Date: 2026-09-23
Baseline: `748ada8`

## Root cause

`DoctorsPanel` already submitted `isReferring` and `commissionApplicable`, and both are existing persisted `Doctor` attributes in the Prisma model and the original diagnostic-master migration. The authoritative server-action input contract for `createTenantDoctorAction` omitted those two booleans. Its Prisma create payload also failed to copy them, so removing the UI fields would have silently broken existing referral/commission behavior.

The correction adds optional typed booleans to the action input and persists them with explicit `false` defaults. Existing `isReporting`, `isVerifying`, and `isPathologist` handling is unchanged. No cast, `any`, compiler suppression, Prisma upgrade, schema edit, or migration was required.

## Architecture audit

- Prisma `Doctor`: `isReferring Boolean @default(false)` and `commissionApplicable Boolean @default(false)` already exist.
- Migration `20260618181333_layer2_diagnostic_masters` already creates `is_referring` and `commission_applicable`.
- Generated Prisma client exposes both fields.
- Doctor listing maps `isReferring`, reporting, verifying, consultant, pathologist, and radiologist flags; the current referral work also displays commission eligibility.
- Walk-in billing selects active referring doctors independently from non-doctor `ReferralSource` records.
- UAT doctor upserts preserve reporting/verifying/pathologist behavior.
- No separate doctor update action exists on the current Doctors page; existing seed upserts and Prisma update paths are unaffected.

## Regression evidence

| Command/check | Result |
|---|---|
| `npm run build` | PASS: Prisma Client 7.8.0 generated, Next.js compiled, TypeScript passed, 87 static pages generated. |
| `npm run lint` | FAIL outside this fix: broad lint scans pre-existing `.local-runtime`, `lab-lite/.next`, `node_modules.corrupt-*`, and unrelated existing React violations; no reported finding targeted the two action hunks. |
| Targeted ESLint on doctor page/panel/action/query | PASS. |
| `npm run verify:navigation-permissions` | 392/399: every Doctors permission/navigation assertion passed; seven unrelated duplicate navigation href assertions failed in existing uncommitted navigation work. |
| `npx tsx scripts/verify-referral-source-master.ts` | PASS: doctor/referral separation, selectable referring doctor, commission eligibility/policy/status snapshot, guards, and historical snapshots. |
| `npx tsx scripts/verify-walk-in-multiple-referral.ts` | PASS: doctor-only, partner-only, combined, inactive/cross-tenant guards, commission eligibility snapshot, and FK integrity. |

Production build blocker: **resolved**. Broader lint and navigation failures are pre-existing, unrelated worktree findings and were not changed under this narrowly scoped task.
