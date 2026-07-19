## Nursing Station & Clinical Task Management: Wireframe Mockups

### 1. Nursing Dashboard
```
--------------------------------------------------------------------------------
Nursing Station | Ward: General Medical (3rd Floor) | Shift: Morning
--------------------------------------------------------------------------------
[ Occupied: 24/30 ]  [ Critical: 2 !! ]  [ New Orders: 5 ]  [ Escalations: 1 ]

Pending Tasks (Next 2 Hours):
| Bed   | Patient Name | Task Type      | Due Time | Assigned To | Action    |
|-------|--------------|----------------|----------|-------------|-----------|
| 301-A | John Doe     | Vitals Check   | 08:00 AM | Nurse Alice | [ Start ] |
| 302-B | Jane Smith   | Blood Draw     | 08:15 AM | Nurse Bob   | [ Start ] |
| 305-A | Mike Ross    | Wound Dressing | 09:00 AM | Unassigned  | [ Assign ]|

[ View Full Census ]  [ View MAR ]  [ Shift Handover ]
--------------------------------------------------------------------------------
```

### 2. Vitals Entry Screen
```
--------------------------------------------------------------------------------
Vitals Entry | John Doe (39/M) | Bed: 301-A
--------------------------------------------------------------------------------
Time: [ 08-Jun-2026 08:00 AM ]

| Parameter   | Value   | Unit  | Status   | Previous (04:00 AM) |
|-------------|---------|-------|----------|---------------------|
| Temperature | [ 98.6 ]| °F    | Normal   | 99.1                |
| Pulse       | [ 82   ]| bpm   | Normal   | 85                  |
| Blood Press.| [ 160/95]| mmHg | High (!) | 145/90              |
| SpO2        | [ 98   ]| %     | Normal   | 97                  |
| Pain Score  | [ 4    ]| /10   |          | 6                   |

[ View Trend Chart ]

[ Save Vitals ]  [ Save & Escalate ]
--------------------------------------------------------------------------------
```

### 3. Clinical Task Board (Kanban Style)
```
--------------------------------------------------------------------------------
Task Board | Ward: General Medical
--------------------------------------------------------------------------------
[Filter: My Tasks v] [Sort: Due Time v]

PENDING (12)                 IN PROGRESS (3)              COMPLETED TODAY (45)
----------------------       ----------------------       ----------------------
[ Bed 305-A ]                [ Bed 301-A ]                [ Bed 302-B ]
Task: Wound Dressing         Task: Vitals Check           Task: Blood Draw
Due: 09:00 AM                Due: 08:00 AM                Done: 07:15 AM
[ Assign to me ]             [ Mark Complete ]            By: Nurse Alice
----------------------       ----------------------       ----------------------
[ Bed 308-B ]
Task: ECG
Due: 10:00 AM
[ Assign to me ]
--------------------------------------------------------------------------------
```

### 4. Escalation Screen
```
--------------------------------------------------------------------------------
Raise Clinical Escalation | John Doe | Bed: 301-A
--------------------------------------------------------------------------------
Escalation Type: [ Clinical Deterioration v ]
Priority:        [ HIGH !! v ]

Reason / Observation:
[ Patient complaining of sudden, severe chest pain radiating to left arm.    
  BP elevated at 160/95. Sweating profusely.                                 ]

Assign To (Duty Doctor): [ Dr. Gregory House v ]

[x] Send SMS Alert to Doctor

[ Raise Escalation ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 5. Shift Handover Screen
```
--------------------------------------------------------------------------------
Shift Handover | General Medical Ward
--------------------------------------------------------------------------------
Shift: Morning (08:00 - 16:00) -> Evening (16:00 - 00:00)
Outgoing In-Charge: Nurse Alice
Incoming In-Charge: [ Select Nurse v ]

Ward Summary:
- Total Patients: 24
- Critical Patients: 2 (Bed 301-A, Bed 310-B)
- Pending Tasks: 5 (Carried over to Evening shift)
- Pending Meds: 0

Special Instructions / Shift Notes:
[ Bed 301-A requires strict BP monitoring every 2 hours. Doctor aware.       
  Bed 312-A scheduled for discharge tomorrow, ensure paperwork is ready.     ]

[ Confirm Handover (Digital Signature) ]
--------------------------------------------------------------------------------
```

### 6. Mobile Nursing View
```
+------------------------+
| < Back   Bed 301-A     |
+------------------------+
| John Doe (39/M)        |
|------------------------|
| [ Enter Vitals ]       |
| [ View Tasks (2) ]     |
| [ Open MAR ]           |
| [ Add Note ]           |
|------------------------|
| ! ESCALATE             |
+------------------------+
```
