## Medication Administration Record (MAR): Screen Flow

### 1. Overview
This flow illustrates the nursing workflow for administering scheduled and PRN medications, handling exceptions (missed doses), and ensuring clinical safety.

### 2. Flow Diagram
```
[ Doctor Prescription ]
      |
      v
[ MAR Schedule Generation ] (System automated based on frequency)
      |
      v
[ MAR Dashboard / Ward View ] (Filtered by Nurse's Ward)
      |
      +--> [ Select Patient ]
             |
             v
[ Patient Medication Schedule ] (Grid View)
      |
      +--> [ Select Due Medication ]
             |
             +--> (Future) BCMA Scan: Wristband + Med Barcode
             |
             +--> [ Administration Screen ]
                    |
                    +--> [ Administer ] -> Status: "Administered"
                    |
                    +--> [ Missed / Refused ] -> [ Refusal Screen ] -> Log Reason
                    |
                    +--> [ Hold Request ] -> Routes to Doctor/Pharmacy
                    |
                    +--> [ Adverse Event ] -> [ ADE Screen ] -> Log Reaction
             |
             +--> [ Select PRN Medication ]
                    |
                    +--> [ Administer ] -> Log Reason Given
                           |
                           v
                 [ Pending Effectiveness Review Task ]
```
