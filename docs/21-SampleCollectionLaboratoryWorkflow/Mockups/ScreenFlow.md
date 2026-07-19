## Sample Collection & Laboratory Workflow: Screen Flow

### 1. Overview
This flow traces the physical journey of a sample from the patient's arm to the laboratory analyzer queue.

### 2. Flow Diagram
```
[ Investigation Order ] (Module 20/Billing)
      |
      v
[ Order Search Screen ] (Phlebotomy Desk)
      |
      v
[ Sample Collection Screen ]
      |
      +--> System groups tests by Sample Type & Container
      |
      +--> [ Barcode Generation & Label Print ]
      |
      v
[ Physical Sample Collection ]
      |
      +--> Mark Status: "Collected"
      |
      v
[ Lab Receiving Screen ] (Central Lab Desk)
      |
      +--> Scan Barcodes
      |
      +--> [ Accept ] --> Status: "Received"
      |
      +--> [ Reject ] --> [ Rejection Screen ] --> Status: "Recollection Required"
      |
      v
[ Department Queue Screen ] (e.g., Biochemistry, Hematology)
      |
      v
[ Ready for Result Entry / Analyzer Interface ]
```
