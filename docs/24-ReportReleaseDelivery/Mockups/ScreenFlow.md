## Report Release & Delivery: Screen Flow

### 1. Overview
This flow illustrates the final journey of a laboratory result, from clinical approval to secure delivery into the hands of the patient or referring physician.

### 2. Flow Diagram
```
[ Approved Result ] (From Module 23)
      |
      v
[ Release Blocking Matrix Check ]
      |
      +--> [ Blocked ] (e.g., Unpaid Bill, Quality Hold) --> [ Resolution Workflow ]
      |
      +--> [ Cleared ]
             |
             v
[ Release Queue Dashboard ] (Report Release Officer)
      |
      +--> [ Select Report for Release ]
             |
             v
[ Identity Verification / Delivery Selection ]
      |
      +--> Counter Delivery
      |      |
      |      +--> Log Recipient ID -> [ Print Report ] -> Status: "Released"
      |
      +--> Digital Delivery
             |
             +--> [ Publish to Patient Portal ]
             |
             +--> [ Send Secure Email/WhatsApp Link ]
             |
             +--> Status: "Released"
                    |
                    v
          [ Patient Access ] (Portal/Link)
                    |
                    +--> [ View / Download PDF ] -> Logged in Access Audit
                    |
                    v
          [ External Verification ] (Third Party)
                    |
                    +--> Scans QR Code -> [ Verification Portal ] -> Authenticity Confirmed
```
