## Patient Portal & Self Service: Screen Flow

### 1. Overview
This flow illustrates the patient's journey from initial registration and authentication through the various self-service capabilities offered by the portal.

### 2. Flow Diagram
```
[ Patient / Delegate ]
      |
      v
[ Registration / Activation ]
      |
      +--> OTP Verification (Mobile/Email)
      |
      v
[ Secure Login ]
      |
      v
[ Patient Dashboard ]
      |
      +--> [ Profile Management ] -> Update Demographics / Preferences
      |
      +--> [ Appointment Self-Service ]
      |      |
      |      +--> Book / Reschedule / Cancel -> Syncs with Module 17
      |
      +--> [ Report Center (Vault) ]
      |      |
      |      +--> View Lab/Rad Reports -> Download PDF
      |      +--> View Discharge Summaries
      |
      +--> [ Prescription Viewer ] -> View Active/Past Meds
      |
      +--> [ Billing Portal ]
      |      |
      |      +--> View Invoices -> (Future: Online Payment)
      |
      +--> [ Messaging Center ]
      |      |
      |      +--> Send/Receive Secure Messages with Care Team
      |
      +--> [ Family Access Management ] -> Grant/Revoke Delegate Access
```
