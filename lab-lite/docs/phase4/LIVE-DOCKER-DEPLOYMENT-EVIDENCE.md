# Live Docker deployment evidence

Date: 2026-09-22  
Target: `abs-system@192.168.2.44`, `~/abs-healthcare-pilot`, branch `main`  
Status: **NOT RUN — BLOCKER**

Source baseline: commit `b49280f` is pushed to GitHub `main`; source-control remediation is PASS. This does not prove the server has pulled or deployed it.

The host answered SSH, but authentication failed with `Permission denied (publickey,password)` in non-interactive mode. No server command, deployment, backup, migration, seed, firewall change, restart, or write was performed.

Repository-side target configuration is present and YAML-parsed: six services, two internal networks, two explicitly named PostgreSQL volumes. Application ports bind to `127.0.0.1`; PostgreSQL publishes no host port; pgAdmin is absent from the pilot Compose definition. Docker is not installed on this development PC, so Docker Compose engine validation and image execution remain NOT RUN.

Required live evidence: authenticated OS/Docker inventory; clean expected commit; rendered Compose without secret disclosure; actual port bindings; volume mount/ownership; health; logs; backup; migrations; seed; reverse proxy; firewall; and post-deployment reconciliation.

Finding P4F-001, **BLOCKER**: live server control/evidence is unavailable. Remediation: supply an authorized SSH key or perform the witnessed runbook with the server custodian.
