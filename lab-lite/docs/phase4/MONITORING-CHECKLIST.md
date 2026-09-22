# Pilot monitoring checklist

Date: 2026-09-22  
Status: **IMPLEMENTED AS SOURCE / NOT RUN LIVE — BLOCKER**

`deploy/ops/monitor-qc.sh` checks Compose command health, both loopback application health endpoints, both PostgreSQL `pg_isready` checks, public HTTPS, TLS expiry with a 14-day threshold, and root disk usage with an 85% threshold. Failure exits non-zero and writes a privacy-minimized daemon error through syslog. Existing Compose health checks restart failed services according to `unless-stopped` policy.

- [ ] Install the script from an approved commit.
- [ ] Schedule at an approved interval with systemd/operations scheduler.
- [ ] Connect failed exit/journal event to a named on-call destination.
- [ ] Schedule `deploy/ops/backup-qc.sh`; alert on missing/non-zero exit/stale backup.
- [ ] Test app, Lab Lite, PostgreSQL, disk, proxy, certificate, and backup failure alerts.
- [ ] Record alert delivery, acknowledgement, escalation, and recovery time.
- [ ] Review sync/API conflict/quarantine/error counts without patient payload logging.
- [ ] Record retention, access, redaction, and incident owner.

Finding P4F-011, **BLOCKER**: no live scheduler or alert-delivery evidence exists.
