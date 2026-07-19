## Sample Collection & Laboratory Workflow: Wireframe Mockups

### 1. Sample Collection Dashboard
```
--------------------------------------------------------------------------------
Phlebotomy Dashboard | Branch: Main
--------------------------------------------------------------------------------
[ Pending Collection: 12 ]  [ Collected Today: 45 ]  [ Recollection Needed: 2 ]

Pending Orders:
| Order No | Patient Name | Age/Sex | Tests Ordered       | Action     |
|----------|--------------|---------|---------------------|------------|
| ORD-901  | John Doe     | 39/M    | CBC, Lipid Profile  | [Collect]  |
| ORD-902  | Jane Smith   | 28/F    | Urine R/E           | [Collect]  |

[ Scan Order Barcode... ]
--------------------------------------------------------------------------------
```

### 2. Sample Collection Screen (Barcode Generation)
```
--------------------------------------------------------------------------------
Collect Sample: ORD-901 | Patient: John Doe (P-10001)
--------------------------------------------------------------------------------
Required Samples:

1. [ Blood ] [ EDTA Tube (Purple) ] - Tests: CBC
   Barcode: |||||||||||||||||| (Not Printed)  [ Print Label ]

2. [ Blood ] [ Plain Tube (Red) ]   - Tests: Lipid Profile
   Barcode: |||||||||||||||||| (Not Printed)  [ Print Label ]

[ Mark All Collected ] [ Cancel ]
--------------------------------------------------------------------------------
```

### 3. Barcode Label Preview
```
+------------------------+
| John Doe | 39/M        |
| P-10001  | ORD-901     |
| |||||||||||||||||||||| |
| 1029384756             |
| Blood - EDTA (Purple)  |
| CBC                    |
| 07-Jun-2026 10:15 AM   |
+------------------------+
```

### 4. Lab Receiving Screen
```
--------------------------------------------------------------------------------
Lab Receiving Desk
--------------------------------------------------------------------------------
Scan Sample Barcode: [ 1029384756             ] [ Receive ]

Recently Scanned:
| Barcode    | Patient Name | Sample Type | Dept        | Status   | Action   |
|------------|--------------|-------------|-------------|----------|----------|
| 1029384756 | John Doe     | Blood(EDTA) | Hematology  | Received | [Reject] |
| 1029384757 | John Doe     | Blood(Plain)| Biochemistry| Received | [Reject] |

[ View Department Queues ]
--------------------------------------------------------------------------------
```

### 5. Sample Rejection Screen
```
--------------------------------------------------------------------------------
Reject Sample: 1029384756 (John Doe)
--------------------------------------------------------------------------------
Reason for Rejection:
[ Hemolyzed Sample v ]

Remarks:
[ Sample was left at room temp for too long. Recollect immediately.          ]

[x] Notify Phlebotomy Desk
[x] Send SMS to Patient (if outpatient)

[ Confirm Rejection ] [ Cancel ]
--------------------------------------------------------------------------------
```

### 6. Department Queue Screen (Hematology)
```
--------------------------------------------------------------------------------
Department Queue: Hematology
--------------------------------------------------------------------------------
[Search Barcode... ] [Status: Received v] [Refresh]

| Barcode    | Patient Name | Tests | Received Time | TAT Status | Action   |
|------------|--------------|-------|---------------|------------|----------|
| 1029384756 | John Doe     | CBC   | 10:30 AM      | Normal     | [Result] |
| 1029384111 | Mike Ross    | ESR   | 08:00 AM      | Delayed(!) | [Result] |

[ Send to Analyzer ] [ Batch Result Entry ]
--------------------------------------------------------------------------------
```
