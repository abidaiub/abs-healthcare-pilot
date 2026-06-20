export type Patient = {
  id: string;
  name: string;
  gender: "M" | "F";
  dob: string;
  age: number;
  phone: string;
  bloodGroup: string;
  emergencyContact: string;
  address?: string;
  lastVisit?: string;
};

export type Doctor = {
  code: string;
  name: string;
  specialty: string;
  qualification: string;
  department: string;
  chamberDays: string;
  fee: number | null;
};

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorCode: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  reason: string;
  status: "Completed" | "Waiting" | "Scheduled" | "In Progress" | "Cancelled";
  token?: number;
};

export type WorklistItem = {
  token: number;
  appointmentId: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: "M" | "F";
  time: string;
  reason: string;
  status: "Waiting" | "In Progress" | "Completed";
  waitMinutes: number;
};

export const DEPARTMENTS = [
  "Medicine",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Gynecology",
  "Pediatrics",
  "Dermatology",
  "ENT",
  "Urology",
  "Nephrology",
  "Emergency",
] as const;

export const DOCTORS: Doctor[] = [
  {
    code: "DR-1001",
    name: "Dr. Shafiqul Islam",
    specialty: "Internal Medicine",
    qualification: "MBBS, FCPS (Medicine)",
    department: "Medicine",
    chamberDays: "Sat-Thu",
    fee: 1000,
  },
  {
    code: "DR-1002",
    name: "Dr. Farhana Rahman",
    specialty: "Gynecology",
    qualification: "MBBS, DGO, FCPS (Obs & Gynae)",
    department: "Gynecology",
    chamberDays: "Sun-Thu",
    fee: 1200,
  },
  {
    code: "DR-1003",
    name: "Dr. Kazi Tariq",
    specialty: "Cardiology",
    qualification: "MBBS, MD (Cardiology)",
    department: "Cardiology",
    chamberDays: "Mon-Wed-Fri",
    fee: 1500,
  },
  {
    code: "DR-1004",
    name: "Dr. Ayesha Siddiqa",
    specialty: "Pediatrics",
    qualification: "MBBS, DCH, FCPS (Pediatrics)",
    department: "Pediatrics",
    chamberDays: "Sat-Thu",
    fee: 1000,
  },
  {
    code: "DR-1005",
    name: "Dr. Hasan Mahmud",
    specialty: "Neurology",
    qualification: "MBBS, MD (Neurology)",
    department: "Neurology",
    chamberDays: "Sun-Tue-Thu",
    fee: 1500,
  },
  {
    code: "DR-1006",
    name: "Dr. Ruma Begum",
    specialty: "Dermatology",
    qualification: "MBBS, DDV, MCPS",
    department: "Dermatology",
    chamberDays: "Sat-Wed",
    fee: 800,
  },
  {
    code: "DR-1007",
    name: "Dr. Imran Hasan",
    specialty: "Orthopedics",
    qualification: "MBBS, MS (Ortho)",
    department: "Orthopedics",
    chamberDays: "Mon-Thu",
    fee: 1200,
  },
  {
    code: "DR-1008",
    name: "Dr. Nazma Khatun",
    specialty: "ENT",
    qualification: "MBBS, DLO, FCPS (ENT)",
    department: "ENT",
    chamberDays: "Sun-Thu",
    fee: 1000,
  },
];

export const PATIENTS: Patient[] = [
  {
    id: "PT-260001",
    name: "Mohammad Ali",
    gender: "M",
    dob: "12-Jan-1975",
    age: 51,
    phone: "+880 17 1111 0001",
    bloodGroup: "O+",
    emergencyContact: "+880 17 1111 0002",
    address: "House 14, Road 5, Dhanmondi, Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260002",
    name: "Nusrat Jahan",
    gender: "F",
    dob: "05-Mar-1988",
    age: 38,
    phone: "+880 17 1111 0003",
    bloodGroup: "B+",
    emergencyContact: "+880 17 1111 0004",
    address: "Flat 3B, Green Valley, Gulshan, Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260003",
    name: "Rafiqul Islam",
    gender: "M",
    dob: "22-Aug-1960",
    age: 65,
    phone: "+880 17 1111 0005",
    bloodGroup: "A+",
    emergencyContact: "+880 17 1111 0006",
    address: "12 Mirpur DOHS, Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260004",
    name: "Fatima Begum",
    gender: "F",
    dob: "15-Nov-1955",
    age: 70,
    phone: "+880 17 1111 0007",
    bloodGroup: "AB+",
    emergencyContact: "+880 17 1111 0008",
    address: "Mohammadpur, Dhaka",
    lastVisit: "10-Jun-2026",
  },
  {
    id: "PT-260005",
    name: "Tariq Rahman",
    gender: "M",
    dob: "30-Sep-1992",
    age: 33,
    phone: "+880 17 1111 0009",
    bloodGroup: "O-",
    emergencyContact: "+880 17 1111 0010",
    address: "Banani, Dhaka",
    lastVisit: "08-Jun-2026",
  },
  {
    id: "PT-260006",
    name: "Sadia Akter",
    gender: "F",
    dob: "10-Feb-2001",
    age: 25,
    phone: "+880 17 1111 0011",
    bloodGroup: "B-",
    emergencyContact: "+880 17 1111 0012",
    address: "Uttara Sector 7, Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260007",
    name: "Kamal Hossain",
    gender: "M",
    dob: "18-Jul-1980",
    age: 45,
    phone: "+880 17 1111 0013",
    bloodGroup: "A-",
    emergencyContact: "+880 17 1111 0014",
    address: "Wari, Old Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260008",
    name: "Ayesha Siddiqa",
    gender: "F",
    dob: "25-Dec-2015",
    age: 10,
    phone: "+880 17 1111 0015",
    bloodGroup: "O+",
    emergencyContact: "+880 17 1111 0016",
    address: "Bashundhara R/A, Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260009",
    name: "Hasan Mahmud",
    gender: "M",
    dob: "04-Apr-1995",
    age: 31,
    phone: "+880 17 1111 0017",
    bloodGroup: "B+",
    emergencyContact: "+880 17 1111 0018",
    address: "Farmgate, Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260010",
    name: "Farhana Chowdhury",
    gender: "F",
    dob: "14-Oct-1985",
    age: 40,
    phone: "+880 17 1111 0019",
    bloodGroup: "AB-",
    emergencyContact: "+880 17 1111 0020",
    address: "Elephant Road, Dhaka",
    lastVisit: "15-Jun-2026",
  },
  {
    id: "PT-260011",
    name: "Abdul Karim",
    gender: "M",
    dob: "02-Jun-1968",
    age: 58,
    phone: "+880 17 1111 0021",
    bloodGroup: "O+",
    emergencyContact: "+880 17 1111 0022",
    address: "Jatrabari, Dhaka",
    lastVisit: "14-Jun-2026",
  },
  {
    id: "PT-260012",
    name: "Sumaiya Islam",
    gender: "F",
    dob: "08-Sep-1998",
    age: 27,
    phone: "+880 17 1111 0023",
    bloodGroup: "A+",
    emergencyContact: "+880 17 1111 0024",
    address: "Mirpur-10, Dhaka",
    lastVisit: "12-Jun-2026",
  },
];

export const APPOINTMENTS: Appointment[] = [
  {
    id: "APT-001",
    patientId: "PT-260001",
    patientName: "Mohammad Ali",
    doctorCode: "DR-1001",
    doctorName: "Dr. Shafiqul Islam",
    department: "Medicine",
    date: "18-Jun-2026",
    time: "10:00 AM",
    reason: "Routine Checkup",
    status: "Completed",
    token: 1,
  },
  {
    id: "APT-002",
    patientId: "PT-260002",
    patientName: "Nusrat Jahan",
    doctorCode: "DR-1002",
    doctorName: "Dr. Farhana Rahman",
    department: "Gynecology",
    date: "18-Jun-2026",
    time: "10:15 AM",
    reason: "Pregnancy Follow-up",
    status: "Completed",
    token: 2,
  },
  {
    id: "APT-003",
    patientId: "PT-260003",
    patientName: "Rafiqul Islam",
    doctorCode: "DR-1003",
    doctorName: "Dr. Kazi Tariq",
    department: "Cardiology",
    date: "18-Jun-2026",
    time: "10:30 AM",
    reason: "Chest Pain",
    status: "Completed",
    token: 3,
  },
  {
    id: "APT-004",
    patientId: "PT-260008",
    patientName: "Ayesha Siddiqa",
    doctorCode: "DR-1004",
    doctorName: "Dr. Ayesha Siddiqa",
    department: "Pediatrics",
    date: "18-Jun-2026",
    time: "11:00 AM",
    reason: "Fever",
    status: "Completed",
    token: 4,
  },
  {
    id: "APT-005",
    patientId: "PT-260009",
    patientName: "Hasan Mahmud",
    doctorCode: "DR-1005",
    doctorName: "Dr. Hasan Mahmud",
    department: "Neurology",
    date: "18-Jun-2026",
    time: "11:15 AM",
    reason: "Migraine",
    status: "Completed",
    token: 5,
  },
  {
    id: "APT-006",
    patientId: "PT-260006",
    patientName: "Sadia Akter",
    doctorCode: "DR-1006",
    doctorName: "Dr. Ruma Begum",
    department: "Dermatology",
    date: "18-Jun-2026",
    time: "11:30 AM",
    reason: "Skin Rash",
    status: "Waiting",
    token: 6,
  },
  {
    id: "APT-007",
    patientId: "PT-260007",
    patientName: "Kamal Hossain",
    doctorCode: "DR-1007",
    doctorName: "Dr. Imran Hasan",
    department: "Orthopedics",
    date: "18-Jun-2026",
    time: "12:00 PM",
    reason: "Knee Pain",
    status: "Waiting",
    token: 7,
  },
  {
    id: "APT-008",
    patientId: "PT-260010",
    patientName: "Farhana Chowdhury",
    doctorCode: "DR-1008",
    doctorName: "Dr. Nazma Khatun",
    department: "ENT",
    date: "18-Jun-2026",
    time: "12:15 PM",
    reason: "Ear Infection",
    status: "Waiting",
    token: 8,
  },
  {
    id: "APT-009",
    patientId: "PT-260011",
    patientName: "Abdul Karim",
    doctorCode: "DR-1009",
    doctorName: "Dr. Mahmudur Rahman",
    department: "Urology",
    date: "18-Jun-2026",
    time: "12:30 PM",
    reason: "Kidney Stones",
    status: "Scheduled",
    token: 9,
  },
  {
    id: "APT-010",
    patientId: "PT-260004",
    patientName: "Fatima Begum",
    doctorCode: "DR-1010",
    doctorName: "Dr. Shirin Sultana",
    department: "Nephrology",
    date: "18-Jun-2026",
    time: "02:00 PM",
    reason: "Dialysis Consult",
    status: "Scheduled",
    token: 10,
  },
  {
    id: "APT-011",
    patientId: "PT-260005",
    patientName: "Tariq Rahman",
    doctorCode: "DR-1001",
    doctorName: "Dr. Shafiqul Islam",
    department: "Medicine",
    date: "18-Jun-2026",
    time: "02:30 PM",
    reason: "High BP",
    status: "Scheduled",
    token: 11,
  },
  {
    id: "APT-012",
    patientId: "PT-260012",
    patientName: "Sumaiya Islam",
    doctorCode: "DR-1002",
    doctorName: "Dr. Farhana Rahman",
    department: "Gynecology",
    date: "18-Jun-2026",
    time: "03:00 PM",
    reason: "PCOS Consult",
    status: "Scheduled",
    token: 12,
  },
];

export const WORKLIST: WorklistItem[] = [
  {
    token: 6,
    appointmentId: "APT-006",
    patientId: "PT-260006",
    patientName: "Sadia Akter",
    age: 25,
    gender: "F",
    time: "11:30 AM",
    reason: "Skin Rash",
    status: "Waiting",
    waitMinutes: 18,
  },
  {
    token: 7,
    appointmentId: "APT-007",
    patientId: "PT-260007",
    patientName: "Kamal Hossain",
    age: 45,
    gender: "M",
    time: "12:00 PM",
    reason: "Knee Pain",
    status: "Waiting",
    waitMinutes: 12,
  },
  {
    token: 8,
    appointmentId: "APT-008",
    patientId: "PT-260010",
    patientName: "Farhana Chowdhury",
    age: 40,
    gender: "F",
    time: "12:15 PM",
    reason: "Ear Infection",
    status: "Waiting",
    waitMinutes: 8,
  },
  {
    token: 11,
    appointmentId: "APT-011",
    patientId: "PT-260005",
    patientName: "Tariq Rahman",
    age: 33,
    gender: "M",
    time: "02:30 PM",
    reason: "High BP",
    status: "Waiting",
    waitMinutes: 0,
  },
  {
    token: 1,
    appointmentId: "APT-001",
    patientId: "PT-260001",
    patientName: "Mohammad Ali",
    age: 51,
    gender: "M",
    time: "10:00 AM",
    reason: "Routine Checkup",
    status: "Completed",
    waitMinutes: 0,
  },
  {
    token: 2,
    appointmentId: "APT-002",
    patientId: "PT-260002",
    patientName: "Nusrat Jahan",
    age: 38,
    gender: "F",
    time: "10:15 AM",
    reason: "Pregnancy Follow-up",
    status: "Completed",
    waitMinutes: 0,
  },
];

export function getDoctorWorklist(doctorCode: string): WorklistItem[] {
  const doctorAppointments = APPOINTMENTS.filter(
    (a) => a.doctorCode === doctorCode && a.date === "18-Jun-2026",
  );

  return doctorAppointments
    .map((appt) => {
      const patient = PATIENTS.find((p) => p.id === appt.patientId);
      const worklist = WORKLIST.find((w) => w.appointmentId === appt.id);

      return {
        token: appt.token ?? 0,
        appointmentId: appt.id,
        patientId: appt.patientId,
        patientName: appt.patientName,
        age: patient?.age ?? 0,
        gender: patient?.gender ?? "M",
        time: appt.time,
        reason: appt.reason,
        status:
          appt.status === "Completed"
            ? "Completed"
            : appt.status === "Waiting"
              ? "Waiting"
              : "Waiting",
        waitMinutes: worklist?.waitMinutes ?? 0,
      } satisfies WorklistItem;
    })
    .sort((a, b) => a.token - b.token);
}

export function searchPatients(query: string): Patient[] {
  const q = query.trim().toLowerCase();
  if (!q) return PATIENTS;

  return PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.phone.includes(q),
  );
}

export function getDashboardStats() {
  const today = APPOINTMENTS.filter((a) => a.date === "18-Jun-2026");

  return {
    totalPatients: PATIENTS.length,
    todayAppointments: today.length,
    waiting: today.filter((a) => a.status === "Waiting").length,
    completed: today.filter((a) => a.status === "Completed").length,
    scheduled: today.filter((a) => a.status === "Scheduled").length,
    activeDoctors: DOCTORS.length,
  };
}

export const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
