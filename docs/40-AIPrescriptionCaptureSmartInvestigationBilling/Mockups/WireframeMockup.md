## AI Prescription Capture & Smart Investigation Billing: Wireframe Mockups

### 1. Prescription Upload Screen
```
--------------------------------------------------------------------------------
Upload Prescription | Reception Desk
--------------------------------------------------------------------------------
Patient: [ Search by Mobile / ID... ] -> John Doe (P-10001)

Source: [ Flatbed Scanner v ]

[ Drag & Drop Image/PDF Here ]
or
[ Browse Files ]

File: Rx_JohnDoe_09Jun.jpg (2.4 MB)

[ Upload & Run AI Extraction ]
--------------------------------------------------------------------------------
```

### 2. Verification Workbench
```
--------------------------------------------------------------------------------
AI Verification Queue | Status: Verification Pending
--------------------------------------------------------------------------------
+-------------------------+  Extracted Data:
|                         |  Patient: John Doe (Conf: 98%)
|    [ IMAGE VIEWER ]     |  Doctor: Dr. Alan Smith (Conf: 95%)
|    (Zoom/Pan enabled)   |  
|                         |  Investigations:
|  Highlighting bounding  |  1. [ CBC ] (Conf: 99%) -> Map: Complete Blood Count
|  boxes over text.       |  2. [ LFT ] (Conf: 96%) -> Map: Liver Function Test
|                         |  3. [ ????? ] (Conf: 45% !!) -> Needs Review
+-------------------------+
                             Correction for Item 3:
                             [ CXR PA View                  ] (Human Override)

[ Save Corrections & Proceed to Billing ]
--------------------------------------------------------------------------------
```

### 3. Smart Billing Recommendation Screen
```
--------------------------------------------------------------------------------
Billing Recommendation | John Doe | Ref: Capture-9081
--------------------------------------------------------------------------------
AI Mapped Services:
1. Complete Blood Count (CBC) - $20.00
2. Liver Function Test (LFT)  - $35.00
3. Fasting Blood Sugar (FBS)  - $15.00

!! AI PACKAGE SUGGESTION !!
The above tests are included in the "Basic Health Package".
Converting to package saves the patient $10.00.
[ Convert to Package ]

!! DUPLICATE DETECTED !!
Patient had a CBC done 2 days ago.
[ Remove CBC from Bill ]  [ Keep CBC ]

Estimated Total: $70.00

[ Approve & Generate Invoice ]  [ Edit Items ]
--------------------------------------------------------------------------------
```

### 4. AI Accuracy Dashboard
```
--------------------------------------------------------------------------------
AI Performance & Learning Dashboard | Month: June 2026
--------------------------------------------------------------------------------
[ Total Processed: 1,250 ]  [ Auto-Approved: 850 (68%) ]  [ Human Edited: 400 ]

Accuracy by Category:
| Category       | Avg Confidence | Human Correction Rate |
|----------------|----------------|-----------------------|
| Patient Name   | 95%            | 2%                    |
| Doctor Name    | 98%            | 1%                    |
| Investigations | 82%            | 18%                   |
| Medications    | 75%            | 25%                   |

Recent Human Overrides (Learning Feed):
AI Prediction: "T3" -> Human Corrected to: "FT3"
AI Prediction: "X-Ray" -> Human Corrected to: "CXR PA View"

[ Export Learning Data for Model Retraining ]
--------------------------------------------------------------------------------
```

### 5. Patient Portal Upload Status Screen
```
--------------------------------------------------------------------------------
My Health Portal | Upload Prescription
--------------------------------------------------------------------------------
Upload History:

| Date       | File Name       | Status                     | Action       |
|------------|-----------------|----------------------------|--------------|
| 09-Jun-26  | DrSmith_Rx.pdf  | Pending Billing Estimate   | [ View ]     |
| 15-May-26  | Photo_Rx.jpg    | Invoice Ready ($45.00)     | [ Pay Now ]  |
| 10-May-26  | Old_Rx.jpg      | Rejected (Image Unclear)   | [ Re-upload] |

[ Upload New Prescription ]
--------------------------------------------------------------------------------
```
