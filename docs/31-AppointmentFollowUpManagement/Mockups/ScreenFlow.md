## Appointment & Follow-Up Management: Screen Flow

### 1. Overview
This flow illustrates the lifecycle of an outpatient appointment, from initial booking through reminders, check-in, consultation, and subsequent follow-up planning.

### 2. Flow Diagram
```
[ Appointment Request ] (Portal / Call Center / Desk)
      |
      +--> [ Doctor Schedule & Slot Selection ]
             |
             +--> Slot Full? -> [ Add to Waiting List ]
             |
             +--> Slot Available? -> [ Confirm Booking ]
                    |
                    v
          [ Appointment Reminder System ] (SMS/Email at 24hr & 2hr)
                    |
                    +--> Patient Cancels? -> [ Cancellation Workflow ] -> Promote Waitlist
                    |
                    +--> Patient Arrives -> [ Check-In & Token Generation ]
                           |
                           v
                 [ Waiting Area Queue ] (Status: Waiting)
                           |
                           v
                 [ Doctor Consultation ] (Status: In Consultation)
                           |
                           v
                 [ Consultation Completed ]
                           |
                           +--> Doctor requests follow-up?
                                  |
                                  v
                        [ Follow-Up Planner ]
                                  |
                                  +--> Generates Future Due Date
                                  |
                                  v
                        [ Follow-Up Reminder System ] (Alerts patient when due)
```
