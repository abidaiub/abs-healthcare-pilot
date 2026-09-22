# Phase 3 Windows client operations

Date: 2026-09-22

## Runtime and trust boundary

ABS Lab Lite Desktop uses Electron 44, a fully local HTML/CSS/JavaScript renderer, and `better-sqlite3-multiple-ciphers` with SQLCipher-compatible encryption. The renderer has Node integration disabled, context isolation and Chromium sandboxing enabled, a restrictive CSP, denied permission requests, denied external windows, and no direct database or secret access. A minimal preload bridge exposes named billing operations to the main process.

The SQLite key and device credential are generated independently and encrypted with Electron `safeStorage`, which uses Windows OS protection. The database runs with WAL, full synchronization, in-memory temporary storage, and secure deletion. Backups are copies of the encrypted database and are verified before success is reported. Do not copy an activated database or device identity to another PC and do not place the live SQLite file on a network share.

## Build and install

From `lab-lite/desktop`:

```powershell
npm install --ignore-scripts
node node_modules\electron\install.js
npm run typecheck
npm test
npm run make
```

Run `out/make/squirrel.windows/x64/ABS-Lab-Lite-Setup.exe`. The current development installer is not code-signed; Windows reputation warnings are expected and must not be bypassed for a real pilot. Obtain an organizational code-signing certificate and rebuild/sign before distribution. Squirrel upgrades and uninstall leave Electron `userData` outside the application directory, preserving the database, keys, configuration, and pending outbox. Never delete `userData` as an upgrade or sync repair.

## Activation and offline use

1. A tenant administrator issues a one-time activation code for a specific branch from Cloud Settings. Only one active pilot device is allowed per branch.
2. On the target Windows PC, enter the HTTPS cloud URL, activation code, device label, and the permitted user's current credentials.
3. The server binds the generated device/installation identities to that tenant and branch, returns only the permitted bootstrap data, and signs a bounded authorization lease. Cloud password hashes and cloud session-signing secrets are never copied.
4. After activation, the user can sign in and perform the permitted work without internet until the lease expires. Offline password verification material is locally scrypt-hashed; failures are rate-limited and temporarily locked.
5. Reconnect and use **Synchronize now** regularly. The status area distinguishes network availability, prior cloud reachability, device activation, pending operations, and conflicts.

Immediate revocation cannot be guaranteed while the computer is disconnected. A revoked device is rejected on reconnect; its queued evidence is retained and quarantined for review. A transaction legitimately committed locally before lease expiry may upload after expiry. New writes after lease expiry or suspicious clock rollback are blocked while data and reconnect capability remain available.

## Supported offline scope

- Previously provisioned user sign-in within a valid device-bound lease.
- Authorized patient lookup and patient creation with a bill.
- Authorized catalog/price lookup from the signed catalog version.
- Draft hold, actual form resume, and restart persistence.
- New bill with zero, partial, or full initial payment.
- Stable local receipt reference, A4/A5/POS80/POS58 preview, print, and reprint without reposting.
- Device/branch local collection report with business date/timezone, pending count, last sync, and explicit exclusion of cloud-only collections/refunds.
- Refund and cancellation request capture only.

Subsequent due collection is sent as an online, server-confirmed operation. Cancellation posting, refund approval, and refund payout remain online. Tenant/user/permission/catalog/price administration remains cloud-only.

## Synchronization and conflict policy

The client uses durable, versioned operation envelopes and at-least-once delivery. Patient dependencies precede bills. The server authenticates device plus actor scope, reloads the applicable catalog snapshot and permissions, commits business changes with its inbox acknowledgement, and deduplicates by tenant operation ID plus canonical payload hash. Identical retries return the stored outcome; changed payload reuse becomes a visible conflict. There is no raw SQLite/PostgreSQL replication and no last-write-wins merge for posted finance.

The client applies acknowledgements and downloads in one local transaction before advancing its checkpoint. If a request times out, retain the same operation identity and retry/reconcile it; never create a replacement operation automatically. Patient duplicates are surfaced as conflicts and are not silently merged. Historical bill snapshots are never replaced with current prices.

Client/server contract version mismatch is a hard failure. Preserve the database/outbox, restore network service or install a compatible signed client, and retry. Do not reset the local database.

## Backup, restore, and recovery

- **Backup:** close active posting, select **Encrypted backup**, save to an access-controlled location, and record the displayed SHA-256. The file remains encrypted and is useless without the Windows-protected key material on the activated installation.
- **Restore on the same PC/profile:** exit the client, preserve the current `userData` directory, verify the backup hash, replace only `lab-lite.db` with the verified backup, and restart. The application validates cipher access, integrity, schema compatibility, tenant/branch/device identity, and pending operations before use. Keep the displaced database until reconciliation completes.
- **Lost PC/key or replacement:** an encrypted database alone is not recoverable without its protected key. Disable/revoke the old device in Cloud Settings, retain any recoverable encrypted evidence, activate the replacement PC with a new code, and reconcile the old device's pending/quarantined operations. Never copy the old identity to the replacement.
- **App/process crash:** restart the app. SQLite atomic transactions prevent partial bill/payment/outbox commits; pending envelopes replay idempotently.
- **Interrupted sync or lost acknowledgement:** reconnect and retry. The same operation identity returns the durable cloud acknowledgement without duplicating financial effects.
- **Disk full/write failure:** stop posting, free capacity outside the client data directory, take a verified encrypted backup when possible, then restart. A failed transaction must not be reconstructed manually.
- **Local migration failure:** stop using the device, preserve the entire `userData` directory and logs, revert to the last compatible signed client or restore a verified same-device backup, and escalate with the preserved evidence. Never delete/reset the database.
- **Uninstall/update:** back up first. Confirm the encrypted database and outbox are retained after upgrade. Do not use uninstall as a data-clearing procedure.

## Qualification limits

The automated suite verifies encrypted storage, deterministic financial behavior, restart persistence, backup/restore, authorization expiry, idempotent sync, scope rejection, revocation quarantine, price snapshots, and online due collection. It does not certify an actual Windows reboot, physical printer models/paper cutting, payment gateways, enterprise deployment policy, antivirus allow-listing, or signed-installer reputation. Those remain pilot-entry checks.
