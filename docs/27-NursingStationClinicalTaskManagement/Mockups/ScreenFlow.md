## Nursing Station & Clinical Task Management: Screen Flow

### 1. Overview
This flow illustrates the daily operational loop of a nurse managing patient care on the ward, from acknowledging doctor orders to executing tasks and managing escalations.

### 2. Flow Diagram
```
[ Doctor Order Entry ]
      |
      v
[ Nursing Dashboard ] (Ward Overview)
      |
      +--> [ New Orders Alert ] -> [ Acknowledge Order ] -> Generates Tasks
      |
      +--> [ Patient Census ] -> Select Patient
             |
             +--> [ Vitals Entry Screen ]
             |      |
             |      +--> Normal -> Save
             |      |
             |      +--> Critical -> Auto-prompt: [ Raise Escalation ]
             |
             +--> [ Clinical Task Board ]
             |      |
             |      +--> Select Task -> [ Complete Task ] -> Log Time
             |
             +--> [ Nursing Notes ] -> Add Progress/Shift Note
             |
             +--> [ MAR Dashboard ] (Links to Module 26)
      |
      v
[ End of Shift ]
      |
      v
[ Shift Handover Screen ]
      |
      +--> Review Pending Tasks & Critical Patients
      |
      +--> Outgoing Nurse Signs Off -> Incoming Nurse Acknowledges
```
