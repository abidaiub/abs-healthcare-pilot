# Windows field-UAT checklist

Use only synthetic patients and a dedicated pilot tenant/device. Record Windows edition/build, PC serial/asset tag, operator, observer, timestamps, installer hash, application version, printer models, and evidence filenames. A second person must witness all money and recovery checks.

## Installation and lifecycle

- [ ] Verify installer Authenticode signature, publisher, timestamp, SHA-256, and approved release record.
- [ ] Confirm no earlier ABS Lab Lite installation or user-data directory on the clean test profile.
- [ ] Install without bypassing Windows security warnings.
- [ ] Confirm Start menu entry, single-instance behavior, launch, no external navigation, and correct version.
- [ ] Activate against the production-like HTTPS UAT endpoint and one branch only.
- [ ] Reboot Windows with network disconnected; confirm automatic launch and offline sign-in.
- [ ] Create and hold a draft; close process; reopen; resume exact fields and test selections.
- [ ] Install the next signed candidate over the baseline; verify DB/key/config/outbox hashes and business records.
- [ ] Uninstall; verify encrypted data remains; reinstall; verify login and records.
- [ ] Perform the documented rollback and verify no operation ID or receipt identity changes.

## Native workflow UAT

- [ ] Activation rejects invalid/expired/reused code and non-HTTPS non-loopback URL.
- [ ] Offline login succeeds for provisioned user; five bad attempts lock login; valid login works after controlled expiry.
- [ ] Existing-patient search and selection work with keyboard and mouse.
- [ ] New patient plus bill posts atomically.
- [ ] Zero, partial, full, split, overpayment, discount-limit, repeated-test, and maximum-bill cases behave as specified.
- [ ] The 1000.00 bill with 400.00 payment shows 600.00 due before sync.
- [ ] Draft hold/resume and process restart preserve form state.
- [ ] Receipt preview/reprint never posts another bill and retains the same local receipt.
- [ ] Local report states device/branch, date/timezone, pending count, last sync, and cloud-only exclusions.
- [ ] Refund and cancellation are request-only; no offline reversal/approval/payout is possible.
- [ ] Due collection is unavailable until bill sync and requires server confirmation.
- [ ] Every error is understandable to a Bangladeshi diagnostic-center operator and has a documented recovery action.

## Connectivity, authorization, and reconciliation

- [ ] Disconnect internet during entry, posting, printing, app restart, and report generation.
- [ ] Reconnect and synchronize; confirm one cloud bill, collection 400.00, balance 600.00.
- [ ] Simulate lost acknowledgement and repeat sync; confirm no duplicate bill/collection.
- [ ] Submit same operation ID with changed payload through test harness; confirm visible conflict.
- [ ] Attempt cross-tenant/branch/device operation; confirm rejection and audit evidence.
- [ ] Move clock backward beyond tolerance; confirm writes block and reconnect recovery is clear. Restore correct time immediately.
- [ ] Let lease expire; confirm new financial writes block while existing data remains accessible for recovery.
- [ ] Upload a valid pre-expiry queued bill after expiry; confirm documented acceptance.
- [ ] Revoke device while offline, then reconnect; confirm queue is quarantined and not silently lost or posted.
- [ ] Complete online due 600.00; confirm cloud total 1000.00/balance zero and client refresh zero.
- [ ] Change cloud catalog price after offline issue; confirm issued snapshot/receipt remains unchanged.

## Recovery and sign-off

- [ ] Run encrypted backup, record hash, close app, execute full same-profile restore drill, and reconcile records/outbox/checkpoint.
- [ ] Simulate interrupted sync and app crash; confirm safe retry.
- [ ] Exercise disk-full procedure on a disposable UAT volume without deleting the DB.
- [ ] Confirm support can collect privacy-minimized logs without exposing secrets or patient data.
- [ ] Operator, site manager, technical observer, and product owner sign the acceptance record.
