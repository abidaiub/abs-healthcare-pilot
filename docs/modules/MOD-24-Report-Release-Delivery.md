# MOD-24 — Report Release & Delivery

| Field | Value |
|-------|-------|
| **Module** | MOD-24 |
| **Display name** | Report Release & Delivery |
| **Depends on** | MOD-07, MOD-15, MOD-21, MOD-22, MOD-23 + platform modules |
| **Downstream** | MOD-30 Patient Portal |
| **Verify** | `npm run verify:mod24` |
| **Status** | AI COMPLETE — MANUAL QC PENDING |

## Purpose

Authorize release of pathologist-verified laboratory results, freeze immutable report snapshots, support print/PDF delivery, QR authenticity verification, portal publish handoff, withdrawal, and post-release amendment versioning.

## Scope (Pilot)

- Release queue for verified results
- Prepare release → `RELEASE_PENDING`
- Authorize release → allocate `RPT-0000001` report number, immutable snapshot version, QR token
- HTML printable report and server-generated PDF download
- Print/reprint audit with reason governance
- Portal publish flag (`portalPublishEligible`) for MOD-30
- Public QR verification page (no PHI)
- Withdrawal and amendment version history

Out of scope: patient portal UI (MOD-30), WhatsApp/email dispatch APIs, crypto digital signatures.

## QC

Automated: PASS | Manual: NOT TESTED | Production: Pending Manual QC
