# Supplementary Manual QC — MOD-01A Tenant Locale Profile

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Parent pack** | `001-CompanyTenant-Manual-QC-v1.0.md` |
| **Scope** | MOD-01A regional profile only |
| **Credentials** | Host: `admin.abs` / `Host@2026!` |

Run these cases after MOD-01 baseline manual QC or as an addendum before MOD-06/MOD-07.

---

## ML-01A-01 — Bangladesh default suggestion on create

1. Host → Tenants → Create tenant.
2. Select **Bangladesh** in Country/region.
3. Without editing other locale fields, observe suggestions.

**Expected:** Primary `bn-BD`, additional `en-BD`, timezone `Asia/Dhaka`, currency `BDT`, text direction LTR preview.

---

## ML-01A-02 — Administrator override before save

1. On create form, select Bangladesh.
2. Change primary language to **English (Bangladesh)**.
3. Save valid required tenant fields and create.

**Expected:** Tenant saves with `defaultLocale=en-BD`; no error; country remains Bangladesh.

---

## ML-01A-03 — Country change confirmation

1. Edit an existing tenant regional profile.
2. Manually change currency or date format.
3. Change country to **Saudi Arabia**.

**Expected:** Confirmation banner appears; suggestions do not overwrite until **Apply suggestions** is clicked.

---

## ML-01A-04 — RTL preview for Arabic

1. Create or edit tenant with country **Saudi Arabia**.
2. Apply suggestions.
3. Set primary language to Arabic.

**Expected:** Text direction preview shows **RTL**.

---

## ML-01A-05 — At least one supported locale

1. Edit tenant regional profile.
2. Attempt to uncheck all additional languages including primary.

**Expected:** At least one language remains checked; form cannot submit zero locales.

---

## ML-01A-06 — Invalid locale rejected server-side

1. Use API or dev tools to PATCH settings with unsupported locale `fr-FR`.

**Expected:** HTTP 400 with validation error; tenant data unchanged.

---

## ML-01A-07 — Cross-tenant settings protection

1. Log in as tenant admin for ABMG.
2. Attempt PATCH `/api/v1/companies/{otherTenantId}/settings`.

**Expected:** HTTP 403 Forbidden.

---

## ML-01A-08 — ABMG migration compatibility

1. After seed, open ABMG tenant edit.
2. Review regional profile section.

**Expected:** Country Bangladesh, primary English (Bangladesh), supported Bangla + English, legacy EN behavior preserved via `en-BD`.

---

## ML-01A-09 — Idempotent seed

1. Run `npm run db:seed` twice.
2. Compare ABMG locale fields.

**Expected:** Identical values after second run.

---

## Evidence checklist

- [ ] Screenshot: Bangladesh create defaults
- [ ] Screenshot: Override to English primary
- [ ] Screenshot: Country change confirmation banner
- [ ] Screenshot: RTL preview (Saudi/Urdu)
- [ ] API 403 evidence for cross-tenant PATCH
- [ ] `npm run verify:mod01a` output attached
