## MODULE 17: Appointment & Queue Management

### 1. Executive Summary
The Appointment & Queue Management module is a comprehensive system designed to orchestrate patient flow within healthcare facilities. It manages the entire lifecycle of an appointment, from initial booking and scheduling to real-time queue tracking and completion. Built on a multi-tenant, branch-aware architecture, it ensures efficient resource utilization for doctors and minimal waiting times for patients.

### 2. Business Purpose
To optimize the patient experience by providing structured scheduling and transparent queue management. This module reduces congestion in waiting areas, improves doctor productivity through shift-based scheduling, and provides management with critical data on waiting times and patient throughput.

### 3. Actors
*   **Receptionist**: Books appointments, confirms arrivals, and manages the daily queue.
*   **Doctor**: Views their daily schedule and calls patients into consultation.
*   **Patient**: Books appointments via mobile app/portal and tracks their queue position.
*   **Nurse / Assistant**: Manages the patient flow outside the consultation room.
*   **Company Admin**: Configures scheduling rules, priority levels, and reminder settings.
*   **Host Admin**: Monitors global appointment statistics and system performance.

### 4. Functional Requirements

#### Appointment Management
*   **Booking**: Support for Walk-in, Scheduled, Follow-up, and Telemedicine appointments.
*   **Categorization**: Tag appointments as VIP, Corporate, Insurance, or Emergency.
*   **Lifecycle Tracking**: Status transitions: Booked → Confirmed → Arrived → Waiting → In Consultation → Completed.
*   **Cancellation & No-Show**: Track and audit all cancellations and missed appointments.

#### Doctor Scheduling
*   **Shift Management**: Define weekly schedules, shift timings, and chamber locations.
*   **Availability**: Real-time tracking of doctor availability across multiple branches.
*   **Leave & Holidays**: Automatically block slots during doctor leave or public holidays.
*   **Temporary Overrides**: Support for one-time schedule changes.

#### Queue Management
*   **Token System**: Generate unique token/serial numbers for each visit.
*   **Real-time Queue**: Live tracking of "Current Serving" and "Next Patient".
*   **Priority Handling**: Configurable priority levels (Emergency, VIP, Senior Citizen, Child, Regular).
*   **Queue Actions**: Skip, Recall, or Transfer patients between queues.

#### Reminder Engine
*   **Automated Alerts**: SMS, WhatsApp, and Email reminders triggered at 24h and 2h intervals.
*   **Custom Triggers**: Configurable rules for follow-up reminders.

#### Follow-up & Waitlist
*   **Follow-up Booking**: Direct creation of follow-up appointments by doctors.
*   **Waitlist**: Manage a waiting list for fully booked slots, with auto-promotion on cancellations.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Strict `CompanyId` scoping for all schedules and appointments.
*   **Concurrency**: Handle simultaneous bookings for the same slot without double-booking.
*   **Real-time Updates**: Queue status must reflect instantly across all monitors.
*   **Mobile Ready**: API-first design for seamless mobile app integration.

### 6. Screen List
1.  **Appointment Booking**: Central screen for searching patients and booking slots.
2.  **Doctor Schedule Setup**: Admin UI for defining shifts and availability.
3.  **Queue Monitor**: Public-facing display showing current serving tokens.
4.  **Reception Dashboard**: Overview of today's arrivals and waiting list.
5.  **Doctor Worklist**: Specialized view for doctors to call the next patient.
6.  **Leave/Holiday Manager**: Calendar-based UI for blocking dates.

### 7. Detailed ASCII Mockups

**Appointment Booking (Desktop)**
```
--------------------------------------------------------------------------------
Appointment Booking > New Entry
--------------------------------------------------------------------------------
Patient: [ Search MRN/Phone... ] [New Patient]  Branch: [ Main Branch v ]
Doctor:  [ Dr. Ahmed Khan v ]   Dept: [ Cardiology v ]  Date: [ 2026-06-07 ]

Available Slots:
[ 09:00 AM ] [ 09:15 AM ] [ 09:30 AM (VIP) ] [ 09:45 AM ]
[ 10:00 AM ] [ 10:15 AM ] [ 10:30 AM (Booked)] [ 10:45 AM ]

Appt Type: (o) Scheduled  ( ) Walk-in  ( ) Follow-up  ( ) Telemedicine
Priority:  ( ) Regular    ( ) VIP      ( ) Emergency

[ Book Appointment ] [ Send Confirmation ] [ Cancel ]
--------------------------------------------------------------------------------
```

**Queue Monitor (Public Display)**
```
--------------------------------------------------------------------------------
      CITY GENERAL HOSPITAL - CARDIOLOGY QUEUE
--------------------------------------------------------------------------------
  NOW SERVING                     NEXT PATIENTS
  
  [ TOKEN 042 ]                   043 - Waiting
  Room: 102                       044 - Waiting
  Dr. Ahmed Khan                  045 - Arrived
  
  [ TOKEN 015 ]                   016 - Waiting
  Room: 105                       017 - Arrived
  Dr. Sarah Evans                 018 - Waiting
--------------------------------------------------------------------------------
```

### 8. Workflow Diagrams
`Booking (Booked)` -> `Arrival (Arrived)` -> `Token Issued (Waiting)` -> `Doctor Calls (In Consultation)` -> `Visit Finished (Completed)`.

### 9. Business Rules
*   **CompanyId Mandatory**: Every record must belong to a tenant.
*   **Branch/Dept/Doctor Binding**: Appointments must be uniquely tied to this hierarchy.
*   **No Deletion**: Appointments are never deleted; status is changed to `Cancelled`.
*   **Leave Blocking**: Doctor leave automatically renders slots "Unavailable".
*   **Emergency Override**: Emergency tokens can be inserted at the top of the active queue.
*   **Follow-up Link**: Follow-up appointments must reference the original `ParentAppointmentId`.

### 10. Database Design

**Table: Appointment**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AppointmentId | BIGINT (Identity)| Yes | Primary Key |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | Branch Context |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| DoctorId | INT | Yes | FK to MasterDoctor |
| ApptDate | DATE | Yes | Scheduled Date |
| SlotTime | TIME | Yes | Scheduled Time |
| ApptType | NVARCHAR(20) | Yes | Walk-in, Scheduled, etc. |
| Status | NVARCHAR(20) | Yes | Booked, Arrived, etc. |
| PriorityLevel | INT | Yes | 1:Emergency to 5:Regular |

**Table: DoctorSchedule**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ScheduleId | INT (Identity) | Yes | Primary Key |
| DoctorId | INT | Yes | FK to MasterDoctor |
| DayOfWeek | INT | Yes | 0:Sun to 6:Sat |
| StartTime | TIME | Yes | Shift Start |
| EndTime | TIME | Yes | Shift End |
| SlotDuration | INT | Yes | Minutes per patient |

### 11. Security Design
*   **Row-Level Security**: Enforced by `CompanyId` and `BranchId`.
*   **Role-Based Access**: Doctors only see their own schedules; Receptionists see all.

### 12. Audit Design
*   **Status History**: Every change in `Status` is logged in `AppointmentStatusHistory`.
*   **Cancellation Audit**: Reason for cancellation and the actor must be recorded.

### 13. API Ready Design
*   Endpoints: `/api/v1/appointments/book`, `/api/v1/queue/status/{doctorId}`, `/api/v1/doctors/availability`.

### 14. Mobile Ready Design
*   Push notifications for "Your turn is next".
*   Real-time "Live Queue" view for patients.

### 15. Localization Requirements
*   **Multilingual**: Support for EN, BN, AR, UR, HI.
*   **RTL Support**: Queue monitor and booking forms must support RTL for Arabic/Urdu.

### 16. Future Expansion Plan
*   **Telemedicine**: Integration with Jitsi/Zoom for video consultations.
*   **AI Predictor**: Predict actual waiting time based on historical doctor performance.

### 17. Acceptance Criteria
*   Double-booking is prevented by the system.
*   Queue monitor updates within 2 seconds of a status change.
*   Doctor leave correctly blocks slot availability.
*   Reminders are sent at the configured intervals.

---

## Appendix A – Enterprise Appointment & Queue Enhancements

### 1. Functional Requirements

#### 1.1 DoctorSlotTemplate
*   **Template Definition**: Create reusable slot templates for different shifts (e.g., "Morning OPD", "Evening Chamber").
*   **Slot Configuration**: Define specific slots for different appointment types (e.g., 2 slots for Follow-up, 5 for New Patients).
*   **Template Application**: Apply templates to specific dates or date ranges for rapid schedule generation.

#### 1.2 QueueDisplayBoard
*   **Multi-Doctor Board**: Display current tokens for multiple doctors in a shared waiting area.
*   **Multimedia Support**: Ability to show health education videos or announcements alongside the queue.
*   **Voice Announcement**: Automated audio announcement (e.g., "Token 42, please proceed to Room 102") in multiple languages.

#### 1.3 AppointmentSource Tracking
*   **Source Attribution**: Track where the appointment originated (e.g., Walk-in, Mobile App, Patient Portal, Call Center, Referral).
*   **Analytics**: Analyze booking trends by source to optimize marketing and staffing.

#### 1.4 Self Check-In Design
*   **Kiosk Integration**: Patients can check-in by scanning their QR code or entering their MRN at a self-service kiosk.
*   **Auto-Arrived**: System automatically updates status to `Arrived` and issues a physical token printout.
*   **Payment Verification**: Check-in blocked if there are outstanding registration fees or consultation dues.

#### 1.5 Patient Portal Booking Integration
*   **Real-time Availability**: Direct integration with the patient portal to show live available slots.
*   **Online Payment**: Option to pay consultation fees during booking to confirm the slot.
*   **Reschedule/Cancel**: Patients can manage their own appointments within the allowed cancellation window.

### 2. Updated Database Design (Additional Tables/Columns)

**Table: DoctorSlotTemplate**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TemplateId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | Yes | Tenant Context |
| TemplateName | NVARCHAR(100) | Yes | e.g., Standard Morning |
| SlotDuration | INT | Yes | Minutes |
| MaxPatients | INT | Yes | Total capacity |

**Table: Appointment (Updated Columns)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| SourceCode | NVARCHAR(20) | Yes | WEB, APP, KIOSK, CALL |
| PaymentStatus | NVARCHAR(20) | Yes | PENDING, PAID, WAIVED |
| CheckInTime | DATETIME | No | Actual arrival timestamp |

### 3. Updated Business Rules
*   **Source-Based Quota**: Limit the number of portal/app bookings to reserve slots for walk-in patients.
*   **Check-In Window**: Self check-in only allowed within 30 minutes of the appointment time.
*   **Auto-Cancellation**: Unconfirmed or unpaid appointments automatically cancelled after a configurable duration.
*   **RTL Announcement**: Voice announcements must follow the primary language direction of the branch.

### 4. Updated API Design
*   **Endpoints**:
    *   `/api/v1/appointments/check-in` (POST) - For kiosk/self check-in.
    *   `/api/v1/appointments/sources` (GET) - List of available booking sources.
    *   `/api/v1/portal/available-slots` (GET) - Public-facing slot lookup.

### 5. Updated Acceptance Criteria
*   **Self Check-In**: Scanning a valid QR code at the kiosk successfully changes status to `Arrived`.
*   **Portal Integration**: Appointments booked via portal appear instantly in the Reception Dashboard with `Source = 'PORTAL'`.
*   **Display Board**: The multi-doctor display board correctly rotates through active tokens and plays audio announcements.
*   **Templates**: Applying a "Morning Template" correctly populates slots for the entire month.
