# PostgreSQL backup and restore evidence

Date: 2026-09-22  
Status: **NOT RUN — BLOCKER**

No live PostgreSQL backup was taken in this run because server authentication was unavailable. Therefore no timestamp, live database name, path, non-zero size, SHA-256, off-server copy, or isolated full-restore result can be claimed.

`deploy/ops/backup-qc.sh` now provides a fail-closed operator command for both QC databases. It creates custom-format dumps with restrictive permissions, requires non-zero output, validates that `pg_restore --list` can read each dump, atomically promotes `.partial` files, and writes SHA-256 sidecars. This is implementation evidence only, not a successful live backup.

Before any migration, record: UTC timestamp; Compose project; database/container; volume and mount; dump path/size/hash; custodian; off-server copy; `pg_restore --list`; isolated full restore; migration ledger; tenant/bill/collection/device reconciliation; and sign-off. Never run `docker compose down -v`, volume removal, or prune against pilot data.

Finding P4F-004, **BLOCKER**: recoverable live-server backup/restore evidence is absent.
