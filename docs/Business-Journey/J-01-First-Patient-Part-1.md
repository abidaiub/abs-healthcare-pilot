# J-01 First Patient — Part 1

**Verdict:** PASS after corrective fixes  
**Browser UAT:** 2026-08-01, DPDC / BR-BHL-01, 1920×1080  
**Evidence:** `docs/Business-Journey/evidence/J-01-Part-1/README.md`

## English

The recovered local environment completed the fictional patient journey through registration, appointment/check-in, doctor consultation, finalized prescription, diagnostic billing/payment, lab confirmation, accession generation, barcode labels, and specimen collection.

| Step | Actor | Result | Business identifiers |
|---|---|---|---|
| Patient registration | `dp.reception` | PASS — profile and DOB persisted | Nusrat Jahan, `PT-000009` |
| Appointment and queue | `dp.reception` | PASS — booked 2026-08-01 16:00, token 2, checked in | `AP-000005` |
| Consultation | `dr.kamrul.hasan` | PASS — fictional notes/advice saved and encounter completed | `EN-000004` |
| Prescription | `dr.kamrul.hasan` | PASS — CBC, TSH, Free T4 finalized in version 1 and print preview | `RX-000004` |
| Billing/payment | `dp.billing` | PASS — gross 2,500; discount 125; net/paid 2,375; due 0 | `INV-000004`, `RCP-000006` |
| Lab confirmation | `dp.collection` | PASS — two specimen-group accessions created | `LAB-000004`, `ACC-000011`, `ACC-000012` |
| Collection | `dp.collection` | PASS — EDTA and Plain Tube specimens collected | Order status `Collected` |

### Defects found and corrected

- `J01-P1-D001`: patient DOB could be omitted when controlled state lagged the native form. Submission now reads native `FormData`; browser verification asserts DOB.
- `J01-P1-D002`: edit route imported a pure mapper from a client module and crashed. The mapper/types were moved to a server-safe library.
- `J01-P1-D003`: appointment date-only values crossed the local/UTC boundary and displayed one day early. Date-only parsing, comparison, schedule lookup, and display now use UTC-safe semantics; `AP-000004` was cancelled as an auditable pre-fix record.
- `J01-P1-D004`: doctor worklist used local-day boundaries and omitted the checked-in patient. Consultation day bounds now use UTC.

No real patient data, diagnosis, or direct SQL mutation was used. Part 2 was not started.

## বাংলা

লোকাল Node পরিবেশ পুনরুদ্ধারের পর কাল্পনিক রোগী Nusrat Jahan-এর Part 1 যাত্রা সম্পন্ন হয়েছে। `PT-000009` নিবন্ধন, `AP-000005` অ্যাপয়েন্টমেন্ট ও টোকেন 2, `EN-000004` কনসালটেশন, `RX-000004` প্রেসক্রিপশন, `INV-000004` বিল ও পূর্ণ পেমেন্ট, `LAB-000004` নিশ্চিতকরণ এবং `ACC-000011`/`ACC-000012` নমুনা সংগ্রহ ব্রাউজারে যাচাই করা হয়েছে। মোট বিল BDT 2,500, অনুমোদিত ছাড় BDT 125, পরিশোধ BDT 2,375 এবং বকেয়া BDT 0। পাওয়া চারটি ত্রুটি সংশোধন করে সংশ্লিষ্ট ধাপ পুনরায় PASS করা হয়েছে। কোনো বাস্তব রোগীর তথ্য ব্যবহার করা হয়নি এবং Part 2 শুরু করা হয়নি।
