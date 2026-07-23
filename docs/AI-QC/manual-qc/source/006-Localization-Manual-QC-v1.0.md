# Manual QC — MOD-06 Localization v1.0

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Credentials** | See `001-QC-Credentials.txt` |

---

## UAT-01 Tenant default locale on login

**Preconditions:** ABMG tenant (`en-BD` default, `bn-BD` supported)  
**Role:** `laila.hasan` / `Tenant@2026!`  
**Steps:** Sign in without prior preference.  
**Expected:** UI resolves English (Bangladesh) by default.  
**Screenshot:** Dashboard/sidebar in English.

---

## UAT-02 User language preference override

**Preconditions:** Logged in ABMG user  
**Steps:** Switch language to Bangla via top bar selector.  
**Expected:** Navigation labels change to Bangla; session remains same tenant.  
**Screenshot:** Bangla sidebar.

---

## UAT-03 Preference persists after refresh/login

**Steps:** Refresh browser; sign out/in.  
**Expected:** Bangla preference persists.  
**DB check:** `users.preferred_locale = 'bn-BD'`.

---

## UAT-04 Tenant-supported locale restriction

**Preconditions:** ABMG (no Arabic enabled)  
**Steps:** Attempt cookie/API manipulation to `ar-SA`.  
**Expected:** Fallback to allowed locale; no Arabic UI.

---

## UAT-05 Bangla navigation and common UI

**Locale:** `bn-BD`  
**Expected:** Users/Audit/RBAC nav items translated; Sign out in Bangla.

---

## UAT-06 Arabic RTL shell

**Preconditions:** Tenant with `ar-SA` enabled (seed `ABS01` if present)  
**Expected:** `<html dir="rtl">`; sidebar and forms align RTL.

---

## UAT-07 Arabic to English direction switch

**Steps:** Switch to English from Arabic tenant.  
**Expected:** `dir` returns to `ltr`.

---

## UAT-08 Urdu RTL behavior

**Locale:** `ur-PK` on Urdu-enabled tenant  
**Expected:** RTL layout; readable navigation.

---

## UAT-09 Hindi LTR behavior

**Locale:** `hi-IN` (seed tenant `ABS02` if present)  
**Expected:** LTR layout; Devanagari labels visible.

---

## UAT-10 Localized validation messages

**Steps:** Trigger invalid locale switch or required-field error.  
**Expected:** Localized message from validation namespace.

---

## UAT-11 Localized server error display

**Steps:** Submit invalid RBAC/user form.  
**Expected:** Stable code mapped to localized text where integrated.

---

## UAT-12 Tenant time-zone date display

**Expected:** Audit dates respect tenant timezone/format helpers.

---

## UAT-13 Currency formatting

**Expected:** Amounts use tenant currency code via formatter.

---

## UAT-14 Number formatting

**Expected:** Large numbers formatted per tenant number format.

---

## UAT-15 Invalid locale fallback

**Expected:** Corrupt cookie does not crash app.

---

## UAT-16 Cross-tenant preference protection

**Expected:** User cannot set preference for another tenant membership.

---

## UAT-17 RBAC unchanged after language switch

**Expected:** Restricted routes remain blocked after switching language.

---

## UAT-18 Audit Center localized labels

**Expected:** Audit page title/filters use localized strings.

---

## UAT-19 Mobile layout in RTL

**Expected:** No clipped RTL navigation on mobile width.

---

## UAT-20 Regression MOD-01 through MOD-04

**Expected:** `verify:mod01`, `verify:mod01a`, `verify:mod02`, `verify:mod04` PASS.

---

## Result template

Use `006-Localization-Manual-QC-Result-Template.md`.
