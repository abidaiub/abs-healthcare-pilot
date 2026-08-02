# J-01 First Patient — Part 3

**Verdict:** PASS  
**Run date:** 2026-08-02  
**Context:** DPDC / BR-BHL-01 / `PT-000009` / `RX-000004`  
**Evidence:** `docs/Business-Journey/evidence/J-01-Part-3/README.md`

## English

Business objective: complete Nusrat Jahan's existing diagnostic visit without creating another patient, appointment, invoice, or lab order. The patient must retrieve only her released reports and the doctor must preserve the original prescription while recording the fictional follow-up treatment as version 2.

| Step | Actor | Route/action | Expected and actual output | Module | Browser UAT |
|---|---|---|---|---|---|
| Portal access | Patient `PT-000009` | `/portal/login` → `/portal/reports` | Identity verified; only RPT-0000012–14 visible | MOD-30/MOD-24 | PASS |
| Access control | Patient portal | Attempt another patient's release through the portal access query | Result `null`; cross-patient access denied | MOD-30 | PASS |
| Download | Patient portal | Download RPT-0000012 PDF | Correct patient, TSH 6.80 HIGH, verifier, branding and QR; `PDF_DOWNLOAD` audit by `PORTAL:PT-000009` | MOD-24/MOD-30 | PASS |
| Doctor review | `dr.kamrul.hasan` | Previous RX/encounter and `/lab/report-release/{releaseId}/print` | CBC, TSH and Free T4 available; fictional UAT assessment recorded | MOD-19/MOD-24 | PASS |
| Revision | `dr.kamrul.hasan` | `/prescriptions/{id}` → revision editor | RX-000004 v1 preserved/SUPERSEDED; v2 FINALIZED/current; reason retained | MOD-19 | PASS |
| Treatment | `dr.kamrul.hasan` | v2 editor and print | Levothyroxine 50 mcg, 1 tablet OD for 42 days; repeat TSH in 6 weeks | MOD-19 | PASS |
| Completion | Patient and doctor | Version history and read-only verifier | Registration through treatment completed on the same J-01 records | J-01 | PASS |

The patient portal account was not present at the Part 3 baseline. `J01-P3-D001` was resolved through the approved tenant-admin counter-enrollment screen, not by direct database editing. The application has no patient-facing audit or “Journey Complete” record; download access and end-to-end completion were therefore confirmed with UI evidence plus `scripts/verify-j01-part3-state.ts`.

## বাংলা

ব্যবসায়িক উদ্দেশ্য: নতুন রোগী, অ্যাপয়েন্টমেন্ট, ইনভয়েস বা ল্যাব অর্ডার তৈরি না করে নুসরাত জাহানের চলমান ডায়াগনস্টিক ভিজিট সম্পন্ন করা। রোগী শুধু নিজের প্রকাশিত রিপোর্ট দেখবেন এবং ডাক্তার পুরোনো প্রেসক্রিপশন অপরিবর্তিত রেখে ফলো-আপ চিকিৎসা version 2 হিসেবে সংরক্ষণ করবেন।

| ধাপ | ব্যবহারকারী | রুট/কাজ | বাস্তব ফল | মডিউল | Browser UAT |
|---|---|---|---|---|---|
| পোর্টাল | `PT-000009` | `/portal/login` → `/portal/reports` | পরিচয় সঠিক; শুধু RPT-0000012–14 দৃশ্যমান | MOD-30/MOD-24 | PASS |
| নিরাপত্তা | রোগী পোর্টাল | অন্য রোগীর release access query | `null`; অনুমতি প্রত্যাখ্যাত | MOD-30 | PASS |
| ডাউনলোড | রোগী পোর্টাল | RPT-0000012 PDF | রোগী, HIGH flag, verifier, branding, QR সঠিক; audit তৈরি | MOD-24/MOD-30 | PASS |
| ডাক্তার রিভিউ | `dr.kamrul.hasan` | পুরোনো RX/encounter ও report print | CBC, TSH, Free T4 দেখা হয়েছে; fictional UAT assessment রেকর্ড | MOD-19/MOD-24 | PASS |
| প্রেসক্রিপশন | `dr.kamrul.hasan` | revision editor | v1 সংরক্ষিত/SUPERSEDED; v2 FINALIZED/current; কারণ সংরক্ষিত | MOD-19 | PASS |
| চিকিৎসা | ডাক্তার | v2 save/finalize/print | Levothyroxine 50 mcg OD, 42 দিন; 6 সপ্তাহ পরে TSH | MOD-19 | PASS |
| সমাপ্তি | রোগী ও ডাক্তার | history ও read-only verifier | একই J-01 রেকর্ডে সম্পূর্ণ যাত্রা সফল | J-01 | PASS |

Part 3 শুরুতে portal account না থাকায় `J01-P3-D001` ধরা পড়ে। অনুমোদিত tenant-admin enrollment UI দিয়ে এটি সমাধান করা হয়েছে; সরাসরি database edit করা হয়নি। আলাদা “Journey Complete” entity না থাকায় UI evidence ও read-only verifier মিলিয়ে সমাপ্তি নিশ্চিত করা হয়েছে।
