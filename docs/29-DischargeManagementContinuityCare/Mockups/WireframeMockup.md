## Discharge Management & Continuity of Care: Wireframe Mockups

### 1. Discharge Dashboard (Coordinator View)
```
--------------------------------------------------------------------------------
Discharge Command Center | Branch: Main Hospital
--------------------------------------------------------------------------------
[ Pending Discharges: 15 ]  [ Discharged Today: 42 ]  [ ALOS: 4.2 Days ]

Active Discharge Requests:
| Bed   | Patient Name | Doctor      | Nursing | Pharmacy | Billing | Action   |
|-------|--------------|-------------|---------|----------|---------|----------|
| 301-A | John Doe     | Dr. Smith   | [ DONE ]| [ DONE ] | [ PEND ]| [ View ] |
| 405-B | Jane Roe     | Dr. House   | [ PEND ]| [ DONE ] | [ DONE ]| [ View ] |
| 210-A | Mike Ross    | Dr. Chang   | [ DONE ]| [ DONE ] | [ DONE ]| [ FINAL ]|

[ Generate Daily Discharge Report ]
--------------------------------------------------------------------------------
```

### 2. Discharge Request & Summary Screen (Doctor View)
```
--------------------------------------------------------------------------------
Discharge Summary | John Doe (39/M) | Bed: 301-A
--------------------------------------------------------------------------------
Category: [ Routine Discharge v ]  Expected Date: [ 09-Jun-2026 ]

Admission Diagnosis: [ Acute Appendicitis                                    ]
Final Diagnosis:     [ Acute Appendicitis, post-laparoscopic appendectomy    ]

Treatment Summary:
[ Patient underwent lap appendectomy on 07-Jun. Post-op recovery was         
  uneventful. Tolerating oral diet. Afebrile.                                ]

Take-Home Medications:
1. Tab. Paracetamol 500mg | TID | 5 Days
2. Cap. Amoxicillin 500mg | BID | 5 Days
[ + Add Medication ]

[ Save Draft ]  [ Initiate Clearance Workflow ]
--------------------------------------------------------------------------------
```

### 3. Clearance Tracker (Nursing View)
```
--------------------------------------------------------------------------------
Nursing Discharge Clearance | John Doe | Bed: 301-A
--------------------------------------------------------------------------------
Checklist:
[x] Final vitals recorded (Temp: 98.6, BP: 120/80)
[x] IV Cannula removed
[x] Urinary Catheter removed (N/A)
[x] Surgical dressing checked and intact
[x] Discharge medications explained to patient
[x] Diet and wound care instructions provided

Remarks: [ Patient's wife present during education. Understood instructions. ]

[ Approve Nursing Clearance ]  [ Hold Clearance ]
--------------------------------------------------------------------------------
```

### 4. Follow-Up & Referral Planner
```
--------------------------------------------------------------------------------
Continuity of Care Plan | John Doe
--------------------------------------------------------------------------------
Follow-Up Appointments:
1. [ Dr. Smith (Surgery) v ] on [ 16-Jun-2026 ] for [ Suture Removal       ]
[ + Add Follow-Up ]

Referrals:
[ None Required v ]

Patient Education (Printed on Summary):
[ Diet: Soft, easily digestible food for 3 days.                             
  Wound Care: Keep dressing dry. Do not shower until cleared by doctor.      
  Warning Signs: Return to ER if fever > 101F or severe abdominal pain.      ]

[ Save Continuity Plan ]
--------------------------------------------------------------------------------
```

### 5. Readmission Analysis Screen
```
--------------------------------------------------------------------------------
Readmission Quality Metrics | Month: June 2026
--------------------------------------------------------------------------------
Overall 30-Day Readmission Rate: 4.5% (Target: < 5%)

Recent Unplanned Readmissions (Within 30 Days):
| Patient Name | Prev Discharge | New Admission | Days | Prev Diagnosis      |
|--------------|----------------|---------------|------|---------------------|
| Alan Grant   | 15-May-2026    | 02-Jun-2026   | 18   | Heart Failure       |
| Sarah Connor | 20-May-2026    | 25-May-2026   | 5    | Post-op Infection   |

[ Export Analysis to Excel ]  [ View Clinical Pathways ]
--------------------------------------------------------------------------------
```
