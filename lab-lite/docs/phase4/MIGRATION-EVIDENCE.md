# Migration evidence

Date: 2026-09-22  
Status: **PASS locally / NOT RUN live — BLOCKER**

Local isolated Lab Lite test database applied five checksum-tracked SQL migrations and reported `database=abs_lab_lite_test migrations=5`; all 27 tests then passed. No migration history was rewritten.

Production/QC policy remains:

- Parent application: `npx prisma migrate status`, then `npx prisma migrate deploy`, then status again.
- Lab Lite: `npm run db:migrate`, which verifies the exact expected database identity and checks migration checksums.
- Never use `prisma migrate dev` or `prisma db push` on live pilot data.

Live pre/post status and migration logs are NOT RUN because server authentication and pre-migration backup evidence are unavailable. No live migration was attempted.

Finding P4F-005, **BLOCKER**: live migration status is unknown. Remediation must start with a verified backup and clean approved commit.
