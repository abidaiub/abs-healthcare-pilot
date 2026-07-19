## Result Verification & Approval: Wireframe Mockups

### 1. Verification Dashboard
```
--------------------------------------------------------------------------------
Lab Verification Dashboard | Role: Senior Technologist
--------------------------------------------------------------------------------
[ Pending Verification: 45 ]  [ Critical Results: 2 !! ]  [ On Hold: 5 ]

Urgent / Critical Queue:
| Barcode    | Patient Name | Test Group     | TAT Status | Action       |
|------------|--------------|----------------|------------|--------------|
| 1029384756 | Jane Smith   | Electrolytes   | SLA Breach!| [ Verify ]   |

Routine Queue:
| Barcode    | Patient Name | Test Group     | TAT Status | Action       |
|------------|--------------|----------------|------------|--------------|
| 1029384757 | John Doe     | Lipid Profile  | Normal     | [ Verify ]   |

[ View Full Queue ]
--------------------------------------------------------------------------------
```

### 2. Verification Screen (Detailed Review)
```
--------------------------------------------------------------------------------
Verify Result: Lipid Profile | Patient: John Doe (39/M)
--------------------------------------------------------------------------------
| Test Name         | Result   | Flag | Reference Range | Prev Result | Delta |
|-------------------|----------|------|-----------------|-------------|-------|
| Total Cholesterol | 210      |  H   | < 200           | 195         | +7%   |
| HDL Cholesterol   | 45       |      | 40 - 60         | 42          |       |
| LDL Cholesterol   | 140      |  H   | < 100           | 130         | +7%   |

Verification Checklist:
[x] Patient Identity Confirmed
[x] Sample Integrity Acceptable
[x] Delta Checks Reviewed
[x] QC Passed for this batch

Remarks: [ Patient on new diet plan, slight elevation noted.                 ]

[ Verify & Release ]  [ Escalate to Pathologist ]  [ Place on Hold ]
--------------------------------------------------------------------------------
```

### 3. Critical Result Verification Screen
```
--------------------------------------------------------------------------------
Verify CRITICAL Result: Electrolytes | Patient: Jane Smith (28/F)
--------------------------------------------------------------------------------
| Test Name | Result | Flag | Reference Range |
|-----------|--------|------|-----------------|
| Potassium | 6.8    |  HH  | 3.5 - 5.1       |

!! CRITICAL VALUE GOVERNANCE !!
You cannot verify this result until notification is logged.

Notified To (Doctor/Nurse): [ Dr. Gregory House      ]
Notified By (Your Name):    [ Tech. Alice            ]
Time of Notification:       [ 08-Jun-2026 12:45 AM   ]
Acknowledgement Received:   [x] Yes

[ Verify & Route to Approval ]  [ Reject Result ]
--------------------------------------------------------------------------------
```

### 4. Approval Dashboard (Pathologist View)
```
--------------------------------------------------------------------------------
Pathologist Approval Queue | Dr. Robert Chang
--------------------------------------------------------------------------------
[Search Patient/Barcode...] [Filter: Histopathology v]

| Barcode    | Patient Name | Test Group     | Verified By | Action      |
|------------|--------------|----------------|-------------|-------------|
| 1029384999 | Sarah Connor | Breast Biopsy  | Tech. Bob   | [ Approve ] |
| 1029384111 | Mike Ross    | Urine Culture  | Micro. Jane | [ Approve ] |

[ Batch Approve Selected (Routine Only) ]
--------------------------------------------------------------------------------
```

### 5. Correction Request Screen
```
--------------------------------------------------------------------------------
Request Result Correction | Barcode: 1029384757
--------------------------------------------------------------------------------
Current Status: APPROVED (Report already released)

| Test Name         | Old Result | New Result |
|-------------------|------------|------------|
| Total Cholesterol | 210        | [ 201    ] |

Justification for Correction (Mandatory):
[ Typographical error during manual entry. Analyzer printout confirms 201.   ]

[ Submit Request to Supervisor ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 6. Escalation Screen
```
--------------------------------------------------------------------------------
Escalate Result | Barcode: 1029384757
--------------------------------------------------------------------------------
Escalate To:
[ Pathologist - Dr. Chang v ]

Reason for Escalation:
[ Abnormal morphology noted on peripheral smear, requires expert review.     ]

[ Confirm Escalation ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 7. Mobile Approval View
```
+------------------------+
| < Back   Approve Case  |
+------------------------+
| Sarah Connor (50/F)    |
| Breast Biopsy          |
|------------------------|
| Dx: INFILTRATING       |
| DUCTAL CARCINOMA...    |
|                        |
| Verified: Tech. Bob    |
|------------------------|
| [ Reject ] [ Approve ] |
+------------------------+
```
