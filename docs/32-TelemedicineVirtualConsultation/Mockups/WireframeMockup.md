## Telemedicine & Virtual Consultation: Wireframe Mockups

### 1. Telemedicine Dashboard (Coordinator View)
```
--------------------------------------------------------------------------------
Telemedicine Command Center | Date: 10-Jun-2026
--------------------------------------------------------------------------------
[ Scheduled Today: 45 ]  [ In Waiting Room: 5 ]  [ Active Calls: 3 ]

Virtual Waiting Room Queue:
| Appt Time | Patient Name | Doctor      | Wait Time | Triage Status | Action   |
|-----------|--------------|-------------|-----------|---------------|----------|
| 09:00 AM  | John Doe     | Dr. Smith   | 15 mins(!)| [ Done ]      | [ Nudge ]|
| 09:15 AM  | Jane Roe     | Dr. Chang   | 5 mins    | [ Pending ]   | [ Triage]|
| 09:30 AM  | Mike Ross    | Dr. Smith   | Not Joined| -             | [ SMS ]  |

[ View Active Consultations ]
--------------------------------------------------------------------------------
```

### 2. Patient Virtual Waiting Room
```
--------------------------------------------------------------------------------
Virtual Waiting Room | ABSHealthcareLite
--------------------------------------------------------------------------------
Welcome, John Doe.

Your appointment with Dr. Alan Smith is scheduled for 09:00 AM.
Status: The doctor is currently finishing up with a previous patient.

[ Estimated Wait Time: 5 Minutes ]

Please ensure your camera and microphone are ready.
[ Test Audio/Video ]

Documents Uploaded for Review:
- Lab_Report_May2026.pdf
[ Upload More Documents ]
--------------------------------------------------------------------------------
```

### 3. Pre-Consultation Triage Screen
```
--------------------------------------------------------------------------------
Triage Patient | John Doe (39/M)
--------------------------------------------------------------------------------
Chief Complaint:
[ Patient reports mild fever and persistent cough for 3 days.                ]

Home Vitals (Self-Reported):
Temp: [ 100.2 ] °F    BP: [ 120/80 ] mmHg

[x] Patient confirms no difficulty breathing (Red Flag Check)

[ Save Triage & Mark Ready for Doctor ]
--------------------------------------------------------------------------------
```

### 4. Virtual Consultation Screen (Doctor Workspace)
```
--------------------------------------------------------------------------------
Telemedicine Consult | John Doe | 09:00 AM
--------------------------------------------------------------------------------
+-------------------------+  Clinical Notes:
|                         |  [ Patient presents with mild fever...         ]
|      [ VIDEO FEED ]     |  [                                             ]
|       Patient View      |  Diagnosis: [ Viral URI v ]
|                         |
+-------------------------+  [ Issue ePrescription ]
[ Mute ] [ Video Off ] [ End Call ]  [ Order Investigations ]

Uploaded Documents:
- Lab_Report_May2026.pdf [ View ]

[ Escalate to Emergency ]  [ Complete Consultation ]
--------------------------------------------------------------------------------
```

### 5. Follow-Up & Prescription Summary Screen
```
--------------------------------------------------------------------------------
Complete Consultation | John Doe
--------------------------------------------------------------------------------
Prescription Generated:
- Paracetamol 500mg (TID for 3 Days)

Investigations Ordered:
- Chest X-Ray PA View

Follow-Up Plan:
[ Telemedicine Follow-Up v ] in [ 7 Days v ]

[ Finalize & Send to Patient Portal ]
--------------------------------------------------------------------------------
```

### 6. Emergency Escalation Screen
```
--------------------------------------------------------------------------------
!! EMERGENCY ESCALATION !!
--------------------------------------------------------------------------------
Patient: John Doe
Reason for Escalation:
[ Patient reporting severe chest pain and shortness of breath during call.   ]

Action Taken:
[x] Advised patient to call local ambulance immediately.
[x] Alerted Hospital ER Desk.

[ End Call & Log Escalation ]
--------------------------------------------------------------------------------
```
