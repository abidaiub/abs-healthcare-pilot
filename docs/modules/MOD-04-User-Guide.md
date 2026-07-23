# MOD-04 Audit Center — User Guide

**Audience:** Tenant administrators and compliance reviewers

## Opening Audit Center

1. Sign in with a tenant account that has audit access (typically **Primary Tenant Admin**).
2. Go to **Settings → Audit Center** (`/settings/audit`).

## Searching and filtering

Use the filter bar to narrow results:

- **Search** — username, entity type, entity ID, or action text
- **Date from / to** — limit to a date range
- **Branch** — events tied to a specific branch
- **User** — actions performed by one staff member
- **Action** — INSERT, UPDATE, DELETE, LOGIN, VIEW, PRINT, etc.
- **Entity** — User, Role, Branch, Tenant, PermissionMatrix, …
- **Module** — group entities by MOD-01 / MOD-02 / MOD-03 / MOD-04

Results are paginated (25 per page by default).

## Viewing details

Click **View** on any row to open the detail panel. When old and new values were captured, they appear in a field comparison table.

Opening a detail record creates a self-audit VIEW entry (who viewed which audit row).

## Exporting

Click **Export CSV** to download the currently filtered result set. Export requires print permission on Audit Center.

## What you cannot do

Audit records are **read-only**. There is no delete or edit function in the UI.

## If access is denied

Contact your tenant administrator to grant **Audit Center** permissions on your role via **Roles & Permissions → Permission matrix**.
