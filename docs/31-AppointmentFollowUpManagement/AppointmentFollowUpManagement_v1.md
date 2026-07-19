## MODULE 31: Appointment & Follow-Up Management

### 1. Executive Summary
The Appointment & Follow-Up Management module is the central scheduling engine for ABSHealthcareLite. It orchestrates outpatient (OPD) visits, telemedicine sessions, and post-discharge follow-ups. By bridging the gap between patient demand (via the Patient Portal or Call Center) and doctor availability, this module maximizes clinical throughput, minimizes no-shows through automated reminders, and ensures continuity of care via structured follow-up tracking.

### 2. Business Purpose
To optimize doctor utilization and improve patient access to care. Inefficient scheduling leads to long wait times, frustrated patients, and lost revenue from empty slots or unmanaged no-shows. This module provides a unified, multi-channel booking system that enforces scheduling rules, tracks follow-up compliance, and provides real-time queue visibility.

### 3. Actors
*   **Patient / Guardian**: Requests and manages their own appointments via the portal.
*   **Front Desk / Appointment Desk Officer**: Books, reschedules, and checks in patients.
*   **Call Center Agent**: Books appointments over the phone.
*   **Doctor**: Sets availability, blocks leave, and views their daily roster.
*   **Nurse / Telemedicine Coordinator**: Manages the waiting list and virtual queues.
*   **Department Admin**: Configures doctor schedules and slot rules.
*   **Hospital Administrator**: Analyzes no-show rates and revenue optimization.
*   **System Administrator**: Manages global notification templates and API integrations.

### 4. Functional Requirements

#### A. Appointment Booking
*   **Types**: New, Existing, Follow-up, Referral, Emergency, Telemedicine.
*   **Data Captured**: Patient, Branch, Department, Doctor, Date, Time Slot, Visit Type, Source, Reason, Priority, Language Preference.

#### B. Doctor Schedule Management
*   **Configuration**: Chamber/session setup, weekly recurring schedules, date-specific overrides.
*   **Blocking**: Holiday blocking, leave blocking, and emergency unavailability (which automatically triggers reschedule workflows for affected patients).

#### C. Appointment Slot Management
*   **Modes**: Fixed time slots (e.g., 10:00 AM), Token-based serial (e.g., Token #5), Walk-in serial.
*   **Rules**: Overbooking limits, maximum patients per session, slot duration, and buffer time between slots.

#### D. Follow-Up Management
*   **Sources**: Prescriptions, Discharge Summaries, Investigation Reports, Chronic Care Plans.
*   **Tracking**: Due date, responsible doctor, reason, and compliance status (Attended, Missed, Rescheduled).

#### E. Patient Portal Booking (Integration with Module 30)
*   **Capabilities**: Self-booking, reschedule requests, cancellation requests, doctor availability viewing, and appointment confirmation.

#### F. Appointment Status Workflow
*   `Draft` → `Requested` (Portal) → `Confirmed` → `Checked-In` → `Waiting` → `In Consultation` → `Completed`.
*   **Exceptions**: `No-Show`, `Cancelled`, `Rescheduled`.

#### G. Check-In & Token Management
*   **Workflow**: Front desk check-in generates a Token/Serial number.
*   **Future Readiness**: Kiosk check-in, QR check-in, and Queue Display Board integration.

#### H. Cancellation & Reschedule
*   **Tracking**: Reason, cancelled by, timestamp, reschedule reference link, and patient notification status.

#### I. Appointment Reminder System
*   **Channels**: SMS, WhatsApp, Email, Portal Notification.
*   **Triggers**: Immediately after booking, 24 hours before, 2 hours before, and Follow-up overdue alerts.

#### J. Waiting List Management
*   **Workflow**: Add to waitlist, prioritize, auto-promote when a slot opens, and notify patient.

#### K. Visit Conversion
*   Convert an appointment into an OPD Encounter, Telemedicine Encounter, Admission Request, or Investigation Order.

#### L. No-Show Management
*   Track no-show counts, reasons, and apply rebooking rules or future watchlist flags.

#### M. Appointment Payment Readiness
*   Support for booking fees, consultation fees, advance payments, and future online payment/refund workflows.

#### N. Multi-Channel Booking
*   Sources: Front desk, Call center, Patient portal, Mobile app, Doctor referral, WhatsApp, API.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All schedules, appointments, and waitlists are strictly scoped by `CompanyId`.
*   **Auditability**: 100% traceability of who booked, cancelled, or checked in a patient.
*   **Localization**: UI, SMS templates, and portal views support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Appointment Dashboard (Overview)
2.  New Appointment Booking Screen
3.  Doctor Schedule Setup
4.  Slot Calendar View
5.  Waiting List Screen
6.  Check-In & Token Screen
7.  Follow-Up Planner
8.  Reminder Management Screen
9.  No-Show & Reschedule Screen
10. Appointment Reports Dashboard

### 7. Detailed ASCII Mockups
*(See `docs/31-AppointmentFollowUpManagement/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/31-AppointmentFollowUpManagement/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **Duplicate Prevention**: A patient cannot have duplicate active appointments for the same doctor in the same slot.
*   **Leave Enforcement**: Blocking a doctor's schedule prevents any new bookings for that period.
*   **Reschedule Linkage**: A rescheduled appointment must retain a reference to the original appointment ID for audit purposes.
*   **Portal Approval**: Depending on tenant configuration, portal bookings may require manual hospital confirmation before moving to `Confirmed`.
*   **Cancellation Cutoff**: Cancellations after a configured cutoff time (e.g., 2 hours before) may require supervisor approval or forfeit the booking fee.

### 10. Database Design

**Table: DoctorSchedule**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ScheduleId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | |
| DoctorId | INT (FK) | Yes | |
| DepartmentId | INT (FK) | Yes | |
| DayOfWeek | INT | No | 1-7 for recurring |
| SpecificDate | DATE | No | For overrides |
| StartTime | TIME | Yes | |
| EndTime | TIME | Yes | |
| SlotDuration | INT | Yes | Minutes |
| MaxPatients | INT | Yes | |
| IsLeave | BIT | Yes | 1 if blocking time |

**Table: Appointment**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ApptId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BranchId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| DoctorId | INT (FK) | Yes | |
| ApptDate | DATE | Yes | |
| ApptTime | TIME | No | Null if serial-only |
| SerialNo | INT | No | Token number |
| VisitType | NVARCHAR(50) | Yes | New, Follow-up, Telemed |
| SourceChannel| NVARCHAR(50) | Yes | Portal, Desk, CallCenter |
| Status | NVARCHAR(50) | Yes | Confirmed, Checked-In... |

**Table: AppointmentStatusHistory**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| HistoryId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ApptId | BIGINT (FK)| Yes | |
| OldStatus | NVARCHAR(50) | Yes | |
| NewStatus | NVARCHAR(50) | Yes | |
| ChangedBy | INT (FK) | Yes | |
| ChangedOn | DATETIME | Yes | |

**Table: AppointmentWaitingList**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| WaitListId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| DoctorId | INT (FK) | Yes | |
| TargetDate | DATE | Yes | |
| Priority | INT | Yes | |
| Status | NVARCHAR(20) | Yes | Waiting, Promoted, Cancelled |

**Table: AppointmentReminder**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ReminderId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ApptId | BIGINT (FK)| Yes | |
| ReminderType | NVARCHAR(50) | Yes | 24Hr, 2Hr, FollowUp |
| Channel | NVARCHAR(20) | Yes | SMS, Email, WhatsApp |
| SentTime | DATETIME | No | |
| Status | NVARCHAR(20) | Yes | Pending, Sent, Failed |

**Table: AppointmentReschedule**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RescheduleId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| OldApptId | BIGINT (FK)| Yes | |
| NewApptId | BIGINT (FK)| Yes | |
| Reason | NVARCHAR(200)| Yes | |
| RequestedBy | INT (FK) | Yes | |

**Table: AppointmentCancellation**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CancelId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ApptId | BIGINT (FK)| Yes | |
| Reason | NVARCHAR(200)| Yes | |
| CancelledBy | INT (FK) | Yes | |
| CancelledOn | DATETIME | Yes | |

**Table: FollowUpPlan**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PlanId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| SourceType | NVARCHAR(50) | Yes | Discharge, Prescription |
| SourceId | BIGINT | Yes | |
| TargetDoctorId| INT (FK) | Yes | |
| DueDate | DATE | Yes | |
| Reason | NVARCHAR(200)| Yes | |
| ComplianceStatus| NVARCHAR(50)| Yes | Pending, Attended, Missed |

**Table: AppointmentPayment**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PaymentId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ApptId | BIGINT (FK)| Yes | |
| Amount | DECIMAL | Yes | |
| PaymentMode | NVARCHAR(50) | Yes | Cash, Card, Online |
| Status | NVARCHAR(20) | Yes | Paid, Refunded |

*Note: All tables include `CreatedBy`, `CreatedDate`, `ModifiedBy`, `ModifiedDate`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `DoctorId`, `PatientId`, `ApptDate`, and `Status`.*

### 11. Reports
*   **Daily Appointment Register**: Roster of all patients for the day.
*   **Doctor/Department/Branch-wise Report**: Volume and utilization analytics.
*   **No-Show Report**: Analysis of missed appointments by demographic or doctor.
*   **Follow-Up Due & Compliance Report**: Tracking clinical continuity success rates.
*   **Waiting List Report**: Demand analysis for overbooked doctors.
*   **Cancellation & Reschedule Report**: Operational bottleneck analysis.
*   **Source Channel Report**: Where bookings are originating (Portal vs Desk).
*   **Appointment Revenue Report**: Financial reconciliation for booking fees.

### 12. Dashboard Cards
*   Today's Appointments (Count)
*   Checked-In / Waiting (Count)
*   No-Shows Today (Count / Alert)
*   Portal Requests Pending (Count)
*   Follow-Ups Overdue (Count)
*   Waitlist Size (Count)

### 13. Acceptance Criteria
*   **Appointment Lifecycle**: A booking successfully moves from `Confirmed` to `Checked-In` to `Completed`.
*   **Schedule Control**: Adding a Leave block for a doctor automatically prevents new bookings and flags existing bookings for reschedule.
*   **Portal Integration**: A patient booking via the portal appears immediately on the Front Desk dashboard.
*   **Follow-Up Compliance**: If a patient attends an appointment linked to a `FollowUpPlan`, the plan status automatically updates to `Attended`.
*   **Notification Readiness**: The system queues SMS reminders based on the `ApptDate` and `ApptTime`.
*   **Auditability**: Every status change is permanently logged in `AppointmentStatusHistory`.
*   **SaaS Tenant Isolation**: Schedules, appointments, and SMS templates are strictly isolated by `CompanyId`.
*   **Localization**: The booking interface and SMS messages support RTL languages (Arabic/Urdu).

### Appendix A – Enterprise Enhancements

#### 1. AI Appointment Demand Prediction
*   **Architecture**: Machine learning models analyzing historical booking data, seasonality, and local events to predict high-demand periods, allowing admins to adjust doctor schedules proactively.

#### 2. Smart Doctor Slot Optimization
*   **Architecture**: Algorithm that dynamically adjusts `SlotDuration` based on the specific patient's history (e.g., a complex chronic patient automatically gets a 30-min slot, while a routine follow-up gets 10 mins).

#### 3. Automated Waiting List Promotion
*   **Architecture**: When a cancellation occurs, the system automatically promotes the highest-priority patient from the `AppointmentWaitingList`, sends an SMS offer, and requires a 15-minute SMS reply to confirm the slot.

#### 4. Smart No-Show Risk Scoring
*   **Architecture**: AI model assigning a "No-Show Probability Score" to every booking based on patient history, distance from hospital, and weather. High-risk patients trigger automated phone calls from the Call Center.

#### 5. Queue Display Board Integration
*   **Architecture**: API endpoints feeding real-time `SerialNo` and `Status` data to smart TVs in the waiting areas, including audio announcements (e.g., "Token Number 5, please proceed to Room 2").

#### 6. Kiosk Self Check-In
*   **Architecture**: Integration with physical hospital kiosks where patients scan their portal QR code to automatically change their status to `Checked-In` and print a physical token ticket.

#### 7. WhatsApp Conversational Booking
*   **Architecture**: Integration with WhatsApp Business API allowing patients to book, reschedule, or cancel appointments via an automated chatbot conversation.

#### 8. Corporate / Insurance Appointment Authorization
*   **Architecture**: Workflow requiring front desk staff to capture an insurance pre-authorization code before an appointment can be moved to `Confirmed`.

#### 9. Family Appointment Booking
*   **Architecture**: Allowing a single portal user to book consecutive slots for multiple family members (e.g., a mother booking pediatric checkups for two children back-to-back).

#### 10. Multi-Branch Doctor Schedule Sharing
*   **Architecture**: For doctors practicing across multiple hospital branches, the system provides a unified calendar view to prevent double-booking across different physical locations.

### Appendix B – Enterprise Scheduling & Patient Access Enhancements

#### 1. Recurring Appointment Management
*   **Overview**: Support for patients requiring ongoing, scheduled care without manual rebooking.
*   **Capabilities**: Weekly appointments, monthly appointments, dialysis schedules, physiotherapy schedules, oncology schedules, and chronic disease follow-ups.
*   **New Entity**: `RecurringAppointmentPlan` (Must include `CompanyId`).

#### 2. Resource Scheduling
*   **Overview**: Prevents double-booking of physical assets required for an appointment.
*   **Capabilities**: An appointment may require and lock a specific Room, OT consultation room, Equipment, Procedure chair, or Dialysis machine.

#### 3. Provider Substitution Workflow
*   **Overview**: Graceful handling of sudden doctor unavailability.
*   **Capabilities**: Assign a substitute doctor to the existing slot, automatically notify the patient of the change, track the reassignment reason, and preserve the audit trail of the original booking.

#### 4. Group Appointment Support
*   **Overview**: Scheduling for multi-patient sessions.
*   **Capabilities**: Antenatal classes, diabetes education, nutrition sessions, and health awareness programs. Includes tracking of maximum capacity limits per session.

#### 5. Referral Appointment Tracking
*   **Overview**: Closing the loop on provider-to-provider referrals.
*   **Capabilities**: Track internal referrals (e.g., GP to Cardiologist) and external referrals. Includes referral completion tracking and referral feedback tracking back to the originating doctor.

#### 6. Corporate & Insurance Scheduling
*   **Overview**: Specialized booking rules for B2B healthcare.
*   **Capabilities**: Corporate patient booking, insurance authorization requirement gates, priority scheduling rules for VIP clients, and employer-sponsored health check mass-booking.

#### 7. Queue Performance Analytics
*   **Overview**: Advanced KPIs to measure outpatient efficiency.
*   **KPIs**: Average waiting time (Check-in to Consult), Average consultation delay, Doctor utilization rate, No-show percentage, Cancellation percentage, and Reschedule percentage.

#### 8. Appointment Capacity Planning
*   **Overview**: Strategic data to help hospital administrators balance supply and demand.
*   **Capabilities**: Track slot utilization, doctor utilization, department demand, and seasonal demand. Prepares the data foundation for future AI forecasting models.

#### 9. Patient Arrival Tracking
*   **Overview**: Granular tracking of the patient's physical journey through the clinic.
*   **Statuses**: `Not Arrived`, `Arrived` (in building), `Checked-In` (at desk), `Waiting` (at clinic), `In Consultation`, `Completed`. Captures exact timestamps for each transition.

#### 10. Escalation & Service Recovery
*   **Overview**: Automated triggers to prevent poor patient experiences.
*   **Capabilities**: Long waiting alert (e.g., waiting > 45 mins), missed appointment recovery workflows, VIP escalation protocols, and complaint-linked appointment handling.

#### 11. Appointment Communication Log
*   **Overview**: Centralized audit of all outbound patient contact regarding their schedule.
*   **Capabilities**: Track SMS, WhatsApp, Email, Phone calls, and Portal notifications. Store Sent status, Delivery status, and Failure reasons.

#### 12. Self-Service Family Booking
*   **Overview**: Extending the patient portal to support household management.
*   **Capabilities**: Parent booking for a child, child booking for an elderly parent, or caregiver booking. Must integrate directly with the Module 30 `PatientPortalDelegation` model.