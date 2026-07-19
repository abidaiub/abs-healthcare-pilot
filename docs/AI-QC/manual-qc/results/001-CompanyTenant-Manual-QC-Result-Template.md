# MOD-01 Manual QC — Execution Result Template

**Module:** MOD-01 — Company / Tenant Management  
**Template version:** 1.0  
**Default test status:** NOT RUN (do not pre-mark PASS)

---

## 1. Execution Summary

| Field | Value |
|-------|-------|
| Manual QC guide version | 001-CompanyTenant-Manual-QC-v1.0 |
| AI QC reference | `docs/AI-QC/reports/001-Foundation.md` |
| Re-QC reference | `docs/AI-QC/reports/001-Foundation-ReQC-01.md` (PASS 24/30) |
| QC environment URL | `http://<QC_HOST>:3000` |
| Environment type | QC Docker (non-production) |
| Manual tester | ______________________________ |
| QC lead | ______________________________ |
| Test execution date | ______________________________ |
| Application build / image tag | ______________________________ |
| Git commit deployed | ______________________________ |
| Database migration version | ______________________________ |
| Seed executed (Y/N) | ______________________________ |
| Backup reference (pre-test) | ______________________________ |

---

## 2. Environment Verification

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Target is QC, not live production | Confirmed | | NOT RUN |
| `GET /api/health` | `"status":"ok"`, database connected | | NOT RUN |
| Container `abs-healthcare-pilot-app` running | Up / healthy | | NOT RUN |
| Container `abs-healthcare-pilot-db` running | Up / healthy | | NOT RUN |
| Host admin account exists | `admin.abs` | | NOT RUN |
| ABMG tenant exists | `ABMG` | | NOT RUN |
| Tenant admin exists | `laila.hasan` | | NOT RUN |

---

## 3. Test Case Result Summary

| Category | Total | PASS | FAIL | BLOCKED | NOT RUN |
|----------|-------|------|------|---------|---------|
| Authentication (MOD01-AUTH) | 12 | 0 | 0 | 0 | 12 |
| Session isolation (MOD01-ISO) | 7 | 0 | 0 | 0 | 7 |
| Tenant list (MOD01-LIST) | 8 | 0 | 0 | 0 | 8 |
| Tenant create (MOD01-CREATE) | 12 | 0 | 0 | 0 | 12 |
| Tenant edit (MOD01-EDIT) | 6 | 0 | 0 | 0 | 6 |
| Onboarding (MOD01-ONB) | 10 | 0 | 0 | 0 | 10 |
| Status lifecycle (MOD01-STATUS) | 8 | 0 | 0 | 0 | 8 |
| Branch (MOD01-BRANCH) | 10 | 0 | 0 | 0 | 10 |
| Subscription (MOD01-SUB) | 10 | 0 | 0 | 0 | 10 |
| Settings (MOD01-SET) | 8 | 0 | 0 | 0 | 8 |
| Audit (MOD01-AUDIT) | 12 | 0 | 0 | 0 | 12 |
| Security (MOD01-SEC) | 14 | 0 | 0 | 0 | 14 |
| Database (MOD01-DB) | 9 | 0 | 0 | 0 | 9 |
| UI/UX (MOD01-UI) | 18 | 0 | 0 | 0 | 18 |
| Performance observation (MOD01-PERF) | 8 | 0 | 0 | 0 | 8 |
| **TOTAL** | **142** | **0** | **0** | **0** | **142** |

---

## 4. Detailed Test Case Log

Copy rows from the manual QC guide as executed. Example format:

| Test Case ID | Title | Status | Severity if failed | Evidence file(s) | Tester remarks |
|--------------|-------|--------|-------------------|------------------|----------------|
| MOD01-AUTH-001 | Host login accepts valid credentials | NOT RUN | Critical | | |
| MOD01-AUTH-002 | Host login rejects invalid password | NOT RUN | High | | |
| ... | ... | NOT RUN | | | |

*(Continue for all executed cases.)*

---

## 5. Defect Register

| Defect ID | Test Case ID | Summary | Severity | Status | Assigned | Retest |
|-----------|--------------|---------|----------|--------|----------|--------|
| | | | Critical / Major / Minor / Observation | Open | | |

---

## 6. Evidence Index

| Evidence file | Test Case ID | Description |
|---------------|--------------|-------------|
| | | |

Store files under: `docs/AI-QC/manual-qc/evidence/001-CompanyTenant/`

Naming: `MOD01-<TCID>-StepNN.png`, `MOD01-<TCID>-DB.txt`

---

## 7. Performance Observations

| Observation ID | Scenario | Actual time | Acceptable for QC? | Remarks |
|----------------|----------|-------------|--------------------|---------|
| MOD01-PERF-001 | Health check | | | NOT RUN |
| MOD01-PERF-002 | Host login | | | NOT RUN |
| MOD01-PERF-003 | Tenant login | | | NOT RUN |
| MOD01-PERF-004 | Tenant list load | | | NOT RUN |
| MOD01-PERF-005 | Tenant search | | | NOT RUN |
| MOD01-PERF-006 | Create tenant | | | NOT RUN |
| MOD01-PERF-007 | Tenant detail | | | NOT RUN |
| MOD01-PERF-008 | Audit list | | | NOT RUN |

---

## 8. Database Verification Log

| Query | Tenant code / ID used | Result summary | Evidence file | Status |
|-------|----------------------|----------------|---------------|--------|
| Q1 | | | | NOT RUN |
| Q2 | | | | NOT RUN |
| Q9 duplicate check | | | | NOT RUN |

---

## 9. Final Verdict

| Item | Count |
|------|-------|
| Total tests executed | |
| Passed | |
| Failed | |
| Blocked | |
| Not run | |
| Critical defects open | |
| Major defects open | |
| Minor defects open | |

**Manual QC verdict:** ☐ PASS  ☐ PASS WITH OBSERVATIONS  ☐ FAIL  ☐ BLOCKED

**Recommended for UAT:** ☐ Yes  ☐ No

**Recommended to proceed to next module:** ☐ Yes  ☐ No

---

## 10. Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Manual tester | | | |
| QC lead | | | |
| Product owner | | | |

---

*Do not mark Manual QC PASS until exit criteria in Section 13 of the guide are met.*
