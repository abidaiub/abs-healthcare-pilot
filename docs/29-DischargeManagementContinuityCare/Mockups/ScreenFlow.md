## Discharge Management & Continuity of Care: Screen Flow

### 1. Overview
This flow illustrates the multi-disciplinary process required to safely transition a patient from inpatient care to discharge, ensuring all clinical, financial, and operational requirements are met.

### 2. Flow Diagram
```
[ Attending Doctor ]
      |
      +--> Initiates Discharge Request
      |
      +--> Drafts Discharge Summary & Take-Home Meds
      |
      v
[ Clearance Tracker Initiated ]
      |
      +--> [ Nursing Clearance ]
      |      +--> Final vitals, device removal, patient education.
      |
      +--> [ Pharmacy Clearance ]
      |      +--> Ward stock return, dispense take-home meds.
      |
      +--> [ Billing Clearance ]
             +--> Freeze charges, process final payment/insurance.
             |
             v
      Are all clearances complete?
             |
        +----+----+
       No         Yes
        |          |
        v          v
    [ Wait ]  [ Administrative Approval ]
                   |
                   v
          [ Status: Discharged ]
                   |
                   +--> [ Print Final Documents ] (Summary, Bill, Meds)
                   |
                   +--> [ Bed Release Workflow ] -> Module 28 (Housekeeping)
                   |
                   v
          [ Continuity of Care ]
                   |
                   +--> Follow-up Reminders
                   |
                   +--> Readmission Tracking
```
