# Firewall evidence

Date: 2026-09-22  
Status: **NOT RUN — BLOCKER**

The current effective UFW/nftables, Docker chains, router ACL, and SSH source restrictions could not be read because SSH authentication failed. Prior observation of inactive UFW is not treated as current proof.

Required witnessed sequence: record current SSH source and recovery path; allow approved administration SSH; allow 80 only for redirect/ACME and 443 for pilot traffic; deny public/LAN access to 3000, 3100, 5432, Docker API, and pgAdmin; enable rules; retain the active SSH session; open a second approved SSH session; probe allowed and denied ports from external and LAN clients; record `ufw status verbose` plus upstream ACL evidence.

Finding P4F-003, **BLOCKER**: no effective firewall evidence exists. Do not enable UFW blindly because that can lock out recovery.
