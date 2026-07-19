## Patient Registration: User Workflow

### 1. Registering a New Patient (Receptionist)
1.  Navigate to `Patient Search`.
2.  Ask for the patient's phone number and enter it.
3.  If no results, click `Register New Patient`.
4.  Capture the patient's photo using the webcam.
5.  Enter `First Name`, `Last Name`, `DOB`, and `Gender`.
6.  Enter `NID` or `Passport` if available.
7.  Enter `Address` and `Emergency Contact`.
8.  Click `Save`.
9.  System performs a final duplicate check.
10. System generates MRN and displays the success message.
11. Click `Print Registration Slip` to give a copy to the patient.

### 2. Merging Duplicate Records (Admin)
1.  Navigate to `MPI Tools > Merge Patients`.
2.  Search for the first patient (Duplicate).
3.  Search for the second patient (Survivor).
4.  Compare the data side-by-side.
5.  Click `Merge`.
6.  System moves all history to the Survivor record and archives the Duplicate.
7.  System logs the merge action in the `Audit Trail`.

### 3. Updating Patient Status (Front Desk)
1.  Search and open the `Patient Profile`.
2.  Click `Edit`.
3.  Change `Status` from `Active` to `Deceased` (requires date and certificate number).
4.  Click `Save`.
5.  System stops all future appointments and marketing SMS.
