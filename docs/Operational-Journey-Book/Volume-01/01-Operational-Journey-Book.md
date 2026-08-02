# ABSHealthcareLite Operational Journey Book

## Volume 01 - The First Patient

### From Tenant Deployment to Successful Treatment

**Browser Proven. Evidence Driven.**

This book follows one fictional patient, Nusrat Jahan (`PT-000009`), through Doctors Point Diagnostic Center - Bhola Main Branch. It is an operational story: who acted, why the action mattered, what ABSHealthcareLite returned, and how browser UAT proved the outcome.

## Foreword

A healthcare platform earns trust at the hand-offs: receptionist to doctor, doctor to billing, collection to laboratory, laboratory to verifier, release desk to patient, and patient back to doctor. J-01 proves those hand-offs on one continuous record. No screenshots or outcomes in this volume were invented.

## Journey Summary

Nusrat arrived, registered, entered the doctor queue, completed consultation, paid for three investigations, provided two correctly labelled specimens, received verified and released results, downloaded her report through the patient portal, and returned for a version-controlled follow-up prescription.

## Chapters

1. Doctors Point Diagnostic Center
2. Tenant Deployment and Operational Readiness
3. Reception
4. Appointment and Queue
5. Consultation
6. Billing
7. Collection
8. Laboratory
9. Verification
10. Release
11. Patient Portal
12. Doctor Follow-up
13. Journey Complete

## Evidence rule

Every image is an original browser capture from J-01 Parts 1-3. Each screenshot page records the business goal, actor, route, system response, module, evidence ID, Browser UAT outcome and QC status. Read-only database verifiers supplement controls that have no dedicated UI; they never replace browser evidence or modify clinical data.

## Appendix summary

- Browser UAT: PASS after documented corrective fixes.
- Regression: DPDC, MOD-19 and MOD-24 verifiers passed.
- Known build caveat: an unrelated temporary script imports Prisma Client from the wrong generated location.
- Clinical content: fictional UAT data only; not medical advice.
