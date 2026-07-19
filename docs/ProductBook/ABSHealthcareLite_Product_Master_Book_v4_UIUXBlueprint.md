# ABSHealthcareLite Product Master Book
## Volume 4 – UI/UX Blueprint & Design System

---

## SECTION 1: EXECUTIVE SUMMARY

The **ABSHealthcareLite Product Master Book Volume 4 – UI/UX Blueprint & Design System** serves as the definitive guide for the user experience (UX), user interface (UI), and interaction design of the ABSHealthcareLite platform. 

*   **Purpose:** To establish a unified, scalable, and clinically safe design language that ensures consistency across all modules, tenants, and devices.
*   **Relationship with Product Books:** While Volume 1 outlines the vision, Volume 2 details the functional catalog, and Volume 3 provides the implementation roadmap, Volume 4 dictates *how the user interacts* with those functions.
*   **Relationship with Architecture Documents:** This blueprint aligns with the System Layer Architecture, ensuring that UI components are decoupled from business logic, supporting the transition from ASP.NET WebForms to future MVC/Core and native mobile platforms, while strictly adhering to Multi-Tenant SaaS and Multilingual (RTL/LTR) requirements.

---

## SECTION 2: DESIGN PHILOSOPHY

The ABSHealthcareLite design philosophy is built on ten core principles:

1.  **Healthcare First:** Clinical safety supersedes aesthetics. Critical patient data (allergies, alerts) must never be hidden behind clicks.
2.  **Speed First:** High-volume areas (Registration, Billing, Pharmacy) must support rapid data entry.
3.  **Safety First:** Destructive actions (which are soft-deletes) and critical clinical decisions require explicit confirmation.
4.  **Low Click Operations:** Optimize workflows to minimize mouse travel and click fatigue.
5.  **Keyboard Friendly:** Power users must be able to navigate, enter data, and save forms using only the keyboard.
6.  **Mobile Ready:** All patient-facing and physician-facing interfaces must be responsive by default.
7.  **Accessibility Ready:** High contrast, readable typography, and clear visual hierarchy.
8.  **Multi-Language Ready:** UI must gracefully handle text expansion and contraction across languages.
9.  **RTL Ready:** Native support for Right-to-Left mirroring for Arabic and Urdu.
10. **AI Ready:** AI suggestions must be clearly distinguishable from human-entered data, requiring explicit human verification.

---

## SECTION 3: GLOBAL DESIGN SYSTEM

### Color System
*   **Primary Brand Color:** Customizable per Tenant (Company Branding Engine). Default: Medical Blue.
*   **Secondary Color:** Neutral Gray for structural elements.
*   **Status Colors:**
    *   *Success/Active:* Green
    *   *Warning/Pending:* Amber/Yellow
    *   *Danger/Critical:* Red
    *   *Info/Draft:* Light Blue

### Typography
*   **Font Family:** System-native sans-serif (e.g., Roboto, Segoe UI, San Francisco) to ensure fast loading and optimal multilingual rendering (e.g., Noto Sans Arabic, Noto Sans Bengali).
*   **Hierarchy:** Clear distinction between H1 (Page Titles), H2 (Section Headers), Body Text, and Micro-copy.

### Spacing & Layout
*   8px/16px/24px grid system.
*   High-density mode for clinical/billing grids; comfortable mode for patient portals.

### Icons & Badges
*   Universal, medically recognized iconography (e.g., standard allergy, biohazard, and prescription symbols).
*   Badges used for counts (e.g., Unread Notifications, Pending Approvals).

### Alerts & Forms
*   Toast notifications for transient success messages.
*   Persistent banners for critical patient alerts (e.g., "HIGH FALL RISK").
*   Forms use top-aligned labels for faster scanning and better RTL translation.

---

## SECTION 4: MULTI-LANGUAGE UI STANDARDS

ABSHealthcareLite is a global platform supporting:
*   **English** (LTR)
*   **Bangla** (LTR)
*   **Arabic** (RTL)
*   **Urdu** (RTL)
*   **Hindi** (LTR)

**RTL Rules:**
*   When Arabic or Urdu is selected, the entire UI matrix mirrors. Menus move to the right, text aligns right, and back/forward arrows reverse direction.
*   Numeric inputs (e.g., phone numbers, lab results) remain LTR even in RTL layouts.

**Text Expansion Handling:**
*   UI containers must allow for up to 30% text expansion, as translated words (e.g., English to Bangla) often require more horizontal space.
*   No hardcoded fixed widths for buttons or labels.

**Language Switcher:**
*   Available globally in the top navigation bar, applying changes instantly via resource files without requiring a hard logout.

---

## SECTION 5: RESPONSIVE DESIGN STANDARDS

*   **Desktop (1920x1080+):** Optimized for complex grids, multi-panel clinical views, and high-density data entry.
*   **Tablet (768x1024 to 1024x1366):** Optimized for touch. Used heavily in Nursing Stations, Bedside MAR, and Doctor rounds.
*   **Mobile (375x667 to 428x926):** Optimized for single-column vertical scrolling. Target for Patient Portal, Telemedicine, and Doctor quick-approvals.
*   **Kiosk (1080x1920 Portrait):** High-contrast, large touch targets for self-check-in and queue token generation.

---

## SECTION 6: NAVIGATION STANDARDS

*   **Host Admin Navigation:** Global system settings, tenant provisioning, cross-tenant analytics. (Left Sidebar).
*   **Tenant Admin Navigation:** Hospital-specific master data, user management, financial settings. (Left Sidebar).
*   **Doctor Navigation:** Patient-centric. Worklist, EMR, ePrescription, Telemedicine. (Top-level tabs with left-side patient context).
*   **Nurse Navigation:** Ward-centric. Bed board, Task list, MAR. (Visual grid navigation).
*   **Reception Navigation:** Fast-action centric. Registration, Appointment, Billing. (Keyboard-shortcut optimized).
*   **Lab/Radiology Navigation:** Queue-centric. Pending samples, Result entry, Verification.
*   **Patient Portal Navigation:** Simple, consumer-friendly bottom tab bar (Mobile) or top header (Desktop).

---

## SECTION 7: STANDARD SCREEN TYPES

1.  **List Screen:** (e.g., Patient List). *Layout:* Search/Filter top, Data Grid middle, Pagination bottom. *Actions:* Add New, Export, Bulk Action.
2.  **Entry Screen:** (e.g., Add User). *Layout:* Form fields grouped by logical sections. *Actions:* Save, Save & New, Cancel.
3.  **Dashboard Screen:** (e.g., Executive KPI). *Layout:* Widget/Card based. *Actions:* Date range filter, Drill-down.
4.  **Approval Screen:** (e.g., Result Verification). *Layout:* Split screen (Data on left, Approval controls on right). *Actions:* Approve, Reject, Return for Correction.
5.  **Wizard Screen:** (e.g., Initial Tenant Setup). *Layout:* Progress tracker top, Step content middle, Prev/Next bottom.
6.  **Report Screen:** (e.g., Daily Collection). *Layout:* Parameter selection left/top, Report viewer right/bottom.
7.  **Print Screen:** Clean, unstyled layout optimized for A4/A5 physical printing with header/footer branding.
8.  **Portal/Mobile Screen:** Consumer-grade, large touch targets, simplified terminology.

---

## SECTION 8: FORM DESIGN STANDARDS

*   **Patient Forms:** Must clearly separate Demographics, Clinical History, and Billing Info.
*   **Billing Forms:** Must feature a persistent "Total/Due" sticky footer.
*   **Prescription Forms:** Generic-first search, structured dosage dropdowns, prominent allergy warnings.
*   **Lab Forms:** Fast numeric keypad entry for results, visual flags for out-of-range values.
*   **Admission Forms:** Bed selection visual map, deposit collection integration.
*   **Validation Rules:** Inline real-time validation (red borders for errors) before form submission. Mandatory fields marked with an asterisk (*).

---

## SECTION 9: DATA GRID STANDARDS

*   **Search:** Global quick search per grid.
*   **Filter:** Advanced collapsible filter panels for complex queries.
*   **Sort:** Clickable column headers with visual ascending/descending indicators.
*   **Pagination:** Standardized page sizes (10, 25, 50, 100) with total record counts.
*   **Export:** Universal export to Excel, CSV, and PDF.
*   **Bulk Actions:** Checkbox column for multi-select (e.g., Bulk Approve).
*   **Column Personalization:** Users can hide/show/reorder columns, saved to their User Profile preferences.

---

## SECTION 10: DASHBOARD DESIGN STANDARDS

*   **Executive Dashboard:** High-level KPIs (Revenue, Occupancy, Patient Volume). Visual charts (Pie, Bar, Line).
*   **Doctor Dashboard:** Clinical focus. Today's appointments, pending reports, critical alerts.
*   **Lab Dashboard:** Operational focus. TAT (Turnaround Time) gauges, pending verifications, machine status.
*   **Billing Dashboard:** Financial focus. Daily collection, outstanding dues, discount summaries.
*   **Patient Dashboard:** Health focus. Upcoming appointments, recent lab results, active medications.
*   **Host Dashboard:** SaaS focus. Active tenants, system health, license expirations.

---

## SECTION 11: WORKFLOW UX STANDARDS

Optimal click paths designed for speed:
*   **Patient Registration:** Mobile No. -> Check MPI -> Auto-fill -> Save. (Target: < 30 seconds).
*   **Appointment:** Select Doctor -> Select Date -> Click Slot -> Confirm. (Target: 4 clicks).
*   **Prescription:** Select Patient -> Add Dx -> Search Generic -> Select Route/Dose/Duration -> Save & Print.
*   **Investigation Billing:** Scan Barcode/Enter PID -> Select Tests -> Collect Payment -> Print Receipt & Barcode.
*   **Admission:** ER/OPD Request -> Select Bed -> Collect Deposit -> Generate IPD No.
*   **Discharge:** Clinical Clearance -> Pharmacy Clearance -> Final Bill Generation -> Settlement -> Release Bed.
*   **Telemedicine:** Click Link -> Device Test -> Virtual Waiting Room -> Join Call.
*   **AI Verification:** AI Extracts Data -> Highlights mapped fields -> User reviews side-by-side -> Clicks "Verify & Save".

---

## SECTION 12: ACCESSIBILITY STANDARDS

*   **Keyboard Navigation:** Full `Tab` index support. `Enter` to submit, `Esc` to close modals.
*   **Color Contrast:** Minimum WCAG AA compliance (4.5:1 ratio) for text against backgrounds.
*   **Screen Reader Readiness:** ARIA labels on all critical functional icons and dynamic alerts.
*   **Touch Target Sizes:** Minimum 44x44 pixels for all actionable elements on mobile/tablet views.
*   **Accessibility Compliance Readiness:** Architecture designed to support future strict government accessibility mandates.

---

## SECTION 13: AUDIT & SECURITY UX

*   **Approval Indicators:** Digital signature badges showing "Verified by Dr. X on [Date]".
*   **Permission Indicators:** Disabled/Grayed-out buttons with tooltip "Insufficient Permission" rather than hiding the button entirely, to aid discoverability.
*   **Audit Indicators:** A standard "History" or "Log" icon on every major entity to view the CRUD audit trail.
*   **Sensitive Data Indicators:** PII (Personally Identifiable Information) masking (e.g., `+1-***-***-7890`) with a "Click to Reveal" eye icon for authorized users.
*   **AI Decision Indicators:** AI-generated suggestions must have a distinct visual treatment (e.g., a sparkle icon or purple border) and a confidence score percentage.

---

## SECTION 14: NOTIFICATION UX

*   **Alert Priorities:**
    *   *Critical (Red):* Panic values, system downtime. Modal popup requiring acknowledgment.
    *   *High (Orange):* Bed transfer requests, STAT orders. Persistent top banner.
    *   *Info (Blue):* Normal lab result ready, appointment booked. Toast notification.
*   **Channels:** UI integrates seamlessly with SMS, Email, WhatsApp, Portal, and Push Notification dispatchers, showing delivery status logs.

---

## SECTION 15: MODULE SCREEN CATALOG

*Summary of core screens per module (01-32, 40):*

*   **01 Company/Tenant:** Tenant List, Tenant Setup Wizard, Branding Configuration.
*   **02 User Management:** User Grid, User Profile Entry, Password Reset Modal.
*   **03 Role Permission:** Role List, Permission Matrix Grid.
*   **04 Audit Center:** Global Audit Log Grid, Entity History Modal.
*   **05 Notification Center:** Notification Template Builder, Dispatch Log.
*   **06 Localization:** Dictionary Grid, Language Switcher UI.
*   **07 Branch Location:** Branch List, Branch Details.
*   **08 Department:** Department Hierarchy Tree, Department Entry.
*   **09 Category:** Category List, Sub-category mapping.
*   **10 Master Service:** Service Catalog Grid, Pricing Matrix, CPT Mapping.
*   **11 Doctor:** Doctor Profile, Schedule Builder, Commission Setup.
*   **12 Referral Doctor:** Referral List, Referral Portal Dashboard.
*   **13 Ward Cabin Bed:** Visual Bed Board, Ward Entry.
*   **14 Diagnostic Inventory:** Stock Ledger, PO Wizard, GRN Entry.
*   **15 Patient Registration:** MPI Search, Registration Form, Smart Card Print.
*   **16 Patient Profile Ledger:** Patient 360 Dashboard, Ledger Grid.
*   **17 Appointment:** Calendar View, Queue Display Board, Token Print.
*   **18 Doctor Worklist:** OPD Queue List, Clinical Encounter Workspace.
*   **19 Prescription:** CPOE Interface, Drug Interaction Alert Modal, Rx Print.
*   **20 Pharmacy:** POS Screen, Dispense Queue, Batch Expiry Dashboard.
*   **21 Sample Collection:** Phlebotomy Worklist, Barcode Generation, Acknowledgement Print.
*   **22 Result Entry:** Analyzer Interface, Manual Entry Grid, Delta Check Alerts.
*   **23 Result Verification:** Pathologist Worklist, Side-by-Side Verification Screen.
*   **24 Report Release:** Delivery Dashboard, PDF Viewer, Email/WhatsApp Dispatch.
*   **25 Radiology:** Modality Worklist, DICOM Viewer Integration, Dictation Interface.
*   **26 MAR:** Bedside Tablet View, Med Administration Grid, Witness Sign-off Modal.
*   **27 Nursing Station:** Ward Dashboard, Vitals Flowsheet, Task List.
*   **28 Bed Occupancy:** Real-time Occupancy Heatmap, Transfer Wizard.
*   **29 Discharge:** Discharge Summary Builder, Clearance Checklist, Final Bill.
*   **30 Patient Portal:** Mobile-first Home, Appointment Booker, Report Downloader.
*   **31 Appt Follow-Up:** Recall List, CRM Communication Log.
*   **32 Telemedicine:** Virtual Waiting Room, Video Consultation UI, Chat Panel.
*   **40 AI Prescription Capture:** Image Upload/Camera UI, AI Extraction Review Split-Screen.

---

## SECTION 16: SAMPLE DATA STANDARDS

To ensure consistent UI testing and training, official sample data profiles must be used:
*   **Patient:** John Doe (Male, 45), Amina Begum (Female, 32).
*   **Doctor:** Dr. Sarah Smith (Cardiology), Dr. Ahmed Khan (Pathology).
*   **Lab Order:** Complete Blood Count (CBC), Lipid Profile.
*   **Admission:** General Ward, Bed A1.
*   **Prescription:** Paracetamol 500mg (1-1-1), Amoxicillin.
*   **Invoice:** Standard OPD Consultation + Lab Tests.
*   **Report:** Normal CBC Report, Abnormal Lipid Profile (for flag testing).
*   **Telemedicine Session:** Standard 15-minute follow-up.
*   **AI Prescription:** Scanned handwritten image mapped to Paracetamol.

---

## SECTION 17: MASTER MENU ARCHITECTURE

*   **Host Menu:** Dashboard, Tenants, Global Settings, License Management, Host Audit.
*   **Tenant Menu:** Dashboard, Hospital Setup, Master Data, User Management, Reports.
*   **Department Menus:** Contextual. (e.g., "Laboratory" menu shows Sample Collection, Result Entry, Verification).
*   **Role Menus:** Dynamically generated based on Module 03 (Role Permissions).
*   **Portal Menus:** Home, My Appointments, My Reports, My Prescriptions, Profile.
*   **Mobile Menus:** Bottom tab bar: Home | Appointments | Records | More.

---

## SECTION 18: DESIGN TOKENS & FUTURE Figma READINESS

To bridge the gap between UI design and development, ABSHealthcareLite will utilize **Design Tokens**:
*   **Design Tokens:** Variables for colors (`--color-primary`), typography (`--font-size-h1`), and spacing (`--spacing-md`) stored in JSON/CSS variables.
*   **Component Library:** Standardized UI components (Buttons, Inputs, Modals) ready for future React/Angular/Blazor componentization.
*   **Theme Engine:** Allows tenants to inject their brand colors dynamically.
*   **Dark Mode Readiness:** UI tokens support automatic inversion for a future Dark Mode release (critical for Radiology reading rooms).
*   **Branding Engine:** Tenant logos automatically scale and fit into headers, reports, and patient portals.

---

## SECTION 19: MOCKUP DEVELOPMENT ROADMAP

*   **Phase 1 - Core Screens:** Login, Dashboard, Patient Registration, Master Data Grids.
*   **Phase 2 - Clinical Screens:** Doctor Worklist, EMR Encounter, Prescription (CPOE).
*   **Phase 3 - Diagnostic Screens:** Billing POS, Sample Collection, Result Entry, Verification.
*   **Phase 4 - IPD Screens:** Visual Bed Board, Nursing Station, MAR, Discharge.
*   **Phase 5 - Portal + Telemedicine:** Patient Mobile App screens, Video UI.
*   **Phase 6 - AI Screens:** AI Prescription Capture review interfaces.

---

## SECTION 20: APPENDIX A - STANDARD PAGE TEMPLATES

### 1. Standard List / Grid Template
```text
--------------------------------------------------------------------------------
[Logo] ABSHealthcareLite | [Branch] Main Hospital | [User] Dr. Smith | [Logout]
--------------------------------------------------------------------------------
[Left Nav]    |  PAGE TITLE: Patient List
[Dashboard]   |  ---------------------------------------------------------------
[Patients ]   |  [ Search Name/ID... ] [ Filter ]            [ + Add Patient ]
[Appts    ]   |  ---------------------------------------------------------------
[Billing  ]   |  | ID    | Name         | Gender | Phone      | Action       |
[Lab      ]   |  |-------|--------------|--------|------------|--------------|
[Pharmacy ]   |  | P001  | John Doe     | M      | 555-0101   | [View] [Edit]|
[Settings ]   |  | P002  | Amina Begum  | F      | 555-0102   | [View] [Edit]|
              |  ---------------------------------------------------------------
              |  Showing 1-10 of 500 records                     [< Prev] [Next >]
--------------------------------------------------------------------------------
```

### 2. Standard Entry / Form Template
```text
--------------------------------------------------------------------------------
[Left Nav]    |  PAGE TITLE: Add New Patient
              |  ---------------------------------------------------------------
              |  DEMOGRAPHICS
              |  First Name: [_____________]   Last Name: [_____________]
              |  DOB:        [__/__/____ ]   Gender:    [v Dropdown  ]
              |  
              |  CONTACT INFO
              |  Phone:      [_____________]   Email:     [_____________]
              |  
              |  ---------------------------------------------------------------
              |  [ Cancel ]                                       [ Save Patient ]
--------------------------------------------------------------------------------
```

### 3. Split-Screen Approval / AI Review Template
```text
--------------------------------------------------------------------------------
[Left Nav]    |  PAGE TITLE: AI Prescription Verification
              |  ---------------------------------------------------------------
              |  [ SOURCE IMAGE / DOCUMENT ]    |  [ EXTRACTED DATA (AI) ]
              |                                 |  
              |  +-------------------------+    |  Patient: [ John Doe       ]
              |  | (Scanned handwritten    |    |  
              |  |  prescription image     |    |  Medication:
              |  |  displayed here)        |    |  [ Paracetamol 500mg     ] (98%)
              |  |                         |    |  Dose: [ 1-1-1           ] (95%)
              |  +-------------------------+    |  
              |                                 |  [ Reject AI ]  [ Verify & Save ]
--------------------------------------------------------------------------------
```

---

## SECTION 21: APPENDIX B - ABSHEALTHCARELITE DESIGN COMMANDMENTS

1.  **Maximum information with minimum clicks:** Flatten navigation where possible.
2.  **Never hide critical patient information:** Allergies, blood type, and critical alerts must be universally visible in the patient header.
3.  **Safety before aesthetics:** Contrast and readability trump modern "minimalist" faded text.
4.  **Auditability before convenience:** Never allow a user to bypass a required audit reason for a deletion or modification.
5.  **Mobile readiness by default:** Design for the smallest screen first for all patient and doctor-facing apps.
6.  **Localization by default:** Never hardcode English text in the UI layer; always use resource keys.
7.  **AI recommendations never bypass human approval:** AI is an assistant, not a doctor. Human-in-the-loop is mandatory.

---

## SECTION 22: CONCLUSION

The **ABSHealthcareLite UI/UX Blueprint** establishes a rigorous, standardized approach to product design. By adhering to these guidelines, the development and design teams will ensure that the platform remains intuitive, clinically safe, and highly efficient. 

This design system guarantees that as ABSHealthcareLite scales—from ASP.NET WebForms to future MVC/Core APIs, and from desktop web to native mobile apps—the user experience will remain consistent, accessible, and fully compliant with the platform's multi-tenant, multilingual, and AI-governed architectural vision.