## Doctor Worklist & Encounter: Screen Flow

### 1. Overview
The flow follows the doctor's daily clinical routine, from managing the queue to completing a consultation.

### 2. Flow Diagram
```
[ Doctor Worklist ]
      |
      +--(Select Patient)--> [ Encounter Dashboard ]
                                    |
                                    +--> [ Vitals Entry ]
                                    |
                                    +--> [ Clinical Assessment ]
                                    |
                                    +--> [ Diagnosis Entry ]
                                    |
                                    +--> [ SOAP Notes ]
                                    |
                                    +--> [ Prescription / Orders ]
                                    |
                                    +--> [ Follow-up Planner ]
                                    |
                                    v
                             [ Encounter Close ]
```

### 3. Navigation Logic
*   **Queue Management**: The `Worklist` is the persistent home screen.
*   **Context Switching**: Selecting a patient locks the UI context to that `PatientId` and `EncounterId`.
*   **Tabbed Interface**: The `Encounter Dashboard` uses tabs for rapid switching between Vitals, History, and Plan.
