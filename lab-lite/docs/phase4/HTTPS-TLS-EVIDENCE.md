# HTTPS and TLS evidence

Date: 2026-09-22  
Status: **FAIL — BLOCKER**

External-client observations:

- DNS A record: `healthcare.albarakasoft.com` → `202.5.54.132`.
- TCP 80: connection failed within the bounded probe.
- TCP 443: connection failed within the bounded probe.
- HTTP HEAD: timed out after 12 seconds.
- HTTPS HEAD: timed out after 12 seconds.
- Certificate/chain/hostname/renewal: cannot be evaluated because TCP 443 is unreachable.

The checked-in Nginx template limits TLS to 1.2/1.3, redirects HTTP, preserves proxy headers, and uses 120-second sync proxy timeouts. A template is not deployment evidence.

Finding P4F-002, **BLOCKER**: the required public HTTPS endpoint is unavailable. Remediation: verify router/NAT and upstream filtering; install/render/test Nginx; obtain a trusted certificate; test renewal; then repeat from a real external network. Do not expose ports 3000, 3100, 5432, or pgAdmin.
