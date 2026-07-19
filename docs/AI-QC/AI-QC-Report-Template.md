# ABSHealthcareLite — AI-QC Report Template

**Instructions:** Copy this template to `docs/AI-QC/reports/NNN-<Module>.md`. Replace all `{placeholders}`. Delete instruction blocks before sign-off.

---

# AI-QC Report — {Module Name}

| Field | Value |
|-------|-------|
| **Report ID** | {NNN}-{Module} |
| **Framework version** | AI-QC v1.0 (Frozen) |
| **Gate / Scope** | {e.g. G0 Foundation, MOD-01 Host, MOD-10 Catalog} |
| **Audit date** | {YYYY-MM-DD} |
| **Auditor** | {Cursor AI / Agent ID} |
| **Branch / commit** | {git branch} @ {short SHA or "working tree"} |
| **Environment** | {local / Docker / LAN — note DB availability} |

---

## 1. Executive Summary

{2–4 sentences: overall health, key pass/fail drivers, verdict preview. No speculation.}

---

## 2. Module Information

| Item | Detail |
|------|--------|
| **Module ID** | {MOD-XX} |
| **Module name** | {from Module Book} |
| **Product Book reference** | {section / page} |
| **Module Book path** | `docs/{NN}-{Module}/` |
| **Routes in scope** | {list routes} |
| **Roles in scope** | {Host Admin, Tenant Admin, …} |
| **Out of scope** | {explicit exclusions} |

---

## 3. Documentation Review

| # | Requirement (source) | Implementation | Result | Evidence |
|---|---------------------|----------------|--------|----------|
| D1 | | | PASS / FAIL / N/A | |
| D2 | | | | |
| D3 | | | | |
| D4 | | | | |
| D5 | | | | |

**Documentation notes:** {gaps, extra pages, naming mismatches}

---

## 4. UI Review

| # | Requirement | Observed UI | Result | Evidence |
|---|-------------|-------------|--------|----------|
| U1 | | | | |
| U2 | | | | |
| U3 | | | | |
| U4 | | | | |
| U5 | | | | |

**UI notes:** {placeholders, layout drift, missing states}

---

## 5. Functional Review

| # | Requirement | Observed behavior | Result | Evidence |
|---|-------------|-------------------|--------|----------|
| F1 | | | | |
| F2 | | | | |
| F3 | | | | |
| F4 | | | | |
| F5 | | | | |

**Functional notes:** {workflow gaps, validation issues}

---

## 6. Database Review

| # | Requirement | Observed behavior | Result | Evidence |
|---|-------------|-------------------|--------|----------|
| DB1 | | | | |
| DB2 | | | | |
| DB3 | | | | |
| DB4 | | | | |
| DB5 | | | | |

**Commands run (if applicable):**

```
{paste commands and summarized output}
```

---

## 7. Security Review

| # | Requirement | Observed behavior | Result | Evidence |
|---|-------------|-------------------|--------|----------|
| S1 | | | | |
| S2 | | | | |
| S3 | | | | |
| S4 | | | | |
| S5 | | | | |

**Automatic-fail rules triggered:** {None / list AF#}

---

## 8. Workflow Review

| # | Requirement | Observed behavior | Result | Evidence |
|---|-------------|-------------------|--------|----------|
| W1 | | | | |
| W2 | | | | |
| W3 | | | | |
| W4 | | | | |
| W5 | | | | |

---

## 9. 30-Point Checklist Summary

| Category | Pass | Fail | N/A | Total applicable |
|----------|------|------|-----|----------------|
| Documentation (D1–D5) | | | | |
| UI (U1–U5) | | | | |
| Functional (F1–F5) | | | | |
| Database (DB1–DB5) | | | | |
| Security (S1–S5) | | | | |
| Workflow (W1–W5) | | | | |
| **Total** | | | | **/30** |

---

## 10. Critical Issues

### {FND-YYYY-NNN} — {Title}

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Check ref** | {D1 / S2 / AF3 / …} |
| **Evidence** | {command output, file:line} |
| **Affected file(s)** | `{path}` |
| **Actual behavior** | |
| **Expected behavior** | |
| **Business risk** | |
| **Recommended fix** | {do not implement during QC} |

---

## 11. Major Issues

### {FND-YYYY-NNN} — {Title}

| Field | Detail |
|-------|--------|
| **Severity** | Major |
| **Evidence** | |
| **Affected file(s)** | |
| **Actual behavior** | |
| **Expected behavior** | |
| **Business risk** | |
| **Recommended fix** | |

---

## 12. Minor Issues

### {FND-YYYY-NNN} — {Title}

| Field | Detail |
|-------|--------|
| **Severity** | Minor |
| **Evidence** | |
| **Affected file(s)** | |
| **Recommended fix** | |

---

## 13. Recommendations

1. {Prioritized recommendation}
2. {…}

---

## 14. Development Completion %

| Area | Estimated completion | Basis |
|------|---------------------|-------|
| Documentation alignment | {%} | |
| UI | {%} | |
| Functional / workflow | {%} | |
| Database | {%} | |
| Security (scoped) | {%} | |
| **Overall module** | **{%}** | |

---

## 15. Manual Verification Required

| Item | Reason |
|------|--------|
| {e.g. Browser login redirect chain} | Cannot verify without running dev server |
| | |

---

## 16. Overall Score

**Score:** {X} / 30 applicable checks PASS

**Automatic-fail triggered:** {Yes — AF# / No}

---

## 17. Final Verdict

| Verdict | Selected |
|---------|----------|
| PASS | ☐ |
| PASS WITH OBSERVATIONS | ☐ |
| FAIL | ☐ |

**Sign-off notes:** {conditions for manual QA handoff, deferred items reference}

---

## Appendix A — Commands Executed

| # | Command | Exit code | Result summary |
|---|---------|-----------|----------------|
| 1 | | | |

---

## Appendix B — Files Reviewed

- `{path}`
- `{path}`

---

## Appendix C — Backlog entries created

| Finding ID | Priority | Status | Backlog link |
|------------|----------|--------|--------------|
| | | Open | `docs/AI-QC/backlog/` |

---

*End of report — AI-QC v1.0*
