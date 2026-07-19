## Doctor Worklist & Encounter: Wireframe Mockups

### 1. Doctor Worklist (Desktop)
```
+------------------------------------------------------------------+
| Sidebar (Clinical) | Header: Dr. Ahmed Khan | Dept: Cardiology   |
+-------------------|----------------------------------------------+
| [Menu]            | Doctor Worklist - June 07, 2026              |
| - Worklist        |----------------------------------------------|
| - History         | [ Waiting (5) ] [ Current (1) ] [ Done (12) ]|
| - Reports         |----------------------------------------------|
|                   | | Token | Patient Name | Type | Status | Act |
|                   | |-------|--------------|------|--------|-----|
|                   | | 042   | John Doe     | OPD  | Wait   | [C] |
|                   | | 043   | Jane Smith   | F-up | Wait   | [C] |
|                   |----------------------------------------------|
|                   | [ Emergency Call ] [ Telemed Session ]       |
+------------------------------------------------------------------+
```

### 2. Vitals Entry (Mobile/Tablet)
```
+--------------------------+
| [=] Vitals Entry     [S] |
+--------------------------+
| Patient: John Doe        |
|--------------------------|
| Temp (C):  [ 37.2  ]     |
| Pulse:     [ 72    ]     |
| BP (Sys):  [ 120   ]     |
| BP (Dia):  [ 80    ]     |
| SpO2 (%):  [ 98    ]     |
| Weight(kg):[ 75    ]     |
|--------------------------|
| [ Save Vitals ] [ Clear ]|
+--------------------------+
```

### 3. Clinical Note Entry (SOAP)
```
--------------------------------------------------------------------------------
Encounter > Clinical Notes (SOAP)
--------------------------------------------------------------------------------
Subjective:
[ Patient reports persistent chest pain for 2 days, worse on exertion.        ]

Objective:
[ Clear breath sounds, no pedal edema. BP 120/80.                             ]

Assessment:
[ Suspected stable angina.                                                    ]

Plan:
[ Order ECG, Troponin-I. Start Aspirin 75mg.                                  ]

[ Save Note ] [ Version History ] [ Print Summary ]
--------------------------------------------------------------------------------
```
