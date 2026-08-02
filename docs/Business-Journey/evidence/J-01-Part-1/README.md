# Journey J-01 Part 1 — Browser UAT Evidence

**Verdict:** PASS after corrective fixes  
**Run date:** 2026-08-01  
**Context:** DPDC / Doctors Point Diagnostic Center – Bhola Main Branch (`BR-BHL-01`)  
**Viewport:** 1920×1080

The environment was recovered with Node 20.19.5 and npm 10.8.2 using a clean `npm ci`. The original `node_modules.corrupt-20260801-085726` and displaced partial tree `node_modules.partial-20260801-115718` are preserved and ignored by Git. Prisma Client generated successfully; `/api/health` returned database connected.

| Evidence | Verified outcome |
|---|---|
| 01–04 | Reception login; fictional patient form; `PT-000009` creation; profile with DOB 1991-04-20 |
| 05–09 | `AP-000005` on 2026-08-01 16:00; token 2; check-in; doctor worklist visibility |
| 10–14 | `EN-000004`; clinical notes; CBC/TSH/Free T4; finalized `RX-000004`; print preview |
| 15–20 | Prescription-loaded billing; BDT 2,500 gross; BDT 125 discount; BDT 2,375 payment; paid invoice; `RCP-000006` cash memo |
| 21–23 | `LAB-000004` draft, confirmation, and `ACC-000011` / `ACC-000012` creation |
| 24–30 | Collection form; EDTA and Plain Tube determination; both labels; partial then complete collection; final order status Collected |
| `J01-P1-D001-dob-not-persisted.png` | Pre-fix DOB persistence defect |
| `J01-P1-D003-appointment-date-off-by-one.png` | Pre-fix appointment date-only defect |

Actual filenames are numbered `01-reception-login.png` through `30-lab-order-collected.png`. All screenshots were captured from the in-app browser. The browser assertions observed the Draft → Confirmed → Collected and pending → partial → complete transitions live; because the first 18–30 screenshot writes were not persisted by the browser API, those files were recaptured after completion and therefore show the final auditable state where an earlier filename names a transition. Defects D002 and D004 were transient runtime/data-boundary failures documented in the journey report; their corrected routes are represented by the passing edit/profile and doctor-worklist evidence.

## Audited records

- Patient: `PT-000009` (`cms9zmdst0003ywvyvs7uwht7`)
- Appointment: `AP-000005` (`cmsa01r8d000eywvyrxkef7b8`); cancelled pre-fix record `AP-000004`
- Encounter: `EN-000004` (`cmsa06zd8000iywvyn9gz7kao`)
- Prescription: `RX-000004` (`cmsa08off000rywvyu8n8zt0b`)
- Invoice: `INV-000004` (`cmsa0balp0014ywvy2hs6yhgp`); receipt `RCP-000006`
- Lab order: `LAB-000004` (`cmsa0bacz000zywvy0ojqd5dw`)
- Accessions: `ACC-000011` (EDTA), `ACC-000012` (Plain Tube/serum)
