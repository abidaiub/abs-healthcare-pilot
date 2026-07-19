## Bed, Ward, Room & Occupancy Management: Wireframe Mockups

### 1. Bed Occupancy Dashboard
```
--------------------------------------------------------------------------------
Hospital Capacity Dashboard | Branch: Main Hospital
--------------------------------------------------------------------------------
[ Total Beds: 200 ]  [ Occupied: 150 (75%) ]  [ Available: 30 ]  [ Cleaning: 15 ]
[ Reserved: 3 ]      [ Maintenance: 2 ]       [ ICU Available: 2 !! ]

Occupancy by Ward:
| Ward Name       | Total | Occupied | Available | Cleaning | Utilization |
|-----------------|-------|----------|-----------|----------|-------------|
| General Medical | 50    | 45       | 2         | 3        | 90%         |
| Surgical Ward   | 40    | 30       | 8         | 2        | 75%         |
| Medical ICU     | 15    | 14       | 1         | 0        | 93%         |

[ View Visual Bed Board ]  [ View Waitlist ]
--------------------------------------------------------------------------------
```

### 2. Visual Bed Board
```
--------------------------------------------------------------------------------
Visual Bed Board | Ward: General Medical (3rd Floor)
--------------------------------------------------------------------------------
Legend: [Green=Available] [Red=Occupied] [Yellow=Cleaning] [Grey=Maintenance]

Room 301 (Male)              Room 302 (Female)            Room 303 (Isolation)
+------------------------+   +------------------------+   +------------------------+
| [ Bed A - RED ]        |   | [ Bed A - GREEN ]      |   | [ Bed A - RED ]        |
| John Doe (Admitted)    |   | Available              |   | Mike Ross (Airborne)   |
|                        |   |                        |   |                        |
| [ Bed B - YELLOW ]     |   | [ Bed B - RED ]        |   | [ Bed B - GREY ]       |
| Cleaning Pending       |   | Jane Smith (Admitted)  |   | BLOCKED (Isolation)    |
+------------------------+   +------------------------+   +------------------------+

[ Filter by Category... ]
--------------------------------------------------------------------------------
```

### 3. Bed Transfer Screen
```
--------------------------------------------------------------------------------
Transfer Patient | John Doe (39/M) | Current Bed: 301-A (General Medical)
--------------------------------------------------------------------------------
Transfer To:
Ward:     [ Medical ICU v ]
Room:     [ ICU-1 v ]
Bed:      [ Bed C (Available) v ]

Reason for Transfer (Mandatory):
[ Clinical Deterioration v ]
Remarks: [ Patient requires mechanical ventilation. ]

[x] Notify Housekeeping to clean Bed 301-A immediately.

[ Confirm Transfer ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 4. Housekeeping Screen
```
--------------------------------------------------------------------------------
Housekeeping Task Queue | Shift: Morning
--------------------------------------------------------------------------------
[Filter: My Assigned Tasks v]

| Ward            | Room | Bed   | Status            | Time Elapsed | Action       |
|-----------------|------|-------|-------------------|--------------|--------------|
| General Medical | 301  | Bed B | Cleaning Required | 45 mins (!)  | [ Start ]    |
| Surgical Ward   | 405  | Bed A | In Progress       | 15 mins      | [ Complete ] |

[ Mark Selected as Available ]
--------------------------------------------------------------------------------
```

### 5. Maintenance Screen
```
--------------------------------------------------------------------------------
Bed Maintenance Log
--------------------------------------------------------------------------------
[ Log New Issue ]

| Ward            | Room | Bed   | Issue Reported        | Status | Action       |
|-----------------|------|-------|-----------------------|--------|--------------|
| Medical ICU     | ICU-2| Bed A | Motor not elevating   | OPEN   | [ Resolve ]  |
| General Medical | 308  | Bed C | Broken side rail      | OPEN   | [ Resolve ]  |

Note: Beds with OPEN issues cannot be allocated to patients.
--------------------------------------------------------------------------------
```

### 6. Waitlist Screen
```
--------------------------------------------------------------------------------
Admission Waitlist Queue
--------------------------------------------------------------------------------
| Patient Name | Required Bed Category | Priority | Waiting Since | Action       |
|--------------|-----------------------|----------|---------------|--------------|
| Sarah Connor | ICU Bed               | HIGH (1) | 2 Hours       | [ Allocate ] |
| Tom Hanks    | Deluxe Cabin          | LOW (3)  | 1 Day         | [ Allocate ] |

[ Notify Patient via SMS ]
--------------------------------------------------------------------------------
```

### 7. Mobile Occupancy View
```
+------------------------+
| < Back   Bed Status    |
+------------------------+
| Ward: Gen Medical      |
| Room: 301              |
|------------------------|
| Bed A: Occupied        |
| (John Doe)             |
|                        |
| Bed B: Cleaning Req.   |
| [ Mark Clean ]         |
|                        |
| Bed C: Available       |
| [ Log Maint. Issue ]   |
+------------------------+
```
