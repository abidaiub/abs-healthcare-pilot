## Appointment Management: Screen Flow

### 1. Overview
The flow covers the journey from a patient requesting a visit to the completion of the consultation.

### 2. Flow Diagram
```
[ Reception Dashboard ]
      |
      +--> [ Appointment Booking ] --(Success)--> [ Confirmation SMS ]
      |         |
      |         v
      +--> [ Arrival Check-in ] --(Issue Token)--> [ Queue Monitor ]
      |                                              |
      |                                              v
      +-------------------------------------- [ Doctor Worklist ]
                                                     |
                                                     v
                                              [ Visit Completed ]
```

### 3. Step-by-Step Flow
1.  **Booking**: Receptionist or Patient selects a Doctor and an available Slot.
2.  **Confirmation**: System sends a reminder 24h before.
3.  **Arrival**: Patient arrives; Receptionist marks status as `Arrived`.
4.  **Queue**: System assigns a `Token Number` and adds to the `Waiting` list.
5.  **Consultation**: Doctor calls the Token; status moves to `In Consultation`.
6.  **Completion**: Doctor finishes the visit; status moves to `Completed`.
