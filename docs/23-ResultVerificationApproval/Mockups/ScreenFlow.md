## Result Verification & Approval: Screen Flow

### 1. Overview
This flow illustrates the clinical governance pathway a result takes after entry, ensuring it is technically verified, clinically approved, and legally sound before release.

### 2. Flow Diagram
```
[ Result Entry Completed ]
      |
      v
[ Verification Queue ] (Filtered by Department/Role)
      |
      +--> [ Verification Screen ] (Level 1 / Level 2)
             |
             +--> Checklist Review (Delta, Ranges, Flags)
             |
             +--> [ Hold ] --> Status: "On Hold" (e.g., QC Issue)
             |
             +--> [ Escalate ] --> Routes to Supervisor/Pathologist
             |
             +--> [ Verify ]
                    |
                    v
          Is Pathologist Approval Required? (Based on Matrix)
                    |
              +-----+-----+
             Yes          No
              |           |
              v           v
[ Approval Queue ]      [ Release Ready Queue ]
      |
      v
[ Approval Dashboard ] (Pathologist View)
      |
      +--> [ Reject ] --> Back to Entry/Verification
      |
      +--> [ Approve ] --> Status: "Approved"
             |
             v
[ Release Ready Queue ] (Available for Printing/Portal)
             |
             +--> Post-Release Correction Needed?
                    |
                    v
          [ Correction Request Screen ]
                    |
                    +--> Justification & Supervisor Approval
                    |
                    v
          [ New Version Created ] (Original preserved)
```
