# Local Dev PC Publish Guide

Audit date: 2026-08-04 (Asia/Dhaka)

This guide applies only to the ABSHealthcareLite Next.js pilot repository. It does not authorize public exposure, router changes, or use of real patient data.

## Verified environment

| Item | Verified value or status |
| --- | --- |
| Repository | `D:\Al Baraka Soft\ABS_ERP_Cursour AI\ABSHealthCareLite\abs-healthcare-pilot` |
| Branch / audited HEAD | `main` / `e4c14002cf786e40638c98f302027a6991dde2b1` |
| Node.js / npm | `v20.19.5` / `10.8.2` |
| Next.js | `16.2.9` |
| LAN adapter | `Ethernet` — Intel(R) Ethernet Connection (14) I219-V |
| LAN IPv4 | `192.168.0.190/24` (private, manually configured) |
| Default gateway | `192.168.0.1` |
| Application binding | `0.0.0.0:3000` |
| Local URL | `http://localhost:3000/login` |
| LAN URL | `http://192.168.0.190:3000/login` |
| Candidate public IP | `202.5.51.137` — not assigned to this PC and not the current direct public egress |
| Current direct Ethernet public IP | `202.5.54.137` at audit time; static status is not established |
| Active VPN egress | `59.153.17.81` or `59.153.18.18` during the audit |

The PC has a private LAN address behind the gateway, so NAT is present. A direct, adapter-bound public-IP check reported `202.5.54.137` consistently through three independent endpoints. The direct route showed the LAN gateway followed by a public ISP hop, with no private or `100.64.0.0/10` carrier-NAT hop. This is evidence against conventional CGNAT, but CGNAT is not conclusively excluded until the router WAN address is inspected and confirmed to equal `202.5.54.137`.

The candidate `202.5.51.137` belongs to APNIC allocation `202.5.51.0/24` (`BBTS-BD-BD`). It is different from the verified current direct address. Do not publish or configure DNS/port forwarding for the candidate address.

## Production build and publisher

The audited production pipeline passed without bypasses:

- Prisma schema validation: PASS
- Prisma Client 7.8.0 generation: PASS
- Standalone `tsc --noEmit`: PASS
- Next.js production compile: PASS
- Next.js build TypeScript phase: PASS
- Static generation: PASS, 84 of 84 pages generated
- PostgreSQL `SELECT 1`: PASS

The repository's declared production command is `npm run start` (`next start`). The local QC publisher invokes the equivalent Next.js production CLI with `--hostname 0.0.0.0 --port 3000`. Next.js warns that this project also has `output: "standalone"`; the current command is functional and served all tested assets, but migration to the standalone `server.js` packaging workflow is a known follow-up.

Use the repository-root publisher:

```powershell
.\publish-local-qc.ps1 -Action Start
.\publish-local-qc.ps1 -Action Status
.\publish-local-qc.ps1 -Action Restart -SkipBuild
.\publish-local-qc.ps1 -Action Stop
```

The script:

- validates the repository identity;
- loads `.env` through the local `dotenv` package without printing values;
- checks `DATABASE_URL` availability and PostgreSQL connectivity without revealing credentials;
- validates Prisma, generates the client, runs TypeScript, and builds unless `-SkipBuild` is supplied;
- records its own PID, start time, repository, binding, and port under `.local-runtime/qc-publish`;
- refuses to terminate a process that does not match the recorded publisher;
- refuses to start if an unowned process occupies port 3000;
- binds production to `0.0.0.0:3000`;
- verifies `/login`, `/host/login`, `/portal/login`, and `/api/health`;
- displays a public URL only if one is explicitly supplied and all required routes pass through it;
- exits non-zero on failures.

Runtime PID and logs are ignored through `/.local-runtime/` in `.gitignore`.

## Port audit

| Port | Audit result | Exposure decision |
| --- | --- | --- |
| TCP 3000 | Production Node server listens on `0.0.0.0` | The only application port eligible for LAN access; public access is not approved |
| TCP 5432 | PostgreSQL listens on `0.0.0.0` | Must not be forwarded or exposed; current firewall rule is unsafe |
| TCP 8081 | Owned by Windows HTTP.sys (PID 4), returns HTTP 500 locally; no pgAdmin process was found | Do not forward; IIS binding identity requires administrator inspection |
| TCP 9229 | No listener | Keep closed |
| TCP 3001 | No listener after the old development server was stopped | Keep closed |
| TCP 6379 | Redis listens on `127.0.0.1` only | Keep loopback-only |
| TCP 80/8080 | Windows HTTP.sys/IIS listeners exist | Outside this publish; do not forward |

Other Windows service/file-sharing ports, including 445 and 139, are listening on local interfaces. The firewall default is block-inbound, but router forwarding for these ports is prohibited.

The approved candidate-IP check found TCP 3000, 5432, 8081, and 9229 unreachable at `202.5.51.137`. Because that address is not the connection's current public address, the result does not verify the actual router or ISP edge. No external port scan was run against `202.5.54.137`; it requires separate user approval.

## Windows Firewall status

The active Ethernet network category is **Public**. All firewall profiles are enabled with `BlockInbound,AllowOutbound` defaults.

Audit result:

- `ABSHealthcareLite Local QC TCP 3000`: not installed; its attempted creation was not approved.
- `PostgreSQL 5432 LAN`: enabled inbound on Domain, Private, and Public profiles from any remote address to TCP 5432. This is unsafe and remains unchanged because firewall mutation was not approved.

Changing the whole Ethernet adapter to Private could activate unrelated IIS or file-sharing rules. The safer LAN-only exception on the current profile is restricted by local IP and source subnet. After the user explicitly approves the exact blast radius, run these commands in an Administrator PowerShell:

```powershell
netsh advfirewall firewall set rule name="PostgreSQL 5432 LAN" new enable=no
netsh advfirewall firewall add rule name="ABSHealthcareLite Local QC TCP 3000" dir=in action=allow protocol=TCP localip=192.168.0.190 localport=3000 remoteip=192.168.0.0/24 profile=public enable=yes edge=no
```

Verify afterward:

```powershell
netsh advfirewall firewall show rule name="ABSHealthcareLite Local QC TCP 3000" verbose
netsh advfirewall firewall show rule name="PostgreSQL 5432 LAN" verbose
```

Remove the application rule immediately when LAN QC ends:

```powershell
netsh advfirewall firewall delete rule name="ABSHealthcareLite Local QC TCP 3000"
```

Do not re-enable the previous broad PostgreSQL rule. If another tool needs database access from the LAN, create a separately reviewed rule limited to a required source host, Private profile, and a defined expiry.

## LAN verification

Verified from the Dev PC:

- `http://localhost:3000/login`: HTTP 200 and rendered in the browser
- `http://localhost:3000/host/login`: HTTP 200 and rendered in the browser
- `http://localhost:3000/portal/login`: HTTP 200 and rendered in the browser
- `http://localhost:3000/api/health`: HTTP 200, application `ok`, database `connected`
- `http://192.168.0.190:3000/login`: HTTP 200 from the Dev PC
- scripts and stylesheet loaded from the LAN host; the page did not redirect to localhost
- browser console: no errors or warnings on the tested login routes

Not yet verified:

- access from a separate device on `192.168.0.0/24`;
- login with a dedicated non-default QC account from that device;
- a database-backed authenticated screen from that device;
- absence of fatal console errors after authentication.

After the firewall rule is explicitly approved and installed, use a second LAN device to open:

```text
http://192.168.0.190:3000/login
```

Use only a dedicated QC account with a rotated password and fictional patient data. Confirm the login page, static assets, authentication, one database-backed screen, and browser console. LAN verification must pass before any public-access work.

## Deployment environment and QC login override

Use `APP_DEPLOYMENT_ENV` (preferred) or legacy `DEPLOYMENT_ENV` to distinguish **local**, **development**, **qc**, **staging**, and **production**. Do not rely on `NODE_ENV` alone — QC production builds may run with `NODE_ENV=production`.

For local/QC tester access without resetting every DPDC staff password, enable the **QC login override** in environment configuration only:

```env
APP_DEPLOYMENT_ENV=qc
QC_LOGIN_OVERRIDE_ENABLED=true
QC_LOGIN_OVERRIDE_PASSWORD=<set directly in .env or secret store — never Git>
QC_LOGIN_OVERRIDE_TENANT_CODES=DPDC
```

Behavior:

- Applies only to **tenant staff login** (`/login`), not Host Admin or patient portal.
- After normal password verification fails, a matching override secret authenticates as the **existing user** with unchanged role, branch, and permissions.
- Default username scope: active `dp.*` staff (optional `QC_LOGIN_OVERRIDE_USERNAMES` list).
- Successful override writes audit event `QC_LOGIN_OVERRIDE_USED` (no password or secret stored).
- Production and misconfiguration **fail closed** at startup when override is enabled incorrectly.

**Doctors Point UAT seed:** `npm run seed:uat:doctors-point` preserves existing staff passwords. Restore seed credentials only with `npm run seed:uat:doctors-point -- --reset-passwords` (blocked when `APP_DEPLOYMENT_ENV=production`).

**Emergency disable:** set `QC_LOGIN_OVERRIDE_ENABLED=false` and restart the app.

Automated verification: `npm run verify:seed:qc-login`

## Public access architecture and test

Public access is **not enabled or approved**. The current production app has no verified public URL.

If the router WAN address is confirmed to be `202.5.54.137` and the ISP confirms inbound service, temporary raw forwarding would technically require:

```text
Approved external TCP port -> 192.168.0.190:3000
```

Do not use raw public HTTP port 3000 as the permanent architecture. The preferred design is:

```text
Internet HTTPS 443
  -> TLS reverse proxy with source restrictions and access logging
  -> ABSHealthcareLite at 192.168.0.190:3000
```

Before a public test, complete all of the following:

1. Harden session integrity and host/tenant authorization.
2. Rotate default/test/temporary credentials and complete approved log cleanup.
3. Confirm router WAN IP, public-IP stability, CGNAT status, and ISP inbound policy.
4. Complete LAN testing from a second device.
5. Install HTTPS with a trusted certificate and define DNS if needed.
6. Restrict source IPs where possible and define an expiry/removal time.
7. Confirm that no router mappings exist for PostgreSQL, pgAdmin/IIS admin ports, Prisma Studio, Node inspector, file shares, or remote-development tools.
8. Obtain explicit approval for the actual public IP and exact external ports before external scans or router changes.

Run the final public test from an actual external network such as mobile data. Check login, TLS, assets, health response, tenant isolation, logs, and the absence of database/admin port exposure. No public browser test was performed during this audit.

## Security restrictions and blockers

Passed checks:

- `.env`, `.env.example`, and `package.json` returned HTTP 404.
- No source maps exist under the publicly served `.next/static` tree.
- The health endpoint exposes service/database state and a timestamp, but no credentials.
- Prisma Studio and pgAdmin processes were not found.
- Node inspector TCP 9229 is closed.
- Production runtime logs contained no matches for secret-related keywords during the audit.
- Password verification uses salted `scrypt` and timing-safe comparison.

Public-access blockers:

- The staff/host session cookie contains unsigned JSON session context. It can be forged client-side and is not adequate evidence of host or tenant authorization.
- The staff/host session cookie lacks the `Secure` attribute.
- Login-attempt tracking also uses an unsigned client-controlled cookie, so it can be reset or manipulated and is not a reliable Internet-facing rate limit.
- Demo/default credential material exists in pilot source and must not be accepted for public access.
- An existing development log contains a temporary/default credential value. Do not reproduce it; rotate the credential and perform cleanup only under separate authorization.
- The broad PostgreSQL firewall allow rule remains enabled.
- LAN access from another device and authenticated tenant isolation are unverified.
- The public IP is not confirmed static, CGNAT is not conclusively excluded, and no HTTPS reverse proxy is configured.

Use fictional patient data only. Do not expose the Host login or any tenant workflow to the Internet until session integrity, rate limiting, credentials, tenant isolation, and firewall/network controls have passed a separate security review.

## Shutdown and rollback

Stop only the recorded ABSHealthcareLite publisher:

```powershell
.\publish-local-qc.ps1 -Action Stop
```

Confirm it is stopped:

```powershell
.\publish-local-qc.ps1 -Action Status
```

If the LAN firewall rule was later approved and installed, remove it from an Administrator PowerShell:

```powershell
netsh advfirewall firewall delete rule name="ABSHealthcareLite Local QC TCP 3000"
```

Remove any router forward, reverse-proxy route, temporary DNS entry, and TLS binding created for QC. Keep PostgreSQL, pgAdmin/IIS administration, Prisma Studio, debug ports, file shares, and remote-development tools unforwarded.

## Audit verdict

**PARTIAL PASS — NETWORK CONFIGURATION REQUIRED**

The production build and same-PC browser checks pass. Second-device LAN access is pending explicit firewall approval and testing. Public access is blocked by the mismatched candidate IP, unverified router/CGNAT/static-IP state, lack of TLS/reverse proxy, the unsafe database firewall rule, credential/log findings, and forgeable session state.
