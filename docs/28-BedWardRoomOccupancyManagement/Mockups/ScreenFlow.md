## Bed, Ward, Room & Occupancy Management: Screen Flow

### 1. Overview
This flow illustrates the lifecycle of a hospital bed, from reservation and patient occupancy through transfer, discharge, and housekeeping turnaround.

### 2. Flow Diagram
```
[ Admission Request ] (From OPD / ER)
      |
      +--> Bed Unavailable? -> [ Waitlist Queue ]
      |
      +--> Bed Available?
             |
             v
[ Bed Reservation Screen ] -> Status: "Reserved"
             |
             v
[ Admission Finalized ] -> Status: "Occupied"
             |
             +--> [ Bed Occupancy Record Created (Start Time) ]
             |
             v
[ Ward Stay ] (Patient receives care)
             |
             +--> Transfer Required? (e.g., Ward to ICU)
             |      |
             |      v
             |    [ Bed Transfer Screen ]
             |      |
             |      +--> Old Bed Status: "Cleaning Required"
             |      +--> Old Bed Occupancy: Closed (End Time)
             |      +--> New Bed Status: "Occupied"
             |      +--> New Bed Occupancy: Opened (Start Time)
             |
             v
[ Discharge Process ]
             |
             v
[ Bed Status: "Cleaning Required" ]
             |
             v
[ Housekeeping Queue ]
             |
             +--> [ Mark Cleaned ]
                    |
                    v
          [ Bed Status: "Available" ]
```
