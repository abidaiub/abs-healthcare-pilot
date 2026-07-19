## Medication Administration Record (MAR): Wireframe Mockups

### 1. MAR Dashboard (Ward View)
```
--------------------------------------------------------------------------------
Nursing Station MAR | Ward: General Medical (3rd Floor)
--------------------------------------------------------------------------------
[ Due Next 2 Hrs: 15 ]  [ Missed/Delayed: 3 !! ]  [ PRN Follow-up: 2 ]

Patients with Due Medications:
| Bed No | Patient Name | Meds Due | Next Due Time | Action       |
|--------|--------------|----------|---------------|--------------|
| 301-A  | John Doe     | 2        | 08:00 AM      | [ Open MAR ] |
| 302-B  | Jane Smith   | 1        | 08:30 AM      | [ Open MAR ] |
| 305-A  | Mike Ross    | 1        | 07:00 AM (LATE)| [ Open MAR ]|

[ View Shift Handover ]
--------------------------------------------------------------------------------
```

### 2. Patient Medication Schedule (Grid View)
```
--------------------------------------------------------------------------------
MAR: John Doe (39/M) | Bed: 301-A | Allergies: [ PENICILLIN !! ]
--------------------------------------------------------------------------------
Date: 09-Jun-2026

Scheduled Medications:
| Medication             | Route | Dose | 08:00 | 14:00 | 20:00 | Action     |
|------------------------|-------|------|-------|-------|-------|------------|
| Paracetamol 500mg      | Oral  | 1 tab| [DUE] |       |       | [Admin]    |
| Ceftriaxone 1g         | IV    | 1g   | [GIVEN]       | [DUE] | [Admin]    |

PRN Medications (As Needed):
| Medication             | Route | Dose | Last Given    | Action             |
|------------------------|-------|------|---------------|--------------------|
| Morphine 2mg           | IV    | 2mg  | Yesterday     | [Admin PRN]        |

--------------------------------------------------------------------------------
```

### 3. Administration Screen
```
--------------------------------------------------------------------------------
Administer Medication | John Doe | Bed: 301-A
--------------------------------------------------------------------------------
Medication: Paracetamol 500mg Tablet
Route: Oral
Scheduled Time: 08:00 AM

[x] Right Patient Verified
[x] Right Medication Verified

Actual Time Given: [ 08:15 AM ]
Dose Given:        [ 1 tab    ]

[ Administer ]  [ Mark as Missed/Refused ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 4. Missed Dose Screen
```
--------------------------------------------------------------------------------
Missed / Refused Dose | Paracetamol 500mg
--------------------------------------------------------------------------------
You are marking this scheduled dose as NOT GIVEN.

Reason Code (Mandatory):
[ Patient Refused v ]

Remarks:
[ Patient stated he has no fever and does not want to take the tablet.       ]

[ Confirm Missed Dose ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 5. Adverse Event Screen
```
--------------------------------------------------------------------------------
Log Adverse Drug Event (ADE) | Ceftriaxone 1g IV
--------------------------------------------------------------------------------
Reaction Type: [ Rash / Hives v ]
Severity:      [ Moderate v ]

Action Taken:
[ Stopped infusion immediately. Administered Antihistamine as per protocol.  ]

[x] Notify Attending Physician (Dr. House)

[ Log Event & Hold Medication ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 6. Shift Handover Screen
```
--------------------------------------------------------------------------------
Nursing Shift Handover | Ward: General Medical
--------------------------------------------------------------------------------
Outgoing Nurse: [ Nurse Alice ]
Incoming Nurse: [ Nurse Bob   ]

Pending MAR Tasks:
- Bed 305-A (Mike Ross): 1 Delayed Dose (Awaiting Pharmacy Delivery)
- Bed 301-A (John Doe): PRN Effectiveness Review due at 09:00 AM

[ Acknowledge Handover ]
--------------------------------------------------------------------------------
```

### 7. Mobile Nurse MAR View
```
+------------------------+
| < Back   Scan Patient  |
+------------------------+
| John Doe (Bed 301-A)   |
| ALLERGY: PENICILLIN    |
|------------------------|
| DUE: 08:00 AM          |
| Paracetamol 500mg Oral |
|                        |
| [ Scan Medication ]    |
|------------------------|
| [ Administer ]         |
| [ Missed / Refused ]   |
+------------------------+
```
