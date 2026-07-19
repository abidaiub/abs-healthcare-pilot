## Prescription Management: Screen Flow

### 1. Overview
The flow follows the clinical decision-making process, starting from the diagnosis and ending with a finalized, printable document.

### 2. Flow Diagram
```
[ Doctor Worklist ]
      |
      v
[ Open Encounter ] (Module 18)
      |
      v
[ Add Diagnosis / Problems ]
      |
      v
[ Create Prescription ]
      |
      +--> [ Add Medicine Items ] (Dosage, Frequency, Duration)
      |
      +--> [ Add Non-Medicine Advice ] (Diet, Rest, Lifestyle)
      |
      +--> [ Add Investigation Advice ] (Lab/Imaging Orders)
      |
      +--> [ Add Follow-up ] (Return Date/Instructions)
      |
      v
[ Preview Prescription ] (Multilingual/RTL Check)
      |
      v
[ Finalize Prescription ] (Locks Record)
      |
      +--> [ Print PDF ]
      |
      +--> [ Share via Portal/SMS/WhatsApp ]
      |
      v
[ Patient Profile History ] (Module 16)
```

### 3. Revision Flow
```
[ Finalized Prescription ]
      |
      v
[ Click "Revise" ]
      |
      v
[ System Creates New Draft Version ]
      |
      v
[ Edit Items/Advice ]
      |
      v
[ Re-Finalize ] (Old version moved to History)
```
