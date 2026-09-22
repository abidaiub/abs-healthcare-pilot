# Signed-client rollback procedure

Rollback is a controlled incident action, not a database reset. It is allowed only when the prior signed client supports the current local schema and sync contract.

1. Stop new posting on the affected device. Record app version, device/branch, last successful sync, checkpoint, pending/conflicted/quarantined counts, and incident reason.
2. If safe, synchronize and reconcile. If sync is the defect, preserve the queue unchanged.
3. Close the client. Take a verified encrypted backup and preserve the entire Electron user-data directory with hashes. Do not expose DPAPI-protected material.
4. Verify the approved previous installer signature/hash and written schema/contract compatibility. If an irreversible local migration exists, do not downgrade; reinstall the compatible newer binary instead.
5. Uninstall only the application binaries. Confirm `%APPDATA%\abs-lab-lite-desktop` remains present. Never select or script data removal.
6. Install the approved previous signed version. Start offline first and verify tenant/branch/device, login, latest known receipt, operation identity, report totals, pending queue, and checkpoint.
7. Reconnect and synchronize using existing operation identities. Confirm no duplicate bill/collection and compare local/cloud totals.
8. Print/reprint one synthetic receipt on the certified device, then reopen posting with site-manager approval.
9. Attach installer hashes, backups, logs, before/after reconciliation, reason, approvals, and outcome to the incident record.

## Executed version-only rollback evidence

On 2026-09-22, a temporary 0.1.1 package made from the frozen 0.1.0 source was installed over 0.1.0, then uninstalled and replaced with rebuilt 0.1.0. The installed version returned to `app-0.1.0`. The encrypted synthetic finance fixture retained SHA-256 `8DF7C6FD6B24AE982E4C8B17F13B29856E95786445581279DE2D7264A75E7436`. No schema change was involved; this does not approve rollback across future migrations.
