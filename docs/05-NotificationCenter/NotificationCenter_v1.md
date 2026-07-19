## MODULE 05: Notification Center

### 1. Executive Summary
The Notification Center is the communication engine of ABSHealthcareLite. It manages the delivery of alerts, reminders, and system messages across multiple channels (In-App, Email, SMS, and future WhatsApp). It ensures that clinicians, staff, and patients receive timely information regarding appointments, results, approvals, and system events.

### 2. Business Purpose
To improve operational responsiveness and patient engagement. By automating notifications, the system reduces missed appointments, speeds up clinical approval workflows, and keeps users informed without requiring them to manually check the system.

### 3. Actors
*   **System**: Automatically triggers notifications based on events.
*   **Host Admin**: Configures global notification providers and templates.
*   **Company Admin**: Manages company-specific notification settings and opt-outs.
*   **End User (Doctor/Patient/Staff)**: Receives and manages their own notification inbox.

### 4. Functional Requirements
*   **Multi-Channel Delivery**: Support for In-App (Web), Email, and SMS.
*   **Template Management**: Create and edit multilingual templates with placeholders (e.g., "Dear {{PatientName}}, your result is ready").
*   **Event-Based Triggers**: Link notifications to system events (e.g., `OnOrderCreated`, `OnPaymentReceived`).
*   **Notification Inbox**: A dedicated UI for users to view and mark messages as read.
*   **Preference Management**: Allow users to opt-in/out of specific notification types per channel.
*   **Batch Processing**: Handle high-volume notifications (e.g., daily schedule reminders) via background jobs.
*   **Delivery Tracking**: Track status (Sent, Delivered, Failed, Read).

### 5. Non-Functional Requirements
*   **Reliability**: Notifications must be queued and retried upon failure.
*   **Latency**: Critical alerts (e.g., "High Lab Value") must be delivered within seconds.
*   **Scalability**: Support for thousands of concurrent notifications during peak hours.
*   **Privacy**: Sensitive PHI must be masked or excluded from non-secure channels like SMS/Email.

### 6. Screen List
1.  **Notification Inbox**: Personal list of messages for the logged-in user.
2.  **Template Editor**: Admin UI to manage message content and placeholders.
3.  **Notification Settings**: Configure providers (SMTP, SMS Gateway) and global rules.
4.  **Delivery Logs**: Monitor the status of all outgoing messages.
5.  **User Preferences**: Personal settings for notification frequency and channels.

### 7. ASCII Mockups

**Notification Inbox**
```
--------------------------------------------------------------------------------
Notifications (3 Unread)
--------------------------------------------------------------------------------
[x] Mark All as Read  [ Filter: All v ]

( ) [Urgent] Lab result ready for Patient: John Doe      | 10 mins ago
( ) [Billing] Payment received for Invoice #9901         | 1 hour ago
(x) [System] Your password was changed successfully      | 2 hours ago
( ) [Appointment] New appointment scheduled for 2:00 PM  | 5 hours ago

[ View All ] [ Settings ]
--------------------------------------------------------------------------------
```

**Template Editor**
```
--------------------------------------------------------------------------------
Template Editor: Appointment Reminder
--------------------------------------------------------------------------------
Channel: [ SMS v ]  Language: [ English v ]

Template Body:
[ Dear {{PatientName}}, this is a reminder for your appointment with 
  {{DoctorName}} on {{ApptDate}} at {{ApptTime}}. ]

Placeholders: {{PatientName}}, {{DoctorName}}, {{ApptDate}}, {{ApptTime}}

[ Save Template ] [ Send Test ] [ Cancel ]
--------------------------------------------------------------------------------
```

### 8. Workflow
1.  **Event Occurs**: A doctor signs a lab report.
2.  **Trigger Check**: The system identifies that `OnReportSigned` has an active notification rule.
3.  **Template Rendering**: The system fetches the template and replaces placeholders with actual data.
4.  **Queueing**: The message is added to `AI_NotificationQueue`.
5.  **Delivery**: A background service picks up the message and sends it via the configured provider (e.g., SMS Gateway).
6.  **Status Update**: The queue record is updated to "Sent" or "Failed".

### 9. Business Rules
*   **Company Scoping**: Notifications are sent within the context of a `CompanyId`.
*   **Opt-Out**: Marketing notifications must honor opt-out requests; clinical alerts may be mandatory.
*   **Privacy**: SMS/Email must not contain detailed diagnosis or sensitive results; instead, provide a link to the secure portal.
*   **Retry Logic**: Failed messages are retried 3 times with exponential backoff.

### 10. Database Design

**Table: AI_NotificationTemplate**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TemplateID | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | No | NULL for Global, else Tenant ID |
| EventCode | NVARCHAR(50) | Yes | e.g., APPT_REMINDER |
| Channel | NVARCHAR(20) | Yes | INAPP, EMAIL, SMS |
| LanguageCode | NVARCHAR(10) | Yes | EN, BN, AR, etc. |
| Subject | NVARCHAR(200) | No | For Email |
| Body | NVARCHAR(MAX) | Yes | Template text with {{tags}} |

**Table: AI_NotificationQueue**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| NotificationID | BIGINT (Identity)| Yes | Primary Key |
| CompanyId | INT | Yes | Tenant context |
| RecipientID | INT | Yes | UserID of the recipient |
| Channel | NVARCHAR(20) | Yes | INAPP, EMAIL, SMS |
| Subject | NVARCHAR(200) | No | Rendered subject |
| Body | NVARCHAR(MAX) | Yes | Rendered body |
| Status | NVARCHAR(20) | Yes | Pending, Sent, Failed, Read |
| RetryCount | INT | Yes | Number of attempts |
| ErrorMessage | NVARCHAR(MAX) | No | For failed deliveries |
| CreatedDate | DATETIME | Yes | Timestamp |
| SentDate | DATETIME | No | When it actually left the system |

### 11. Security Design
*   **Encryption**: Email/SMS provider credentials must be encrypted in the database.
*   **Secure Links**: Links in notifications should use short-lived, signed tokens.

### 12. Audit Design
*   **Audit Trail**: Log when a template is modified or when a global provider setting is changed.

### 13. API Ready Design
*   **Endpoints**: `/api/v1/notifications/inbox`, `/api/v1/notifications/mark-read`, `/api/v1/notifications/send-custom`.

### 14. Mobile Ready Design
*   **Push Notifications**: Integration with Firebase (FCM) or Apple (APNs) for mobile app alerts.

### 15. Localization Requirements
*   **Multilingual Templates**: Separate templates for each supported language (English, Bangla, Arabic, Urdu, Hindi).
*   **RTL Support**: In-app notifications must render RTL for Arabic/Urdu.

### 16. Future Expansion Plan
*   **WhatsApp Integration**: Add WhatsApp as a delivery channel.
*   **AI-Driven Timing**: Send non-urgent notifications when the user is most likely to be active.

### 17. Acceptance Criteria
*   **Delivery**: A test notification is successfully received via Email and SMS.
*   **Templating**: Placeholders are correctly replaced with real data.
*   **Inbox**: The user can see the message in their web-based notification bell icon.
*   **Isolation**: User in Company A never receives a notification intended for Company B.
