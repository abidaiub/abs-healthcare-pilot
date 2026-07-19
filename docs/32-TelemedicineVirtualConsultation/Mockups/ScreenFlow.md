## Telemedicine & Virtual Consultation: Screen Flow

### 1. Overview
This flow illustrates the end-to-end journey of a virtual consultation, from the patient checking in via the portal to the doctor issuing a remote prescription and follow-up plan.

### 2. Flow Diagram
```
[ Patient Portal ]
      |
      +--> Selects Telemedicine Appointment
      |
      v
[ Digital Consent Screen ]
      |
      +--> Agrees to Terms & Privacy Policy
      |
      v
[ Pre-Consultation Screen ]
      |
      +--> Uploads Past Reports / Photos
      |
      v
[ Virtual Waiting Room ]
      |
      +--> [ Triage by Coordinator ] (Optional: Collects chief complaint)
      |
      +--> Patient waits for Doctor
      |
      v
[ Virtual Consultation Room ] (Doctor Joins)
      |
      +--> Video/Audio Call Active
      |
      +--> Doctor reviews uploaded documents
      |
      +--> Doctor documents clinical notes
      |
      +--> Emergency Red Flag? -> [ Escalate to ER ] -> End Call
      |
      v
[ Consultation Completion ]
      |
      +--> Doctor generates ePrescription
      |
      +--> Doctor orders Investigations
      |
      +--> Doctor sets Follow-Up Date
      |
      v
[ Post-Consultation ]
      |
      +--> Patient views Prescription in Portal
      |
      +--> Billing finalized
```
