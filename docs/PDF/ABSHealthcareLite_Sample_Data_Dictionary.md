<div style="text-align: center; padding-top: 30%; page-break-after: always;">
  <h1 style="font-size: 4em; margin-bottom: 0;">ABSHealthcareLite</h1>
  <h2 style="font-size: 2.5em; color: #555; margin-top: 10px;">Sample Data Dictionary</h2>
  <div style="margin-top: 100px; font-size: 1.5em; color: #777;">
    <p>Prepared by:</p>
    <p><strong>Al Baraka Soft</strong></p>
  </div>
</div>

## Table of Contents

- [ABSHealthcareLite Sample Data Dictionary](#abshealthcarelite-sample-data-dictionary)
  - [SECTION 1: EXECUTIVE SUMMARY](#section-1-executive-summary)
  - [SECTION 2: SAMPLE ORGANIZATION](#section-2-sample-organization)
  - [SECTION 3: SAMPLE BRANCHES](#section-3-sample-branches)
  - [SECTION 4: SAMPLE DEPARTMENTS](#section-4-sample-departments)
  - [SECTION 5: SAMPLE DOCTORS](#section-5-sample-doctors)
  - [SECTION 6: SAMPLE STAFF](#section-6-sample-staff)
  - [SECTION 7: SAMPLE PATIENTS](#section-7-sample-patients)
  - [SECTION 8: SAMPLE APPOINTMENTS](#section-8-sample-appointments)
  - [SECTION 9: SAMPLE ENCOUNTERS](#section-9-sample-encounters)
  - [SECTION 10: SAMPLE PRESCRIPTIONS](#section-10-sample-prescriptions)
  - [SECTION 11: SAMPLE INVESTIGATION CATALOG](#section-11-sample-investigation-catalog)
  - [SECTION 12: SAMPLE RADIOLOGY CATALOG](#section-12-sample-radiology-catalog)
  - [SECTION 13: SAMPLE PACKAGES](#section-13-sample-packages)
  - [SECTION 14: SAMPLE BILLING DATA](#section-14-sample-billing-data)
  - [SECTION 15: SAMPLE ADMISSIONS](#section-15-sample-admissions)
  - [SECTION 16: SAMPLE NURSING TASKS](#section-16-sample-nursing-tasks)
  - [SECTION 17: SAMPLE LAB REPORTS](#section-17-sample-lab-reports)
  - [SECTION 18: SAMPLE RADIOLOGY REPORTS](#section-18-sample-radiology-reports)
  - [SECTION 19: SAMPLE TELEMEDICINE DATA](#section-19-sample-telemedicine-data)
  - [SECTION 20: SAMPLE AI PRESCRIPTION DATA](#section-20-sample-ai-prescription-data)
  - [SECTION 21: SAMPLE DASHBOARD METRICS](#section-21-sample-dashboard-metrics)
  - [SECTION 22: UI MOCKUP DATA STANDARDS](#section-22-ui-mockup-data-standards)
  - [SECTION 23: TRAINING DATA STANDARDS](#section-23-training-data-standards)
  - [SECTION 24: CONCLUSION](#section-24-conclusion)

<div style="page-break-after: always;"></div>

# ABSHealthcareLite Sample Data Dictionary

---

## SECTION 1: EXECUTIVE SUMMARY

The **ABSHealthcareLite Sample Data Dictionary** is the official repository of standardized, realistic healthcare data to be used across the entire product lifecycle. 

**Purpose:** To eliminate the use of unprofessional placeholders (e.g., "John Doe", "Test Patient 1") and ensure a cohesive, realistic narrative across all visual and training assets.

**Benefits:**
*   **Consistency:** Ensures that a patient seen in a Registration mockup is the same patient seen in the Billing and Pharmacy mockups.
*   **Training:** Provides realistic scenarios for end-user training, helping staff relate to the system.
*   **Sales:** Enhances product demonstrations with professional, culturally relevant data that resonates with prospective clients.
*   **Documentation:** Standardizes user manuals and guides.
*   **Testing:** Provides a baseline dataset for QA and UAT environments.

---

## SECTION 2: SAMPLE ORGANIZATION

*   **Company Name:** Al Baraka Medical Group
*   **Short Code:** ABMG
*   **Type:** Multi-Specialty Hospital & Diagnostic Network
*   **Country:** Bangladesh

---

## SECTION 3: SAMPLE BRANCHES

| Branch Code | Branch Name | Address | Phone | Email |
| :--- | :--- | :--- | :--- | :--- |
| **BR-DHK-01** | Dhaka Central Hospital | 12/A Dhanmondi, Dhaka 1209 | +880 17 0000 0001 | dhaka@albarakamedical.com |
| **BR-CTG-02** | Chattogram Medical Center | 45 GEC Circle, Chattogram 4000 | +880 17 0000 0002 | ctg@albarakamedical.com |
| **BR-BAR-03** | Barishal Diagnostic Institute | 89 Sadar Road, Barishal 8200 | +880 17 0000 0003 | barishal@albarakamedical.com |

---

## SECTION 4: SAMPLE DEPARTMENTS

1.  **Medicine** (Internal Medicine & General Practice)
2.  **Cardiology** (Interventional & Non-Interventional)
3.  **Neurology** (Neuro-medicine & Neuro-surgery)
4.  **Orthopedics** (Trauma & Joint Replacement)
5.  **Gynecology** (Obs & Gynae)
6.  **Pediatrics** (Child Health & Neonatology)
7.  **Dermatology** (Skin & VD)
8.  **ENT** (Ear, Nose, Throat)
9.  **Urology** (Urological Surgery)
10. **Nephrology** (Kidney & Dialysis)
11. **ICU** (Intensive Care Unit)
12. **Emergency** (Casualty & Trauma)
13. **Radiology** (Imaging & Interventional)
14. **Laboratory** (Pathology, Biochemistry, Microbiology)
15. **Pharmacy** (Inpatient & Outpatient)
16. **Billing** (Accounts & Corporate)

---

## SECTION 5: SAMPLE DOCTORS

| Doctor Code | Name | Specialty | Qualification | Chamber Days | Fee (BDT) | Dept |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DR-1001** | Dr. Shafiqul Islam | Internal Medicine | MBBS, FCPS (Medicine) | Sat-Thu | 1000 | Medicine |
| **DR-1002** | Dr. Farhana Rahman | Gynecology | MBBS, DGO, FCPS (Obs & Gynae) | Sun-Thu | 1200 | Gynecology |
| **DR-1003** | Dr. Kazi Tariq | Cardiology | MBBS, MD (Cardiology) | Mon-Wed-Fri | 1500 | Cardiology |
| **DR-1004** | Dr. Ayesha Siddiqa | Pediatrics | MBBS, DCH, FCPS (Pediatrics) | Sat-Thu | 1000 | Pediatrics |
| **DR-1005** | Dr. Hasan Mahmud | Neurology | MBBS, MD (Neurology) | Sun-Tue-Thu | 1500 | Neurology |
| **DR-1006** | Dr. Ruma Begum | Dermatology | MBBS, DDV, MCPS | Sat-Wed | 800 | Dermatology |
| **DR-1007** | Dr. Imran Hasan | Orthopedics | MBBS, MS (Ortho) | Mon-Thu | 1200 | Orthopedics |
| **DR-1008** | Dr. Nazma Khatun | ENT | MBBS, DLO, FCPS (ENT) | Sun-Thu | 1000 | ENT |
| **DR-1009** | Dr. Mahmudur Rahman | Urology | MBBS, MS (Urology) | Sat-Mon-Wed | 1500 | Urology |
| **DR-1010** | Dr. Shirin Sultana | Nephrology | MBBS, MD (Nephrology) | Sun-Tue-Thu | 1200 | Nephrology |
| **DR-1011** | Dr. Anwar Hossain | Critical Care | MBBS, DA, MD (Critical Care) | Roster | N/A | ICU |
| **DR-1012** | Dr. Salma Begum | Emergency Med | MBBS, PGT (Emergency) | Roster | 500 | Emergency |
| **DR-1013** | Dr. Rezaul Karim | Radiology | MBBS, MD (Radiology) | Sat-Thu | N/A | Radiology |
| **DR-1014** | Dr. Mahmuda Khatun | Pathology | MBBS, MPhil (Pathology) | Sat-Thu | N/A | Laboratory |
| **DR-1015** | Dr. Aminul Islam | Internal Medicine | MBBS, MRCP (UK) | Sun-Thu | 1200 | Medicine |
| **DR-1016** | Dr. Tahmina Akter | Gynecology | MBBS, MS (Obs & Gynae) | Sat-Wed | 1000 | Gynecology |
| **DR-1017** | Dr. Jahangir Alam | Cardiology | MBBS, FCPS (Cardiology) | Sun-Tue-Thu | 1500 | Cardiology |
| **DR-1018** | Dr. Sabina Yasmin | Pediatrics | MBBS, FCPS (Pediatrics) | Mon-Thu | 1000 | Pediatrics |
| **DR-1019** | Dr. Mizanur Rahman | Orthopedics | MBBS, D-Ortho | Sat-Wed | 1000 | Orthopedics |
| **DR-1020** | Dr. Rokeya Begum | Dermatology | MBBS, FCPS (Dermatology) | Sun-Thu | 1200 | Dermatology |

---

## SECTION 6: SAMPLE STAFF

*   **Receptionists:** Arif Hossain (EMP-201), Tania Sultana (EMP-202)
*   **Lab Technologists:** Sajedur Rahman (EMP-301), Nipa Akter (EMP-302)
*   **Radiology Technologists:** Kamrul Hasan (EMP-401), Sumi Begum (EMP-402)
*   **Nurses:** RN. Fatema Khatun (EMP-501), RN. Nasrin Jahan (EMP-502), RN. Abdul Alim (EMP-503)
*   **Cashiers:** Tofazzal Hossain (EMP-601), Rina Parvin (EMP-602)
*   **Administrators:** Syed Asif Iqbal (EMP-701), Laila Hasan (EMP-702)

---

## SECTION 7: SAMPLE PATIENTS

| Patient ID | Name | Gender | DOB | Age | Phone | Blood Group | Emergency Contact |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PT-260001** | Mohammad Ali | M | 12-Jan-1975 | 51 | +880 17 1111 0001 | O+ | +880 17 1111 0002 |
| **PT-260002** | Nusrat Jahan | F | 05-Mar-1988 | 38 | +880 17 1111 0003 | B+ | +880 17 1111 0004 |
| **PT-260003** | Rafiqul Islam | M | 22-Aug-1960 | 65 | +880 17 1111 0005 | A+ | +880 17 1111 0006 |
| **PT-260004** | Fatima Begum | F | 15-Nov-1955 | 70 | +880 17 1111 0007 | AB+ | +880 17 1111 0008 |
| **PT-260005** | Tariq Rahman | M | 30-Sep-1992 | 33 | +880 17 1111 0009 | O- | +880 17 1111 0010 |
| **PT-260006** | Sadia Akter | F | 10-Feb-2001 | 25 | +880 17 1111 0011 | B- | +880 17 1111 0012 |
| **PT-260007** | Kamal Hossain | M | 18-Jul-1980 | 45 | +880 17 1111 0013 | A- | +880 17 1111 0014 |
| **PT-260008** | Ayesha Siddiqa | F | 25-Dec-2015 | 10 | +880 17 1111 0015 | O+ | +880 17 1111 0016 |
| **PT-260009** | Hasan Mahmud | M | 04-Apr-1995 | 31 | +880 17 1111 0017 | B+ | +880 17 1111 0018 |
| **PT-260010** | Farhana Chowdhury | F | 14-Oct-1985 | 40 | +880 17 1111 0019 | AB- | +880 17 1111 0020 |
| **PT-260011** | Abdul Karim | M | 02-Jun-1968 | 58 | +880 17 1111 0021 | O+ | +880 17 1111 0022 |
| **PT-260012** | Sumaiya Islam | F | 08-Sep-1998 | 27 | +880 17 1111 0023 | A+ | +880 17 1111 0024 |
| **PT-260013** | Imran Hasan | M | 19-May-1982 | 44 | +880 17 1111 0025 | B+ | +880 17 1111 0026 |
| **PT-260014** | Ruma Begum | F | 27-Jan-1972 | 54 | +880 17 1111 0027 | O- | +880 17 1111 0028 |
| **PT-260015** | Shafiqul Alam | M | 11-Nov-1965 | 60 | +880 17 1111 0029 | AB+ | +880 17 1111 0030 |
| **PT-260016** | Nazma Khatun | F | 03-Mar-1950 | 76 | +880 17 1111 0031 | A- | +880 17 1111 0032 |
| **PT-260017** | Mahmudur Rahman | M | 21-Aug-1990 | 35 | +880 17 1111 0033 | O+ | +880 17 1111 0034 |
| **PT-260018** | Shirin Sultana | F | 16-Feb-1987 | 39 | +880 17 1111 0035 | B- | +880 17 1111 0036 |
| **PT-260019** | Kazi Arif | M | 07-Dec-1978 | 47 | +880 17 1111 0037 | A+ | +880 17 1111 0038 |
| **PT-260020** | Tasnim Rahman | F | 29-Oct-2005 | 20 | +880 17 1111 0039 | O+ | +880 17 1111 0040 |
| **PT-260021** | Golam Mostafa | M | 14-Apr-1962 | 64 | +880 17 1111 0041 | B+ | +880 17 1111 0042 |
| **PT-260022** | Salma Begum | F | 05-Sep-1970 | 55 | +880 17 1111 0043 | AB- | +880 17 1111 0044 |
| **PT-260023** | Rezaul Karim | M | 23-Jun-1985 | 40 | +880 17 1111 0045 | O- | +880 17 1111 0046 |
| **PT-260024** | Mahmuda Khatun | F | 12-Nov-1958 | 67 | +880 17 1111 0047 | A+ | +880 17 1111 0048 |
| **PT-260025** | Anwar Hossain | M | 01-Mar-1975 | 51 | +880 17 1111 0049 | B- | +880 17 1111 0050 |
| **PT-260026** | Rina Akter | F | 18-Aug-1993 | 32 | +880 17 1111 0051 | O+ | +880 17 1111 0052 |
| **PT-260027** | Shahin Alam | M | 09-Jan-1988 | 38 | +880 17 1111 0053 | A- | +880 17 1111 0054 |
| **PT-260028** | Farida Yasmin | F | 26-Oct-1965 | 60 | +880 17 1111 0055 | AB+ | +880 17 1111 0056 |
| **PT-260029** | Aminul Islam | M | 15-May-1972 | 54 | +880 17 1111 0057 | O+ | +880 17 1111 0058 |
| **PT-260030** | Tahmina Akter | F | 04-Dec-1980 | 45 | +880 17 1111 0059 | B+ | +880 17 1111 0060 |
| **PT-260031** | Jahangir Alam | M | 22-Feb-1960 | 66 | +880 17 1111 0061 | A+ | +880 17 1111 0062 |
| **PT-260032** | Sabina Yasmin | F | 11-Jul-1995 | 30 | +880 17 1111 0063 | O- | +880 17 1111 0064 |
| **PT-260033** | Mizanur Rahman | M | 30-Sep-1983 | 42 | +880 17 1111 0065 | AB- | +880 17 1111 0066 |
| **PT-260034** | Rokeya Begum | F | 17-Apr-1952 | 74 | +880 17 1111 0067 | B- | +880 17 1111 0068 |
| **PT-260035** | Asif Iqbal | M | 06-Nov-1990 | 35 | +880 17 1111 0069 | O+ | +880 17 1111 0070 |
| **PT-260036** | Nargis Parvin | F | 25-Jan-1978 | 48 | +880 17 1111 0071 | A- | +880 17 1111 0072 |
| **PT-260037** | Habibur Rahman | M | 14-Aug-1968 | 57 | +880 17 1111 0073 | B+ | +880 17 1111 0074 |
| **PT-260038** | Laila Hasan | F | 03-May-1985 | 41 | +880 17 1111 0075 | O+ | +880 17 1111 0076 |
| **PT-260039** | Moniruzzaman | M | 21-Oct-1970 | 55 | +880 17 1111 0077 | AB+ | +880 17 1111 0078 |
| **PT-260040** | Ferdousi Begum | F | 10-Mar-1963 | 63 | +880 17 1111 0079 | A+ | +880 17 1111 0080 |
| **PT-260041** | Saiful Islam | M | 28-Jul-1992 | 33 | +880 17 1111 0081 | O- | +880 17 1111 0082 |
| **PT-260042** | Shahana Parvin | F | 16-Dec-1988 | 37 | +880 17 1111 0083 | B- | +880 17 1111 0084 |
| **PT-260043** | Rubel Hossain | M | 05-Jun-1981 | 44 | +880 17 1111 0085 | A- | +880 17 1111 0086 |
| **PT-260044** | Afroza Khatun | F | 24-Feb-1956 | 70 | +880 17 1111 0087 | O+ | +880 17 1111 0088 |
| **PT-260045** | Nazmul Huda | M | 13-Sep-1976 | 49 | +880 17 1111 0089 | AB- | +880 17 1111 0090 |
| **PT-260046** | Jesmin Akter | F | 02-Apr-1998 | 28 | +880 17 1111 0091 | B+ | +880 17 1111 0092 |
| **PT-260047** | Tofazzal Hossain | M | 20-Nov-1965 | 60 | +880 17 1111 0093 | O+ | +880 17 1111 0094 |
| **PT-260048** | Sharmin Sultana | F | 09-Aug-1983 | 42 | +880 17 1111 0095 | A+ | +880 17 1111 0096 |
| **PT-260049** | Abu Bakar | M | 27-Jan-1950 | 76 | +880 17 1111 0097 | O- | +880 17 1111 0098 |
| **PT-260050** | Halima Khatun | F | 15-May-1974 | 52 | +880 17 1111 0099 | B- | +880 17 1111 0100 |

---

## SECTION 8: SAMPLE APPOINTMENTS

| Appt ID | Patient | Doctor | Date | Time | Reason | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **APT-001** | Mohammad Ali | Dr. Shafiqul Islam | 15-Jun-2026 | 10:00 AM | Routine Checkup | Completed |
| **APT-002** | Nusrat Jahan | Dr. Farhana Rahman | 15-Jun-2026 | 10:15 AM | Pregnancy Follow-up | Completed |
| **APT-003** | Rafiqul Islam | Dr. Kazi Tariq | 15-Jun-2026 | 10:30 AM | Chest Pain | Completed |
| **APT-004** | Ayesha Siddiqa | Dr. Ayesha Siddiqa | 15-Jun-2026 | 11:00 AM | Fever | Completed |
| **APT-005** | Hasan Mahmud | Dr. Hasan Mahmud | 15-Jun-2026 | 11:15 AM | Migraine | Completed |
| **APT-006** | Sadia Akter | Dr. Ruma Begum | 15-Jun-2026 | 11:30 AM | Skin Rash | Waiting |
| **APT-007** | Kamal Hossain | Dr. Imran Hasan | 15-Jun-2026 | 12:00 PM | Knee Pain | Waiting |
| **APT-008** | Farhana Chowdhury| Dr. Nazma Khatun | 15-Jun-2026 | 12:15 PM | Ear Infection | Waiting |
| **APT-009** | Abdul Karim | Dr. Mahmudur Rahman | 15-Jun-2026 | 12:30 PM | Kidney Stones | Scheduled |
| **APT-010** | Fatima Begum | Dr. Shirin Sultana | 15-Jun-2026 | 02:00 PM | Dialysis Consult | Scheduled |
| **APT-011** | Tariq Rahman | Dr. Shafiqul Islam | 16-Jun-2026 | 09:00 AM | High BP | Scheduled |
| **APT-012** | Sumaiya Islam | Dr. Tahmina Akter | 16-Jun-2026 | 09:30 AM | PCOS Consult | Scheduled |
| **APT-013** | Imran Hasan | Dr. Jahangir Alam | 16-Jun-2026 | 10:00 AM | Palpitations | Scheduled |
| **APT-014** | Ruma Begum | Dr. Sabina Yasmin | 16-Jun-2026 | 10:30 AM | Child Vaccination | Scheduled |
| **APT-015** | Shafiqul Alam | Dr. Mizanur Rahman | 16-Jun-2026 | 11:00 AM | Back Pain | Scheduled |
| **APT-016** | Nazma Khatun | Dr. Rokeya Begum | 16-Jun-2026 | 11:30 AM | Acne | Scheduled |
| **APT-017** | Mahmudur Rahman | Dr. Aminul Islam | 17-Jun-2026 | 09:00 AM | Diabetes Follow-up| Scheduled |
| **APT-018** | Shirin Sultana | Dr. Farhana Rahman | 17-Jun-2026 | 09:30 AM | Antenatal Care | Scheduled |
| **APT-019** | Kazi Arif | Dr. Kazi Tariq | 17-Jun-2026 | 10:00 AM | Post-CABG Review | Scheduled |
| **APT-020** | Tasnim Rahman | Dr. Ayesha Siddiqa | 17-Jun-2026 | 10:30 AM | Viral Fever | Scheduled |

---

## SECTION 9: SAMPLE ENCOUNTERS

| Encounter ID | Patient | Chief Complaint | Diagnosis (ICD-10) | Plan |
| :--- | :--- | :--- | :--- | :--- |
| **ENC-001** | Mohammad Ali | Fever and chills for 3 days | Viral Fever (B34.9) | Prescribe antipyretics, advise rest. |
| **ENC-002** | Rafiqul Islam | Chest pain radiating to left arm | Angina Pectoris (I20.9) | Admit to ICU, order ECG and Troponin I. |
| **ENC-003** | Nusrat Jahan | Missed period, nausea | Pregnancy (Z32.01) | Prescribe Folic Acid, order USG. |
| **ENC-004** | Kamal Hossain | Severe right knee pain | Osteoarthritis (M19.9) | Prescribe NSAIDs, order X-Ray Right Knee. |
| **ENC-005** | Hasan Mahmud | Throbbing headache, photophobia | Migraine (G43.9) | Prescribe Sumatriptan, advise dark room. |
| **ENC-006** | Sadia Akter | Itchy red rash on arms | Contact Dermatitis (L23.9) | Prescribe topical corticosteroids. |
| **ENC-007** | Farhana Chowdhury| Ear pain, discharge | Otitis Media (H66.9) | Prescribe oral antibiotics, ear drops. |
| **ENC-008** | Abdul Karim | Flank pain, hematuria | Renal Calculus (N20.0) | Order CT KUB, prescribe analgesics. |
| **ENC-009** | Fatima Begum | Swelling in legs, fatigue | CKD Stage 4 (N18.4) | Adjust renal diet, schedule dialysis. |
| **ENC-010** | Ayesha Siddiqa | High fever, cough | Bronchitis (J40) | Prescribe pediatric antibiotics, cough syrup. |

---

## SECTION 10: SAMPLE PRESCRIPTIONS

| Rx ID | Patient | Medicines | Dose | Frequency | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RX-001** | Mohammad Ali | Tab. Napa Extend 665mg | 1 Tablet | 1-1-1 (After Meal) | 5 Days |
| **RX-002** | Rafiqul Islam | Tab. Eco-Aspirin 75mg | 1 Tablet | 0-1-0 (After Meal) | Continue |
| **RX-003** | Nusrat Jahan | Tab. Folson 5mg | 1 Tablet | 1-0-0 (After Meal) | 1 Month |
| **RX-004** | Kamal Hossain | Tab. Naproxen 500mg | 1 Tablet | 1-0-1 (After Meal) | 7 Days |
| **RX-005** | Hasan Mahmud | Tab. Triptin 50mg | 1 Tablet | SOS (When needed) | 3 Days |
| **RX-006** | Sadia Akter | Oint. Dermasol 0.05% | Apply | 0-0-1 (Night) | 14 Days |
| **RX-007** | Farhana Chowdhury| Cap. Amoxicillin 500mg | 1 Capsule| 1-1-1 (After Meal) | 7 Days |
| **RX-008** | Abdul Karim | Tab. Rolac 30mg | 1 Tablet | 1-0-1 (After Meal) | 5 Days |
| **RX-009** | Fatima Begum | Tab. Seclo 20mg | 1 Tablet | 1-0-1 (Before Meal)| 14 Days |
| **RX-010** | Ayesha Siddiqa | Syr. Fexo 120mg/5ml | 1 Spoon | 1-0-1 (After Meal) | 5 Days |

---

## SECTION 11: SAMPLE INVESTIGATION CATALOG

*Prices in BDT (Bangladeshi Taka)*

**Hematology**
1. Complete Blood Count (CBC) - 400
2. ESR - 150
3. Blood Group & Rh Factor - 200
4. Prothrombin Time (PT) - 600
5. APTT - 650
6. D-Dimer - 1500
7. Peripheral Blood Film (PBF) - 500
8. Hemoglobin (Hb) - 150
9. Platelet Count - 200
10. Reticulocyte Count - 300

**Biochemistry**
11. Fasting Blood Sugar (FBS) - 150
12. Random Blood Sugar (RBS) - 150
13. HbA1c - 800
14. Lipid Profile - 1000
15. Serum Creatinine - 300
16. Blood Urea - 300
17. Serum Uric Acid - 350
18. SGPT (ALT) - 300
19. SGOT (AST) - 300
20. Serum Bilirubin (Total) - 250
21. Alkaline Phosphatase (ALP) - 350
22. Total Protein - 300
23. Serum Albumin - 300
24. Serum Calcium - 350
25. Serum Electrolytes (Na, K, Cl) - 800
26. Serum Magnesium - 400
27. Serum Phosphorus - 400
28. CRP (C-Reactive Protein) - 600
29. Troponin I - 1200
30. CPK-MB - 800

**Immunology & Serology**
31. TSH - 600
32. FT3 - 600
33. FT4 - 600
34. Dengue NS1 Ag - 700
35. Widal Test - 400
36. VDRL - 350
37. HBsAg - 400
38. Anti-HCV - 600
39. HIV (Screening) - 800
40. Vitamin D (25-OH) - 2000
41. Vitamin B12 - 1500
42. Serum Ferritin - 1000

**Clinical Pathology**
43. Urine R/E - 200
44. Stool R/E - 200
45. Semen Analysis - 800

**Microbiology**
46. Blood Culture & Sensitivity - 1200
47. Urine Culture & Sensitivity - 800
48. Stool Culture & Sensitivity - 800
49. Sputum Culture & Sensitivity - 800
50. Pus Culture & Sensitivity - 800

---

## SECTION 12: SAMPLE RADIOLOGY CATALOG

*Prices in BDT*

**X-Ray**
1. X-Ray Chest PA View - 400
2. X-Ray KUB - 500
3. X-Ray Cervical Spine B/V - 600
4. X-Ray Lumbar Spine B/V - 600
5. X-Ray Both Knee Joints AP/Lat - 800
6. X-Ray Pelvis AP - 500
7. X-Ray PNS (Water's View) - 400
8. X-Ray Shoulder Joint - 500

**Ultrasonography (USG)**
9. USG Whole Abdomen - 1200
10. USG Lower Abdomen - 800
11. USG Upper Abdomen - 800
12. USG Pregnancy Profile - 1000
13. USG KUB - 800
14. USG Thyroid - 1000
15. USG Breast - 1200

**CT Scan**
16. CT Scan Brain (Plain) - 3500
17. CT Scan Brain (Contrast) - 4500
18. CT Scan Chest (HRCT) - 5000
19. CT Scan KUB - 4000
20. CT Angiogram - 12000

**MRI**
21. MRI Brain - 7000
22. MRI Cervical Spine - 7000
23. MRI Lumbar Spine - 7000
24. MRI Pelvis - 7500
25. MRCP - 8000

**Cardiology & Others**
26. ECG - 300
27. Echocardiogram (Color Doppler) - 2000
28. ETT (Exercise Tolerance Test) - 2500
29. EEG - 1500
30. Mammography Both Breasts - 2000

---

## SECTION 13: SAMPLE PACKAGES

1.  **Executive Health Checkup:** CBC, FBS, Lipid Profile, S. Creatinine, SGPT, ECG, X-Ray Chest, USG Whole Abdomen, Doctor Consult. (Price: 4500 BDT)
2.  **Diabetes Care Package:** FBS, HbA1c, S. Creatinine, Urine R/E, Lipid Profile, ECG. (Price: 2500 BDT)
3.  **Cardiac Screening Package:** CBC, Lipid Profile, Troponin I, ECG, Echocardiogram, ETT. (Price: 6000 BDT)
4.  **Women Wellness Package:** CBC, TSH, USG Lower Abdomen, Mammography, Pap Smear. (Price: 5000 BDT)
5.  **Pre-Employment Package:** CBC, Blood Group, HBsAg, Urine R/E, X-Ray Chest, Eye Test. (Price: 1800 BDT)

---

## SECTION 14: SAMPLE BILLING DATA

| Invoice No | Patient | Services | Total | Discount | Payment | Due |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **INV-001** | Mohammad Ali | Consult (Dr. Shafiqul), CBC | 1400 | 0 | 1400 | 0 |
| **INV-002** | Rafiqul Islam | Consult (Dr. Kazi), ECG, Trop I | 3000 | 300 | 2700 | 0 |
| **INV-003** | Nusrat Jahan | Consult (Dr. Farhana), USG Preg | 2200 | 0 | 2200 | 0 |
| **INV-004** | Kamal Hossain | Consult (Dr. Imran), X-Ray Knee | 2000 | 200 | 1800 | 0 |
| **INV-005** | Hasan Mahmud | Consult (Dr. Hasan), MRI Brain | 8500 | 500 | 8000 | 0 |
| **INV-006** | Sadia Akter | Consult (Dr. Ruma) | 800 | 0 | 800 | 0 |
| **INV-007** | Farhana Chy | Consult (Dr. Nazma), CBC | 1400 | 0 | 1000 | 400 |
| **INV-008** | Abdul Karim | Consult (Dr. Mahmudur), CT KUB | 5500 | 500 | 5000 | 0 |
| **INV-009** | Fatima Begum | Consult (Dr. Shirin), S. Creat | 1500 | 0 | 1500 | 0 |
| **INV-010** | Ayesha Siddiqa | Consult (Dr. Ayesha), CBC, CRP | 2000 | 0 | 2000 | 0 |

---

## SECTION 15: SAMPLE ADMISSIONS

| IPD No | Patient | Ward | Room | Bed | Admitting Doctor | Diagnosis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **IPD-001** | Rafiqul Islam | ICU | ICU-A | Bed-01 | Dr. Anwar Hossain | Acute MI |
| **IPD-002** | Abdul Karim | General Male | Ward-M1 | Bed-12 | Dr. Mahmudur Rahman | Renal Calculus |
| **IPD-003** | Fatima Begum | Cabin | Cabin-301 | Bed-01 | Dr. Shirin Sultana | CKD Exacerbation |
| **IPD-004** | Kamal Hossain | Ortho Ward | Ward-O1 | Bed-05 | Dr. Imran Hasan | Knee Replacement |
| **IPD-005** | Nusrat Jahan | Maternity | Ward-G1 | Bed-08 | Dr. Farhana Rahman | Normal Delivery |
| **IPD-006** | Ayesha Siddiqa | Pediatric | Ward-P1 | Bed-03 | Dr. Ayesha Siddiqa | Severe Pneumonia |
| **IPD-007** | Hasan Mahmud | General Male | Ward-M2 | Bed-15 | Dr. Hasan Mahmud | Severe Migraine |
| **IPD-008** | Farhana Chy | ENT Ward | Ward-E1 | Bed-02 | Dr. Nazma Khatun | Mastoiditis |
| **IPD-009** | Mohammad Ali | Cabin | Cabin-405 | Bed-01 | Dr. Shafiqul Islam | Dengue Fever |
| **IPD-010** | Sadia Akter | General Female| Ward-F1 | Bed-10 | Dr. Ruma Begum | Severe Cellulitis |

---

## SECTION 16: SAMPLE NURSING TASKS

*   **Medication Administration:** Administer Inj. Ceftriaxone 1g IV (12-Hourly) to IPD-002.
*   **Vitals:** Check BP, Temp, Pulse, SpO2 for IPD-001 (Hourly).
*   **Procedure Tasks:** Insert Foley Catheter for IPD-004.
*   **Nursing Notes:** "Patient complained of mild chest pain at 02:00 AM. Doctor notified."
*   **Intake/Output:** Record urine output for IPD-003 (Shift-wise).

---

## SECTION 17: SAMPLE LAB REPORTS

**1. Complete Blood Count (CBC)**
*   Hemoglobin: 13.5 g/dL (Normal: 12.0 - 16.0)
*   WBC Count: 8,500 /cumm (Normal: 4,000 - 11,000)
*   Platelets: 250,000 /cumm (Normal: 150,000 - 450,000)

**2. Fasting Blood Sugar (FBS)**
*   Result: 5.6 mmol/L (Normal: 3.9 - 5.5) *[Flag: High]*

**3. HbA1c**
*   Result: 6.2% (Normal: < 5.7%, Prediabetes: 5.7 - 6.4%)

**4. Liver Function Test (LFT)**
*   SGPT (ALT): 45 U/L (Normal: up to 40) *[Flag: High]*
*   Serum Bilirubin: 1.0 mg/dL (Normal: 0.1 - 1.2)

---

## SECTION 18: SAMPLE RADIOLOGY REPORTS

**1. Chest X-Ray PA View**
*   *Findings:* Both lung fields are clear. Cardiac shadow is normal in size and shape. CP angles are clear. Bony thorax is intact.
*   *Impression:* Normal Chest Radiograph.

**2. USG Whole Abdomen**
*   *Findings:* Liver is enlarged in size with increased echotexture. Gallbladder is normal. Kidneys show normal cortical thickness.
*   *Impression:* Fatty Liver Grade I.

**3. CT Scan Brain (Plain)**
*   *Findings:* No acute intracranial hemorrhage. Ventricles are normal. Mild age-related cerebral atrophy noted.
*   *Impression:* Age-related cerebral atrophy. No acute infarct or hemorrhage.

**4. MRI Lumbar Spine**
*   *Findings:* Disc desiccation noted at L4-L5 and L5-S1 levels. Mild posterior disc bulge at L4-L5 indenting the thecal sac.
*   *Impression:* Lumbar Spondylosis with L4-L5 disc bulge.

---

## SECTION 19: SAMPLE TELEMEDICINE DATA

| Session ID | Patient | Doctor | Scheduled Time | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TM-001** | Mohammad Ali | Dr. Shafiqul Islam | 18-Jun-2026 10:00 AM | Completed |
| **TM-002** | Nusrat Jahan | Dr. Farhana Rahman | 18-Jun-2026 10:30 AM | Completed |
| **TM-003** | Tariq Rahman | Dr. Kazi Tariq | 18-Jun-2026 11:00 AM | In Progress |
| **TM-004** | Sadia Akter | Dr. Ruma Begum | 18-Jun-2026 11:30 AM | Waiting |
| **TM-005** | Hasan Mahmud | Dr. Hasan Mahmud | 18-Jun-2026 12:00 PM | Scheduled |

---

## SECTION 20: SAMPLE AI PRESCRIPTION DATA

**Scenario 1: Handwritten OPD Prescription**
*   **Input:** Image of a handwritten script by Dr. Shafiqul Islam.
*   **Expected OCR Output:** "Rx: Tab Napa 500mg 1+1+1 x 5 days. Adv: CBC, Dengue NS1."
*   **Expected Mapping:**
    *   Medication: Paracetamol 500mg (Napa) | Dose: 1-1-1 | Duration: 5 Days.
    *   Investigations: Complete Blood Count, Dengue NS1 Antigen.
    *   Confidence Score: 95%.

---

## SECTION 21: SAMPLE DASHBOARD METRICS

*(For use in Executive Dashboard Mockups)*

*   **Daily Patients (OPD):** 450
*   **Daily Revenue:** 1,250,000 BDT
*   **Active Admissions (IPD):** 85
*   **Discharges Today:** 12
*   **Investigations Ordered:** 1,200
*   **Telemedicine Sessions:** 45
*   **Bed Occupancy Rate:** 78%

---

## SECTION 22: UI MOCKUP DATA STANDARDS

To maintain visual consistency across all mockups, the following formats must be strictly adhered to:

*   **Date Format:** DD-MMM-YYYY (e.g., 15-Jun-2026)
*   **Time Format:** HH:MM AM/PM (e.g., 10:30 AM)
*   **Currency Format:** BDT (e.g., 1,500 BDT or ৳1,500)
*   **Phone Format:** +880 1X XXXX XXXX (e.g., +880 17 1111 0001)
*   **Patient ID Format:** PT-YYMMNNN (e.g., PT-260001)
*   **Doctor Code Format:** DR-NNNN (e.g., DR-1001)
*   **Invoice Format:** INV-NNN (e.g., INV-001)
*   **Admission Format:** IPD-NNN (e.g., IPD-001)

---

## SECTION 23: TRAINING DATA STANDARDS

When future data needs to be generated for new modules or edge cases, creators must follow these guidelines:
1.  **Use Local Context:** Names, addresses, and phone numbers must reflect a realistic Bangladeshi context.
2.  **Maintain Continuity:** If a new mockup requires an admitted patient, use an existing patient from Section 7 (e.g., Rafiqul Islam) rather than inventing a new one.
3.  **Clinical Accuracy:** Ensure that diagnoses match the prescribed medications and ordered lab tests (e.g., do not prescribe insulin for a patient diagnosed with a simple fracture).
4.  **No Placeholders:** Never use "Test", "Demo", "Asdf", or "1234" in any field.

---

## SECTION 24: CONCLUSION

This **ABSHealthcareLite Sample Data Dictionary** is the mandatory, official data source for all visual and instructional materials related to the platform. 

By utilizing this standardized, realistic, and culturally relevant dataset, ABSHealthcareLite ensures that all UI Mockups, User Manuals, Product Demos, Training Sessions, and QA Testing environments present a cohesive, professional, and highly credible representation of the software in action.

<div style="page-break-after: always;"></div>

