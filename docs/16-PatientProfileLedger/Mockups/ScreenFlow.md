## Patient Profile & Ledger: Screen Flow

### 1. Overview
The flow centers around the "360-Degree Profile" which acts as the dashboard for all patient-related activities.

### 2. Flow Diagram
```
[ Patient Search ]
      |
      v
[ 360-Degree Profile ]
      |
      +--> [ Clinical Tab ] (Prescriptions, Investigations, Reports)
      |
      +--> [ Financial Tab ] (Ledger, Payments, Dues)
      |
      +--> [ Timeline Tab ] (Journey Visualization)
      |
      +--> [ Edit Profile ] (Demographics, Alerts, Family)
```

### 3. Tab Logic
*   **Profile Summary**: Quick view of Photo, MRN, Alerts, and Current Due.
*   **Clinical History**: Filterable list of all medical encounters.
*   **Financial Ledger**: Detailed debit/credit statement with "Print Statement" option.
*   **Journey Timeline**: Visual trail of the patient's hospital experience.
