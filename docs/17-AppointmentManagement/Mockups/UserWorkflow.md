## Appointment Management: User Workflow

### 1. Booking a Scheduled Appointment (Receptionist)
1.  Navigate to `Appointment Booking`.
2.  Search for the Patient by Phone or MRN.
3.  Select the Branch, Department, and Doctor.
4.  View the available slots for the selected date.
5.  Click on an available slot (e.g., 09:15 AM).
6.  Select `Appt Type: Scheduled` and `Priority: Regular`.
7.  Click `Book Appointment`.
8.  System sends an automated confirmation SMS to the patient.

### 2. Managing the Live Queue (Receptionist/Nurse)
1.  When the patient arrives, find their name in the `Reception Dashboard`.
2.  Click `Arrived`.
3.  System generates a `Token Number` (e.g., 042).
4.  The `Queue Monitor` automatically updates to show Token 042 as "Waiting".
5.  When the doctor is ready, they click `Call Next` on their worklist.
6.  The `Queue Monitor` flashes Token 042 and moves it to "In Consultation".

### 3. Creating a Follow-up (Doctor)
1.  During the consultation, the doctor decides a follow-up is needed in 7 days.
2.  The doctor clicks `Create Follow-up` in the clinical module.
3.  The system auto-calculates the date and shows available slots.
4.  The doctor selects a slot and clicks `Save`.
5.  The follow-up is linked to the current visit for history tracking.

### 4. Handling a Cancellation (Patient/Admin)
1.  Patient calls to cancel or uses the mobile app.
2.  Admin finds the appointment and clicks `Cancel`.
3.  System prompts for a `Cancellation Reason`.
4.  If there is a `Waitlist` for that slot, the system notifies the next patient in line.
5.  The cancellation is logged in the `Audit Trail`.
