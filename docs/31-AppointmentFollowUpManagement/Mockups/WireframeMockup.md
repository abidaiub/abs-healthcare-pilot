## Appointment & Follow-Up Management: Wireframe Mockups

### 1. Appointment Dashboard
```
--------------------------------------------------------------------------------
Front Desk Dashboard | Branch: Main Hospital | Date: 09-Jun-2026
--------------------------------------------------------------------------------
[ Today's Appts: 120 ]  [ Checked-In: 45 ]  [ Waiting: 12 ]  [ No-Shows: 3 ]

Current Queue (Dr. Alan Smith - Cardiology):
| Token | Patient Name | Time     | Status       | Action         |
|-------|--------------|----------|--------------|----------------|
| 01    | John Doe     | 09:00 AM | In Consult   | [ View ]       |
| 02    | Jane Roe     | 09:15 AM | Waiting      | [ Call In ]    |
| 03    | Mike Ross    | 09:30 AM | Checked-In   | [ Mark Wait ]  |
| 04    | Sarah Connor | 09:45 AM | Confirmed    | [ Check-In ]   |

[ Book New Appointment ]  [ View Waitlist ]
--------------------------------------------------------------------------------
```

### 2. New Appointment Booking Screen
```
--------------------------------------------------------------------------------
Book Appointment
--------------------------------------------------------------------------------
Patient: [ Search by Name / Mobile / ID... ] -> John Doe (P-10001)

Department: [ Cardiology v ]
Doctor:     [ Dr. Alan Smith v ]
Date:       [ 10-Jun-2026 ]

Available Slots:
[ 09:00 AM ]  [ 09:15 AM ]  [ 09:30 AM ]  [ 09:45 AM (Booked) ]

Visit Type: [ Routine Follow-up v ]
Source:     [ Front Desk v ]
Priority:   [ Normal v ]

[ Confirm Booking ]  [ Add to Waitlist ]  [ Cancel ]
--------------------------------------------------------------------------------
```

### 3. Doctor Schedule Setup
```
--------------------------------------------------------------------------------
Manage Schedule | Dr. Alan Smith (Cardiology)
--------------------------------------------------------------------------------
Recurring Weekly Schedule:
| Day       | Start Time | End Time | Slot Duration | Max Patients | Action |
|-----------|------------|----------|---------------|--------------|--------|
| Monday    | 09:00 AM   | 01:00 PM | 15 mins       | 16           | [Edit] |
| Wednesday | 09:00 AM   | 01:00 PM | 15 mins       | 16           | [Edit] |

Leave / Block Dates:
[ 15-Jun-2026 ] to [ 20-Jun-2026 ] | Reason: [ Annual Leave ] | [ Add Block ]
* Warning: Blocking these dates will flag 45 appointments for reschedule.
--------------------------------------------------------------------------------
```

### 4. Waiting List Screen
```
--------------------------------------------------------------------------------
Waitlist Management | Dr. Alan Smith | Date: 10-Jun-2026
--------------------------------------------------------------------------------
Status: Schedule FULL (16/16 Booked)

| Patient Name | Requested Time | Priority | Added On    | Action        |
|--------------|----------------|----------|-------------|---------------|
| Tom Hanks    | Morning        | High     | 08-Jun      | [ Promote ]   |
| Bruce Wayne  | Any            | Normal   | 09-Jun      | [ Promote ]   |

[ Auto-Promote if Slot Opens: ON ]
--------------------------------------------------------------------------------
```

### 5. Check-In & Token Screen
```
--------------------------------------------------------------------------------
Patient Check-In
--------------------------------------------------------------------------------
Search Appointment: [ John Doe / 09-Jun / Dr. Smith ]

Appointment Details:
Time: 09:00 AM
Consultation Fee: $50.00
Payment Status: [ Unpaid v ] -> [ Collect Payment ]

[ Confirm Check-In & Print Token ]

-------------------------------------
| TOKEN: 01                         |
| Dr. Alan Smith (Room 102)         |
| Please wait in Lobby A.           |
-------------------------------------
--------------------------------------------------------------------------------
```

### 6. Follow-Up Planner
```
--------------------------------------------------------------------------------
Follow-Up Management
--------------------------------------------------------------------------------
[Filter: Overdue Follow-ups v]

| Patient Name | Last Visit | Due Date   | Doctor      | Compliance | Action     |
|--------------|------------|------------|-------------|------------|------------|
| Jane Roe     | 01-May-26  | 01-Jun-26  | Dr. Smith   | Missed (!) | [ Call ]   |
| Mike Ross    | 15-May-26  | 15-Jun-26  | Dr. Chang   | Pending    | [ Remind ] |

[ Send Batch SMS Reminders ]
--------------------------------------------------------------------------------
```

### 7. No-Show & Reschedule Screen
```
--------------------------------------------------------------------------------
Reschedule Appointment | John Doe
--------------------------------------------------------------------------------
Original Appointment: 09-Jun-2026 09:00 AM (Dr. Smith)
Current Status: [ No-Show v ]

Reason for Reschedule:
[ Patient called late, stuck in traffic. v ]

New Date: [ 11-Jun-2026 ]
New Slot: [ 10:00 AM ]

[x] Send SMS Confirmation for New Date
[x] Waive Rebooking Fee

[ Confirm Reschedule ]
--------------------------------------------------------------------------------
```
