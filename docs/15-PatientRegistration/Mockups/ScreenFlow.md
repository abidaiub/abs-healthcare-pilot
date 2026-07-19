## Patient Registration: Screen Flow

### 1. Overview
The flow is designed to minimize data entry errors and prevent duplicate records.

### 2. Flow Diagram
```
[ Dashboard ]
      |
      v
[ Patient Search ] --(Not Found)--> [ New Registration ]
      |                                     |
      +--(Found)--> [ Patient Profile ] <---+
                          |
                          +--> [ Edit Profile ]
                          |
                          +--> [ Print ID Card ]
                          |
                          +--> [ Merge Records ] (Admin Only)
```

### 3. Step-by-Step Flow
1.  **Search**: Start by entering Phone or Name.
2.  **Verify**: If found, verify identity and proceed to Appointment/Billing.
3.  **Register**: If not found, open the registration form.
4.  **Validate**: System performs real-time duplicate checks.
5.  **Complete**: Save and generate MRN.
