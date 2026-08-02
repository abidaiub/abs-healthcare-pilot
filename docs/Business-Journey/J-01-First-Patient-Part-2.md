# J-01 First Patient — Part 2

**Verdict:** PASS after one audited UAT test-data correction  
**Run date:** 2026-08-01  
**Context:** DPDC / BR-BHL-01 / `PT-000009` / `LAB-000004`  
**Evidence:** `docs/Business-Journey/evidence/J-01-Part-2/README.md`

## English

| Step | Business objective and actor | Route/action | Actual output | Module | Browser UAT |
|---|---|---|---|---|---|
| 1 | Receive the two collected specimens — `dp.collection` | `/lab/receipt`; verify identity and receive once | `ACC-000011` and `ACC-000012` received with user/time; removed from receipt queue | MOD-21 | PASS |
| 2 | Route specimens to their sections — `dp.tech.haem`, `dp.tech.hormone` | `/lab/processing`; mark EDTA and Plain Tube ready | CBC routed to Haematology; TSH/Free T4 routed to Hormone; `dp.report.entry` denied processing | MOD-21 | PASS |
| 3 | Import fictional analyzer results — `dp.report.entry` | `/lab/lis-worklist`; API messages keyed only by accessions | HGB 14.2, WBC 7200, PLT 250000 normal; TSH 6.8 HIGH; FT4 1.2 normal; duplicate control ID blocked | MOD-22/LIS | PASS after D001 correction |
| 4 | Complete result entry without overriding LIS data — `dp.report.entry` | `/lab/result-entry`; review and submit | Three results became READY_FOR_VERIFICATION; unauthorized TSH edit returned `LAB_LIS_OVERRIDE_NOT_PERMITTED` | MOD-22 | PASS |
| 5 | Independently verify results — `dp.verify.doctor` | `/lab/verification`; review and verify each result | Three VERIFIED decisions with verifier, timestamp, and reviewed version | MOD-23 | PASS |
| 6 | Confirm eligibility and authorize reports — `dp.report.delivery` | `/lab/report-release`; prepare then authorize | Due 0; no holds; reports `RPT-0000012`–`RPT-0000014` RELEASED; unauthorized role denied | MOD-24 | PASS |
| 7 | Produce report artifacts and publish — `dp.report.delivery` | Print/PDF/QR/portal actions | TSH PDF download audited; QR privacy valid; all three portal-published; three idempotent report-ready notifications queued | MOD-24/MOD-05 | PASS |

### J01-P2-D001 — corrected UAT payload scale

The first CBC LIS message sent WBC `7.2` and platelets `250` with unit `/cumm`, while the configured DPDC ranges are absolute counts. The system correctly flagged them critical-low and blocked completion. No database edit was used. A second audited analyzer message (`J01P2-CBC-002`) corrected the values to WBC `7200` and platelets `250000`; both recalculated NORMAL. The two historical critical events were acknowledged as part of the correction audit before submission.

Known limitation: the application has no notification-outbox UI. Outbox existence, idempotency, status, attempts, and provider references were verified read-only with `scripts/verify-j01-part2-state.ts`; live SMS delivery was not claimed. Missing `laboratoryLis` and `reportRelease` translations remain visible in some screens. Part 3 was not started.

## বাংলা

| ধাপ | ব্যবসায়িক উদ্দেশ্য ও ব্যবহারকারী | রুট/কাজ | বাস্তব ফল | মডিউল | Browser UAT |
|---|---|---|---|---|---|
| 1 | সংগৃহীত দুই নমুনা গ্রহণ — `dp.collection` | `/lab/receipt`; পরিচয় যাচাই করে একবার গ্রহণ | `ACC-000011` ও `ACC-000012` ব্যবহারকারী/সময়সহ গ্রহণ; পুনরায় গ্রহণের তালিকায় নেই | MOD-21 | PASS |
| 2 | সঠিক বিভাগে নমুনা পাঠানো — `dp.tech.haem`, `dp.tech.hormone` | `/lab/processing`; নমুনা ready করা | CBC Haematology এবং TSH/Free T4 Hormone বিভাগে; `dp.report.entry` processing-এ নিষিদ্ধ | MOD-21 | PASS |
| 3 | কাল্পনিক LIS ফল আমদানি — `dp.report.entry` | `/lab/lis-worklist`; accession-ভিত্তিক API message | CBC স্বাভাবিক; TSH 6.8 HIGH; FT4 স্বাভাবিক; duplicate control ID বন্ধ | MOD-22/LIS | D001 সংশোধনের পর PASS |
| 4 | LIS ফল পরিবর্তন না করে completion — `dp.report.entry` | `/lab/result-entry`; review ও submit | তিনটি ফল READY_FOR_VERIFICATION; অননুমোদিত TSH edit বন্ধ | MOD-22 | PASS |
| 5 | স্বাধীন verification — `dp.verify.doctor` | `/lab/verification`; তিনটি ফল verify | verifier, সময় ও version-সহ তিনটি VERIFIED সিদ্ধান্ত | MOD-23 | PASS |
| 6 | eligibility ও report authorization — `dp.report.delivery` | `/lab/report-release`; prepare ও authorize | বকেয়া 0, কোনো hold নেই; `RPT-0000012`–`RPT-0000014` RELEASED; অননুমোদিত role নিষিদ্ধ | MOD-24 | PASS |
| 7 | print/PDF/QR ও portal publish — `dp.report.delivery` | report artifact ও publish action | PDF audit, privacy-safe QR, তিনটি portal publish এবং তিনটি idempotent notification | MOD-24/MOD-05 | PASS |

`J01-P2-D001`-এ প্রথম CBC message-এ `/cumm` unit-এর সঙ্গে ভুল scale ব্যবহৃত হয়েছিল। সিস্টেম critical-low flag ও completion block করে সঠিক নিরাপত্তা আচরণ দেখিয়েছে। নতুন audited LIS message-এ WBC `7200` ও platelet `250000` দিয়ে ফল NORMAL করা হয়েছে; কোনো সরাসরি database edit করা হয়নি। Notification outbox-এর UI নেই, তাই read-only verifier দিয়ে তা যাচাই করা হয়েছে। Part 3 শুরু করা হয়নি।
