## AI Prescription Capture & Smart Investigation Billing: Screen Flow

### 1. Overview
This flow illustrates the journey of an unstructured prescription (image/PDF) being transformed by AI into actionable, structured billing and laboratory orders, with mandatory human oversight.

### 2. Flow Diagram
```
[ Prescription Upload ] (via Portal, Mobile, or Desk Scanner)
      |
      v
[ AI OCR & Extraction Engine ]
      |
      +--> Extracts: Patient Info, Meds, Investigations, Diagnoses
      |
      +--> Calculates Confidence Scores
      |
      v
Are all scores above Auto-Approval Threshold (e.g., 90%)?
      |
  +---+---+
 No       Yes
  |        |
  v        |
[ Verification Workbench ] (Human in the loop)
  |        |
  +--> Human corrects low-confidence items
  |        |
  +--> Logs to [ AI Learning Feedback Loop ]
  |        |
  +--------+
      |
      v
[ Smart Investigation Mapping ]
      |
      +--> AI maps "FBS" to Master Service "Fasting Blood Sugar"
      |
      +--> [ Duplicate Detection Check ] -> Alerts if recently ordered
      |
      v
[ Smart Billing Recommendation ]
      |
      +--> AI suggests individual tests or grouped Packages
      |
      v
[ Billing Officer Review ]
      |
      +--> Adjusts / Approves Estimate
      |
      v
[ Order Generation ]
      |
      +--> Creates Billing Invoice
      |
      +--> Sends Orders to Laboratory / Radiology Queues
```
