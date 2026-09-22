# Backup and restore evidence

## Automated full logical drill

The Electron-native test created an encrypted SQLCipher database, bootstrapped a synthetic device, held a draft across store restart, posted a 1000.00 bill with a 400.00 initial collection, synchronized acknowledgements, advanced the checkpoint, created an encrypted backup, verified it with the correct device/key, and reopened it as the restored store.

Assertions passing on 2026-09-22:

- Plain SQLite header absent and wrong-key open rejected.
- Device identity retained.
- Bill operation identity retained.
- Device-qualified printed receipt identity retained.
- Bill, initial collection, current cloud balance, and outbox/ack data retained.
- Synchronization checkpoint retained at `1`.
- Backup verification SHA-256 was produced.

## Installer lifecycle preservation

An encrypted synthetic financial database was copied into the real Electron user-data directory. Its SHA-256 before upgrade, after 0.1.0 → 0.1.1, after uninstall, and after rollback reinstall to 0.1.0 was:

`8DF7C6FD6B24AE982E4C8B17F13B29856E95786445581279DE2D7264A75E7436`

This proves the Squirrel lifecycle did not rewrite that encrypted financial artifact. It does not prove cross-machine DPAPI recovery.

## Recovery boundary

The database backup is deliberately not portable without the OS-protected database key. Same-Windows-profile restore is supported operationally. A lost PC/profile/key requires old-device revocation, preservation/quarantine of any recoverable evidence, replacement activation, and reconciliation; copying the device identity is prohibited. Because the client lacks an operator-safe restore interface and the field drill was not performed by support staff on an activated device, readiness finding P4-008 remains HIGH.

## Mandatory witnessed field drill

1. Stop posting and synchronization; record pending/conflicted counts, checkpoint, device, tenant, branch, app version, DB size, and current receipt.
2. Create encrypted backup and record SHA-256 on two controlled media locations.
3. Close the client and preserve the complete current user-data directory.
4. Restore the backup only on the same Windows profile/device with protected keys intact.
5. Verify cipher/integrity, schema, device scope, operation IDs, receipt IDs, counts/totals, outbox, acknowledgements, and checkpoint.
6. Start client offline, log in, view/reprint the known receipt, then reconnect and synchronize.
7. Compare local/cloud reconciliation and obtain two-person sign-off. Never delete/reset the DB to repair sync.
