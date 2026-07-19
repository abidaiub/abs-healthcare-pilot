## Result Entry & Analyzer Integration: Screen Flow

### 1. Overview
This flow illustrates the pathways a sample takes once it reaches the laboratory department queue, moving through result entry, validation, and final verification.

### 2. Flow Diagram
```
[ Department Queue ] (Samples marked as 'Received')
      |
      +-----------------------------------------+
      |                                         |
      v                                         v
[ Manual Result Entry ]                 [ Analyzer Integration ] (Future)
(Numeric, Text, Micro, Histo)           (Machine processes sample)
      |                                         |
      |                                         v
      |                                 [ Analyzer Import Queue ]
      |                                         |
      |                                         +--> [ Analyzer Error Queue ] (If unmapped/failed)
      |                                         |
      +-----------------------------------------+
      |
      v
[ Result Validation Screen ] (Lab Technologist / Scientist)
      |
      +--> System checks against Reference Ranges
      |
      +--> Is Result Critical?
             |
             +-- Yes --> [ Critical Alert Workflow ] --> Acknowledge
             |
             +-- No ---> Continue
      |
      v
[ Verification Queue ] (Pathologist / Consultant)
      |
      +--> [ Reject ] --> Back to Result Entry
      |
      +--> [ Approve ] --> Status: "Approved" (Report Ready)
             |
             +--> Post-Approval Correction? --> [ Correction Workflow ] --> New Version
```
