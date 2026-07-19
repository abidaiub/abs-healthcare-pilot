## Radiology Workflow & Imaging Management: Screen Flow

### 1. Overview
This flow illustrates the journey of a radiology patient from scheduling their scan to the radiologist finalizing the diagnostic report.

### 2. Flow Diagram
```
[ Investigation Order ] (From Billing/OPD)
      |
      v
[ Radiology Scheduling Screen ]
      |
      +--> Select Machine & Time Slot
      |
      v
[ Reception / Waiting Area ]
      |
      +--> Mark Status: "Arrived"
      |
      v
[ Acquisition Screen ] (Technician View)
      |
      +--> Patient enters scanner
      |
      +--> Log Start/End Time & Image Count
      |
      +--> Mark Status: "Acquired"
      |
      v
[ Reporting Worklist ] (Radiologist View)
      |
      +--> [ Select Patient ]
             |
             +--> (Future) Open PACS Viewer Link
             |
             +--> [ Structured Reporting Screen ]
                    |
                    +--> Select Template (e.g., Normal Chest)
                    |
                    +--> Edit Findings & Impression
                    |
                    +--> Flag Critical Findings? -> [ Notification Workflow ]
                    |
                    v
          [ Verification Screen ] (Consultant View - Optional)
                    |
                    +--> [ Approve ]
                           |
                           v
                 [ Report Released ] (To Portal/Doctor)
```
