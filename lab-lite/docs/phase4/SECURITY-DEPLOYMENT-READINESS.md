# Security and deployment readiness checklist

Status remains **BLOCKED** until every mandatory item has environment evidence.

## Custody register — owner assignment required

No named customer/server custodian was available in this run, so ownership is not invented. Before pilot activation, the organization must replace every `UNASSIGNED` entry and obtain two-person approval.

| Secret/key | Accountable owner | Storage boundary | Rotation authority | Recovery rule | Status |
|---|---|---|---|---|---|
| PostgreSQL credentials | UNASSIGNED | Server secret store; never Git/image | DBA + service owner | Rotate app and DB atomically; test pools | BLOCKER |
| Session/authentication pepper | UNASSIGNED | Server secret store | Security owner + service owner | Rotation invalidates sessions; require re-login | BLOCKER |
| Device-auth pepper | UNASSIGNED | Server secret store | Security owner under maintenance window | Drain/reconcile, rotate, revoke/re-activate | BLOCKER |
| Lease-signing private key | UNASSIGNED | HSM/KMS or audited signing service | Two authorized security custodians | Current contract requires coordinated device refresh | BLOCKER |
| Desktop SQLCipher/device secrets | Device Windows profile | DPAPI; never exported plaintext | App/device lifecycle only | Same-profile restore; lost key means replacement/reconciliation | DEFINED |
| TLS private key | UNASSIGNED | ACME/Nginx root-owned store | Infrastructure/security owner | Renewal test; emergency reissue/revoke | BLOCKER |
| Installer signing key | UNASSIGNED | HSM/cloud signing service with MFA | Release/security custodians | Revoke certificate, halt feed, re-sign trusted release | BLOCKER |
| Backup encryption/access | UNASSIGNED | Approved encrypted off-server vault | DBA + security custodian | Quarterly restore; break-glass access audited | BLOCKER |

Real secret values, recovery codes, tokens, activation codes, and private keys are prohibited from this document and repository.

## HTTPS and infrastructure

- [ ] Approved production-like hostname and Bangladesh pilot network owner recorded.
- [ ] Publicly trusted certificate chain, hostname match, expiry monitoring, and automated renewal tested.
- [ ] TLS 1.2/1.3 only; HTTP redirects to HTTPS; HSTS enabled after validation.
- [ ] `APP_ORIGIN=https://...` and `COOKIE_SECURE=true`; direct port 3100 is not internet/LAN exposed.
- [ ] Reverse proxy sets CSP, frame denial, MIME sniffing denial, referrer policy, and request-size/time limits.
- [ ] PostgreSQL is isolated, encrypted in transit with CA verification, least-privilege non-owner credentials, backup encryption, and restore testing.
- [ ] Firewall permits only required client-to-HTTPS and service-to-database flows.
- [ ] Time synchronization is monitored because leases and rollback detection depend on trustworthy time.

## Secret and key custody

- [ ] Independent high-entropy values exist for session pepper and device-auth pepper; no example/default values remain.
- [ ] Ed25519 lease private key is created inside approved KMS/HSM/signing service where possible; public key is distributed separately.
- [ ] Database credentials, peppers, and signing key are injected from the deployment secret store, not files in source/image/logs.
- [ ] Named custodians, least privilege, access audit, escrow/recovery, compromise contacts, and rotation dates are approved.
- [ ] Desktop database/device keys remain DPAPI-protected; support never exports them in plaintext.
- [ ] Secret scanning and build-log review show no credentials, activation codes, tokens, patient data, or private keys.

## Rotation procedure for the current contract

The current lease format has no key ID or overlapping public-key set. Therefore routine lease-key or device-pepper rotation must be a controlled maintenance event: announce posting freeze; synchronize and reconcile all device queues; take backups; block new activation; rotate the server secret/key; revoke old devices/leases as applicable; re-activate/refresh each device; verify one synthetic operation; then reopen posting. Do not rotate while pending operations exist. A compromise requires immediate device disable/revocation and quarantine review.

Session-pepper rotation invalidates cloud sessions and requires re-login. Database credential rotation is coordinated between secret store and service connection pool. All rotations require change ticket, two-person approval, timestamps, affected versions, validation, and rollback record.

## Installer and signed updates

- [ ] Legal publisher identity and code-signing certificate acquired.
- [ ] Private signing operation occurs in approved hardware/cloud signing service with MFA and audit; certificate is not copied to developer PCs.
- [ ] EXE and update package signatures/timestamps verify on clean supported Windows versions.
- [ ] Immutable update repository/feed uses HTTPS and release manifests with hashes/version/channel/minimum compatible version.
- [ ] Staged promotion: internal → site UAT → one pilot device → remaining pilot devices, with monitoring gates.
- [ ] Update never deletes user data and refuses incompatible local schema downgrade.
- [ ] Previous signed installer/package and release manifest are retained for rollback.
- [ ] SmartScreen/reputation, antivirus, proxy, low-disk, interrupted-download, and update-during-pending-sync cases tested.

## Monitoring and response

- [ ] Cloud alerts: activation attempts, device disabled/revoked access, inbox quarantine/conflict, repeated auth failure, sync age, pending backlog, server errors, database capacity, certificate expiry, backup/restore outcome.
- [ ] Desktop privacy-minimized rotating log: app version/start/stop, migration outcome, login result category, sync start/end/count/status, backup hash/outcome, print result, disk/database error. Never log credentials, device secret, lease token, full patient data, or financial payload.
- [ ] Site support can export logs plus state summary without opening/decrypting patient records.
- [ ] Severity/contact/escalation and response-time matrix approved; clock, disk, network, printer, sync conflict, revoked device, and unknown online outcome have runbooks.
- [ ] Retention, access, redaction, breach handling, and Bangladesh customer contractual requirements are approved.
