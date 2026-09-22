# Phase 4 customer-pilot readiness execution report

Date: 2026-09-22  
Baseline: ABS Lab Lite Desktop 0.1.0 / Phase 3  
Verdict: **BLOCKED**

## Executive decision

The frozen Phase 3 architecture remains technically sound for a controlled pilot, and the available automated, packaging, upgrade, rollback, encryption, synchronization, and restore tests passed. Customer installation is nevertheless blocked because the evidence explicitly required for final readiness is incomplete: the installer is unsigned; an actual Windows reboot and offline cold-start were not run; native operator UAT could not be controlled by the available test harness; physical output was not inspected for any paper format; no production HTTPS endpoint or production secrets were provisioned; and no real operator acceptance session occurred.

No parallel authentication, synchronization, billing, or ledger path was introduced. The validated financial/synchronization paths remained frozen; remediation is limited to deployment/operations assets, privacy-minimized logging, the guarded restore orchestration, evidence, and regression coverage.

## Final blocker-remediation pass

Source-control blocker 1 is closed by commit `b49280f` (`feat(lab-lite): add pilot deployment and phase 4 controls`), pushed to GitHub `main` on 2026-09-22. The commit contains the complete independent Lab Lite source, QC Compose/reverse-proxy configuration, safe master seed, health endpoint, backup/monitor scripts, and Phase 4 evidence. Local/runtime `.env` files, databases, build output, and unsigned installer artifacts were excluded.

Live SSH reached `192.168.2.44` but authentication failed with `Permission denied (publickey,password)`. External DNS still resolves to `202.5.54.132`; TCP 80 and 443 failed, and both HTTP and HTTPS probes timed out. No server write or risky migration/firewall/OS action was attempted. The installer remains Authenticode `NotSigned` with SHA-256 `6ACBDEDD23239EF87CE102CFFB472E0F1F532F836F72FEB7921A1928248C2DFC`.

Code-side remediation added privacy-minimized rotating Electron operational logs, a validated/safety-backed same-device restore workflow, fail-closed dual-database backup automation, and minimum pilot health monitoring. The frozen billing/sync architecture was not replaced. Verification: 27 Lab Lite tests PASS; web typecheck/lint PASS; desktop typecheck PASS; isolated desktop SQLCipher/backup/reprint/logging regression PASS; Compose YAML parse PASS. Docker engine execution was unavailable locally.

## Final 20-blocker evidence matrix

| # | Severity | Status | Evidence and required remediation |
|---|---|---|---|
| 1 Source control | BLOCKER | PASS | Commit `b49280f` pushed to `origin/main`; required files present, scoped secret scan found only synthetic test credentials. |
| 2 Docker networking | BLOCKER | NOT RUN live | Source binds apps to loopback, publishes no PostgreSQL, and omits pgAdmin. Authenticate server, cut over, inspect actual bindings, and prove old public ports closed. |
| 3 Persistent DB safety | BLOCKER | NOT RUN live | Source names two volumes and `/var/lib/postgresql/data`; actual volume/project/mount inventory and app-recreate persistence test required. Never use `down -v`. |
| 4 Pre-migration backup | BLOCKER | NOT RUN | Backup tool implemented; no live dump/hash/off-server copy/full restore exists. |
| 5 Production migration | BLOCKER | PASS local / NOT RUN live | Five Lab Lite migrations applied in isolated test DB; live pre/post Prisma/custom-ledger status requires backup and server access. |
| 6 Master seed | HIGH | PASS local / NOT RUN live | Safe separated idempotent paths verified; generic/demo seed remains excluded. Capture live before/after/rerun counts after migration. |
| 7 HTTPS/TLS | BLOCKER | FAIL | DNS resolves; TCP 80/443 and HTTP/HTTPS failed. Configure NAT/proxy/trusted certificate/renewal and repeat externally. |
| 8 Firewall | BLOCKER | NOT RUN | Effective server/router rules unavailable. Preserve SSH recovery, apply least privilege, and prove forbidden ports closed. |
| 9 Supported Ubuntu | BLOCKER | NOT RUN / prior finding unresolved | Server OS could not be reverified; prior Ubuntu 23.10 finding has no supported-LTS remediation evidence. Back up and migrate/rebuild under a witnessed rollback plan. |
| 10 Signed installer | BLOCKER | FAIL | Installer is `NotSigned`; acquire/custody/sign/timestamp/verify setup and update chain. |
| 11 Reboot/offline cold start | BLOCKER | NOT RUN | Real reboot prohibited from inference; perform witnessed field sequence and reconcile one identity. |
| 12 Native Electron UAT | BLOCKER | NOT RUN | Installed app exists; native visual surface was unavailable to current automation. Human native UAT required. |
| 13 Physical printers/devices | BLOCKER | NOT RUN | Brother A4/A5 hardware was previously detected but no paper inspected; thermal/cutter/drawer unavailable. Certify A4/A5 or do not pilot. Explicitly exclude POS/cutter/drawer if absent. |
| 14 Save & Print safety | HIGH | PASS automated | Regression proves post precedes receipt, failed receipt lookup/reprint does not change bill count, and existing operation/receipt identity is reused. Physical print-failure drill remains required. |
| 15 Operational logging | HIGH | PASS source/regression | Rotating allowlisted JSONL logging implemented and redaction/rotation tested; installed-client support collection remains field-UAT work. |
| 16 Operator-safe restore | HIGH | PASS source/regression / NOT RUN human | Backup validation, safety copy, write suspension, atomic swap, reopen, rollback, sign-out, and reconcile instruction implemented. Witnessed support drill required. |
| 17 Revoke after restore | HIGH | PASS protocol / NOT RUN native | Server test quarantines revoked-device uploads; exact old-backup native field sequence remains open. |
| 18 Secret/key custody | BLOCKER | FAIL | Storage/rotation rules documented, but accountable people and operational stores are UNASSIGNED. Assign and approve without recording values in Git. |
| 19 Monitoring | BLOCKER | IMPLEMENTED / NOT RUN live | App/DB/disk/HTTPS/TLS checks and syslog failure implemented; scheduler, alert delivery, backup-age alert, and failure drills required. |
| 20 Operator acceptance | BLOCKER | NOT RUN | No intended diagnostic-center operator participated. Execute and sign the acceptance record. |

All NOT RUN and FAIL items above remain open; automated PASS evidence does not close native, physical, infrastructure, or human gates.

## Environment and artifacts

- Host: Windows 10 Pro, build 26200, 64-bit, ASUS system.
- Baseline installer: `desktop/out/make/squirrel.windows/x64/ABS-Lab-Lite-Setup.exe`.
- Baseline installer SHA-256: `6ACBDEDD23239EF87CE102CFFB472E0F1F532F836F72FEB7921A1928248C2DFC`.
- Authenticode: `NotSigned`.
- Installed baseline after rollback: `%LOCALAPPDATA%\abs_lab_lite\app-0.1.0`.
- Electron data: `%APPDATA%\abs-lab-lite-desktop`.
- Upgrade test: temporary version-only 0.1.1 built from identical frozen source; it is a test fixture, not a release.

## Executed evidence

| Test | Result | Evidence / limitation |
|---|---|---|
| Clean per-user install | PASS | Squirrel exit 0; `app-0.1.0`, launcher, packages, and updater installed. This was a clean app install on an existing Windows host, not a freshly imaged OS. |
| App process launch | PASS with qualification | Installed Electron processes remained responsive and created Electron user data. Native windows were not exposed to the automation surface, so visual correctness is not certified. |
| Uninstall/reinstall preservation | PASS | Squirrel uninstall retained `%APPDATA%\abs-lab-lite-desktop`; reinstall succeeded. Runtime cache files changed as expected. |
| Upgrade 0.1.0 → 0.1.1 | PASS | Version folder changed to `app-0.1.1`; encrypted synthetic finance fixture remained byte-identical. |
| Rollback 0.1.1 → 0.1.0 | PASS | Uninstall/reinstall returned to `app-0.1.0`; fixture SHA-256 remained `8DF7C6FD6B24AE982E4C8B17F13B29856E95786445581279DE2D7264A75E7436`. |
| Windows reboot/offline autostart | NOT RUN | Reboot would terminate the active validation environment; must be executed on the field-UAT PC. |
| Native visual UAT | NOT RUN | Native application surfaces were unavailable to the current UI automation harness. |
| Physical print inspection | NOT RUN | Brother HL-L2360D A4-capable printer was detected, but no human inspected paper output. No thermal printer, cutter, or cash drawer was available. |
| Backup/full restore | PASS with qualification | Encrypted backup reopened with the key and retained device, bill operation ID, receipt ID, records, and sync checkpoint. Cross-PC restore is intentionally impossible without protected key material. |
| Offline/online protocol regression | PASS | Existing tests cover offline 1000/400/600, reconnect, due-to-zero, lost acknowledgement, retry, conflict, tampering, expiry, revocation quarantine, and historical price. |
| Production HTTPS | NOT RUN | No production hostname, certificate, reverse proxy, firewall, database TLS, or production environment was supplied. |
| Production dependency audit | PASS | Cloud and desktop production audits reported zero known vulnerabilities during Phase 3 validation. |
| Operator acceptance | NOT RUN | No named diagnostic-center operator participated. |

## Defect and readiness register

| ID | Severity | Finding | Evidence | Required remediation |
|---|---|---|---|---|
| P4-001 | BLOCKER | Installer is not code-signed. | Authenticode status `NotSigned`. | Obtain organization-controlled EV/standard code-signing certificate, protect it in approved signing service/HSM, sign installer/packages, and verify chain/timestamp/SmartScreen behavior. |
| P4-002 | BLOCKER | Native end-to-end desktop UAT is absent. | Automation surface returned no native app windows. | Run the complete field checklist with screen evidence on the target Windows PC and two operators. |
| P4-003 | BLOCKER | Physical receipt output is uncertified. | Printer inventory only; no inspected paper. | Print and sign off A4/A5/80mm/58mm samples; test cutter and cash drawer only on intended hardware. |
| P4-004 | BLOCKER | Actual reboot/offline cold-start is unproven. | Only process restarts were tested. | Activate a synthetic field device, disconnect network, reboot Windows twice, verify auto-launch/login/bill/receipt/restart persistence. |
| P4-005 | BLOCKER | Production HTTPS/configuration is unprovisioned. | A safe QC Compose/reverse-proxy template now exists, but the target server timed out over SSH and no certificate/environment evidence is available. | Complete `docs/QC/ABS-Lab-Lite-Docker-Server-Configuration-Audit.md` against the real pilot infrastructure. |
| P4-006 | BLOCKER | Real operator acceptance is absent. | No field operator session or signed checklist. | Conduct supervised UAT with billing operator and site manager using synthetic patients. |
| P4-007 | HIGH | Desktop operational logging/monitoring is insufficient. | No structured app/sync/error log or health export exists; only UI state and database evidence are available. | Add privacy-minimized rotating local events and cloud device/sync alerting in a versioned Phase 4 candidate; never log credentials, lease tokens, patient details, or payloads. |
| P4-008 | HIGH | Restore is technical, not operator-safe. | Backup verification exists, but there is no supported in-app restore workflow; DB backup alone cannot recover a lost DPAPI key. | Provide a support-led, same-profile restore tool/runbook with hash, scope, schema, checkpoint, and outbox verification. Treat lost-key devices as replacement/reconciliation, not DB copying. |
| P4-009 | HIGH | No signed update feed or release promotion system exists. | Forge creates local Squirrel artifacts only. | Establish signed immutable release storage, staged rings, manifest integrity, rollback artifacts, and change approval before enabling updates. |
| P4-010 | MEDIUM | Lease-signing and device-pepper rotation require coordinated interruption. | Contract has no signing-key ID or overlapping verification set. | For this pilot, use controlled maintenance: stop posting, drain queues, back up, rotate, revoke/re-activate devices. Do not rotate while pending operations exist. |
| P4-011 | MEDIUM | Uninstall may leave `.dead` version directories until Squirrel cleanup/reboot. | Observed after uninstall; reinstall/rollback still passed. | Verify cleanup after the mandatory reboot test; retain as operational note if removed normally. |
| P4-012 | LOW | Runtime cache hashes change during install/relaunch. | User-data directory persisted, but nonfinancial cache files changed. | Preservation checks must hash the encrypted DB/key/config/outbox artifacts, not Chromium caches. |

## Exit criteria for re-evaluation

P4-001 through P4-006 must close with artifacts and human sign-off. P4-007 through P4-009 require an approved, versioned pilot candidate and repeat regression/install/rollback testing. Final PASS is prohibited until reboot, native, physical-device, recovery, HTTPS, signed-update, and operator evidence are all present.
