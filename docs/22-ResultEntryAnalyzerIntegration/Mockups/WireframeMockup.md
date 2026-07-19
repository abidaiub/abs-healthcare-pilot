## Result Entry & Analyzer Integration: Wireframe Mockups

### 1. Result Entry Screen (Master List)
```
--------------------------------------------------------------------------------
Department: Biochemistry | Status: Pending Entry
--------------------------------------------------------------------------------
[Search Barcode/Patient...] [Filter: All v]

| Barcode    | Patient Name | Test Group     | TAT Status | Action         |
|------------|--------------|----------------|------------|----------------|
| 1029384756 | John Doe     | Lipid Profile  | Normal     | [Enter Result] |
| 1029384757 | Jane Smith   | Liver Function | Delayed(!) | [Enter Result] |

[ Batch Analyzer Import ]
--------------------------------------------------------------------------------
```

### 2. Numeric Result Entry (Grid View)
```
--------------------------------------------------------------------------------
Result Entry: Lipid Profile | Patient: John Doe (39/M) | Barcode: 1029384756
--------------------------------------------------------------------------------
| Test Name         | Result   | Unit  | Flag | Reference Range | Prev Result |
|-------------------|----------|-------|------|-----------------|-------------|
| Total Cholesterol | [ 210  ] | mg/dL |  H   | < 200           | 195         |
| HDL Cholesterol   | [ 45   ] | mg/dL |      | 40 - 60         | 42          |
| LDL Cholesterol   | [ 140  ] | mg/dL |  H   | < 100           | 130         |
| Triglycerides     | [ 125  ] | mg/dL |      | < 150           | 110         |

[x] Auto-calculate where applicable

[ Save as Draft ]  [ Validate & Submit ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 3. Microbiology Result Screen
```
--------------------------------------------------------------------------------
Result Entry: Urine Culture | Patient: Mike Ross (45/M)
--------------------------------------------------------------------------------
Specimen: Urine (Mid-stream)
Incubation: 48 Hours

Result: [ Positive - Growth Detected v ]

Organism 1: [ Escherichia coli v ]  Colony Count: [ > 10^5 CFU/mL ]

Antibiogram (Sensitivity):
| Antibiotic         | Result (S/I/R) | MIC Value |
|--------------------|----------------|-----------|
| Amoxicillin        | [ Resistant v] | [ >= 32 ] |
| Ciprofloxacin      | [ Sensitive v] | [ <= 1  ] |
| Nitrofurantoin     | [ Sensitive v] | [ <= 16 ] |

[+ Add Organism]

[ Save as Draft ]  [ Validate & Submit ]
--------------------------------------------------------------------------------
```

### 4. Histopathology Result Screen
```
--------------------------------------------------------------------------------
Result Entry: Biopsy | Patient: Sarah Connor (50/F)
--------------------------------------------------------------------------------
Specimen: Breast Core Biopsy

Gross Description:
[ Received two linear cores of fibrofatty tissue measuring 1.5 and 1.2 cm... ]

Microscopic Description:
[ Sections show infiltrating ductal carcinoma, Grade 2. Margins are...       ]

Final Diagnosis:
[ INFILTRATING DUCTAL CARCINOMA, RIGHT BREAST.                               ]

[ Save as Draft ]  [ Validate & Submit ]
--------------------------------------------------------------------------------
```

### 5. Analyzer Queue Screen
```
--------------------------------------------------------------------------------
Analyzer Integration: Sysmex XN-1000 (Hematology)
--------------------------------------------------------------------------------
[ Refresh Queue ]

| Machine Sample ID | Patient Name | Status         | Action            |
|-------------------|--------------|----------------|-------------------|
| 1029384756        | John Doe     | Ready          | [ Review & Post ] |
| 1029384999        | Unknown      | Error: Unmapped| [ Map Test Code ] |

[ Post All Ready Results ]
--------------------------------------------------------------------------------
```

### 6. Critical Alert Screen
```
--------------------------------------------------------------------------------
!! CRITICAL VALUE ALERT !!
--------------------------------------------------------------------------------
Patient: Jane Smith (28/F)
Test: Potassium (Serum)
Result: 6.8 mEq/L  (Critical High! Range: 3.5 - 5.1)

Action Required:
Notified To (Doctor/Nurse Name): [ Dr. House          ]
Notified By:                     [ Tech. Alice        ]
Time of Notification:            [ 07-Jun-2026 10:45 AM ]

[ Acknowledge & Proceed ]  [ Cancel Result Entry ]
--------------------------------------------------------------------------------
```

### 7. Validation Dashboard
```
--------------------------------------------------------------------------------
Validation & Verification Queue (Pathologist View)
--------------------------------------------------------------------------------
| Barcode    | Patient Name | Test Group     | Validated By | Action       |
|------------|--------------|----------------|--------------|--------------|
| 1029384756 | John Doe     | Lipid Profile  | Tech. Alice  | [ Verify ]   |
| 1029384111 | Mike Ross    | Urine Culture  | Sci. Bob     | [ Verify ]   |

[ Batch Verify Selected ]
--------------------------------------------------------------------------------
```

### 8. Mobile Result Review View
```
+------------------------+
| < Back   Verify Result |
+------------------------+
| John Doe (39/M)        |
| Lipid Profile          |
|------------------------|
| Total Chol: 210 (H)    |
| HDL: 45                |
| LDL: 140 (H)           |
| Trig: 125              |
|------------------------|
| [ Reject ]  [ Verify ] |
+------------------------+
```
