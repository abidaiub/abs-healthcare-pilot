## Report Release & Delivery: Wireframe Mockups

### 1. Release Dashboard
```
--------------------------------------------------------------------------------
Report Release Desk | Branch: Main
--------------------------------------------------------------------------------
[ Pending Release: 120 ]  [ Released Today: 345 ]  [ Blocked: 12 ]

Ready for Release:
| Order No | Patient Name | Tests          | Delivery Pref | Action        |
|----------|--------------|----------------|---------------|---------------|
| ORD-901  | John Doe     | Lipid Profile  | Counter       | [ Release ]   |
| ORD-902  | Jane Smith   | Urine Culture  | Portal/Email  | [ Release ]   |

[ Scan Patient Barcode / Enter Reg No... ]
--------------------------------------------------------------------------------
```

### 2. Patient Delivery Screen (Counter Handover)
```
--------------------------------------------------------------------------------
Release Report: ORD-901 | Patient: John Doe
--------------------------------------------------------------------------------
Status: APPROVED | Billing: CLEARED

Delivery Method: [ Counter Collection v ]

Identity Verification:
Collected By: [ Patient Himself v ]
ID Type:      [ National ID v ]
ID Number:    [ 1234567890 ]

[x] Generate QR Code for Authenticity
[x] Send SMS Notification of Release

[ Authorize Release & Print ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 3. Reprint Screen (Governance)
```
--------------------------------------------------------------------------------
Reprint Report: ORD-901 | Patient: John Doe
--------------------------------------------------------------------------------
Warning: This report was already released on 08-Jun-2026 10:00 AM.
Previous Reprints: 0

Reason for Reprint (Mandatory):
[ Patient lost the original physical copy.                                   ]

Reprint Options:
[x] Add "REPRINT" Watermark

[ Authorize Reprint ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 4. Portal Access Screen (Patient View)
```
--------------------------------------------------------------------------------
My Health Portal | Welcome, John Doe
--------------------------------------------------------------------------------
Recent Lab Reports:

| Date       | Investigation    | Status   | Action                     |
|------------|------------------|----------|----------------------------|
| 08-Jun-26  | Lipid Profile    | Final    | [ View ] [ Download PDF ]  |
| 15-May-26  | CBC              | Final    | [ View ] [ Download PDF ]  |

[ Share Report with Doctor ]
--------------------------------------------------------------------------------
```

### 5. QR Verification Screen (Public/Secure)
```
--------------------------------------------------------------------------------
ABSHealthcareLite - Document Verification Portal
--------------------------------------------------------------------------------
VERIFICATION SUCCESSFUL - AUTHENTIC DOCUMENT

Patient Name: J*** D** (Masked for privacy)
Report Date:  08-Jun-2026
Tests:        Lipid Profile
Status:       FINAL & APPROVED

This document matches the encrypted records of Main Branch Laboratory.
If the printed values differ from this screen, the document has been tampered with.

[ Download Original PDF (Requires Patient OTP) ]
--------------------------------------------------------------------------------
```

### 6. Mobile Patient View
```
+------------------------+
| < Back   My Reports    |
+------------------------+
| Lipid Profile          |
| 08-Jun-2026            |
| Status: FINAL          |
|------------------------|
| [ View Results ]       |
| [ Download PDF ]       |
| [ Share via WhatsApp ] |
|------------------------|
| Authenticity QR:       |
| [ QR CODE IMAGE ]      |
+------------------------+
```
