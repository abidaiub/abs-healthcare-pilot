# Master-seed evidence

Date: 2026-09-22  
Status: **PASS locally / NOT RUN live**

The root `npm run seed:master` calls only the idempotent host diagnostic catalog and global module registry. It does not call the tenant/UAT diagnostic fixture function. Lab Lite `npm run seed:master` calls the versioned catalog seeder. The local suite passed catalog repeatability, preservation of tenant activation/customization, cumulative tier behavior, and structural validation of 725 tests/3,571 fields.

Generic `prisma db seed`, Doctors Point fixtures, browser UAT seed, and print-sample seed remain explicit non-production paths and must not run automatically during QC/pilot deployment.

The live seed is NOT RUN because the server was not authenticated and migrations/backups were not evidenced. When run, capture before/after counts and rerun results without printing patient or secret data.
