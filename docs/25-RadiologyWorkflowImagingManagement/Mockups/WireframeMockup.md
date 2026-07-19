## Radiology Workflow & Imaging Management: Wireframe Mockups

### 1. Radiology Dashboard
```
--------------------------------------------------------------------------------
Radiology Department Dashboard | Branch: Main
--------------------------------------------------------------------------------
[ Scheduled Today: 45 ]  [ Waiting: 12 ]  [ Reporting Queue: 8 ]

Machine Utilization:
| Machine Name       | Modality | Status   | Next Appointment |
|--------------------|----------|----------|------------------|
| GE Optima 1.5T     | MRI      | In Use   | 10:30 AM         |
| Siemens Somatom    | CT       | Idle     | 11:00 AM         |
| Philips X-Ray 1    | X-Ray    | In Use   | Walk-in          |

[ View Full Schedule ]  [ View Reporting Worklist ]
--------------------------------------------------------------------------------
```

### 2. Scheduling Screen
```
--------------------------------------------------------------------------------
Schedule Radiology Order | Patient: John Doe | Order: ORD-901
--------------------------------------------------------------------------------
Investigation: MRI Brain with Contrast

Select Machine: [ GE Optima 1.5T (MRI) v ]
Select Date:    [ 09-Jun-2026 v ]

Available Slots:
[ 09:00 AM ]  [ 09:30 AM ]  [ 10:00 AM ]  [ 10:30 AM (Booked) ]
[ 11:00 AM ]  [ 11:30 AM ]  [ 12:00 PM ]  [ 12:30 PM ]

[ Confirm Booking ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 3. Acquisition Screen (Technician View)
```
--------------------------------------------------------------------------------
Acquisition Desk | Machine: Siemens Somatom (CT)
--------------------------------------------------------------------------------
Current Patient: Jane Smith (28/F) | CT Abdomen/Pelvis

Status: [ Arrived v ] -> [ In Progress v ] -> [ Acquired v ]

Acquisition Details:
Technician:   [ Tech. Mike v ]
Start Time:   [ 10:15 AM ]
End Time:     [ 10:45 AM ]
Contrast Used:[x] Yes  Volume: [ 50ml ]
Image Count:  [ 450 ]

[ Save & Send to Radiologist Queue ]
--------------------------------------------------------------------------------
```

### 4. Reporting Worklist (Radiologist View)
```
--------------------------------------------------------------------------------
Radiologist Worklist | Dr. Alan Grant
--------------------------------------------------------------------------------
[Filter: Unread v] [Modality: All v] [Urgency: Critical First v]

| Patient Name | Modality | Investigation    | Acquired Time | Action      |
|--------------|----------|------------------|---------------|-------------|
| Mike Ross    | CT       | CT Head Trauma   | 10:50 AM (URG)| [ Report ]  |
| Jane Smith   | CT       | CT Abdomen       | 10:45 AM      | [ Report ]  |
| John Doe     | X-Ray    | Chest PA         | 09:30 AM      | [ Report ]  |

--------------------------------------------------------------------------------
```

### 5. Structured Reporting Screen
```
--------------------------------------------------------------------------------
Dictate Report | Patient: John Doe | Chest X-Ray PA
--------------------------------------------------------------------------------
[ View Images (PACS Link) ]

Load Template: [ Normal Chest X-Ray v ] [ Apply ]

Clinical Indication:
[ Routine health checkup. Mild cough.                                        ]

Findings:
[ Both lung fields are clear. No active focal lesion seen.                   
  Cardiac shadow is within normal limits.                                    
  Both CP angles are clear. Diaphragm is normal.                             ]

Impression:
[ NORMAL STUDY OF CHEST.                                                     ]

[x] Flag as Critical Finding

[ Save Draft ]  [ Verify & Release ]
--------------------------------------------------------------------------------
```

### 6. Critical Findings Notification Screen
```
--------------------------------------------------------------------------------
!! CRITICAL RADIOLOGY FINDING !!
--------------------------------------------------------------------------------
Patient: Mike Ross | CT Head Trauma
Impression: Large epidural hematoma with midline shift.

Action Required Before Release:
Notified To (Doctor Name): [ Dr. Shepherd       ]
Notified By:               [ Dr. Alan Grant     ]
Time of Notification:      [ 09-Jun-2026 11:05 AM ]

[ Log Notification & Release Report ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 7. Mobile Radiologist Review View
```
+------------------------+
| < Back   Review Report |
+------------------------+
| John Doe (39/M)        |
| Chest X-Ray PA         |
|------------------------|
| IMPRESSION:            |
| NORMAL STUDY OF CHEST. |
|                        |
| [ View Images ]        |
|------------------------|
| [ Edit ]  [ Approve ]  |
+------------------------+
```
