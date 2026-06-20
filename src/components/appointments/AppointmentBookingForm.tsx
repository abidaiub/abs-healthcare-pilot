"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, Input, Select, cn } from "@/components/ui";
import {
  DOCTORS,
  PATIENTS,
  TIME_SLOTS,
  type Appointment,
} from "@/lib/sample-data";

const APPT_TYPES = [
  "Scheduled",
  "Walk-in",
  "Follow-up",
  "Telemedicine",
] as const;

const PRIORITIES = ["Regular", "VIP", "Emergency"] as const;

export function AppointmentBookingForm({
  initialPatientId,
  branchName,
  branchCode,
  existingAppointments,
}: {
  initialPatientId?: string;
  branchName: string;
  branchCode: string;
  existingAppointments: Appointment[];
}) {
  const [patientQuery, setPatientQuery] = useState(
    initialPatientId
      ? (PATIENTS.find((p) => p.id === initialPatientId)?.name ?? "")
      : "",
  );
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [doctorCode, setDoctorCode] = useState(DOCTORS[0]?.code ?? "");
  const [apptDate, setApptDate] = useState("2026-06-18");
  const [slotTime, setSlotTime] = useState(TIME_SLOTS[2] ?? "10:00 AM");
  const [apptType, setApptType] = useState<(typeof APPT_TYPES)[number]>(
    "Scheduled",
  );
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>(
    "Regular",
  );
  const [booked, setBooked] = useState(false);

  const selectedPatient = PATIENTS.find((p) => p.id === patientId);
  const selectedDoctor = DOCTORS.find((d) => d.code === doctorCode);

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return PATIENTS.slice(0, 8);
    return PATIENTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q),
    ).slice(0, 8);
  }, [patientQuery]);

  const bookedSlots = useMemo(
    () =>
      new Set(
        existingAppointments
          .filter(
            (a) => a.date === "18-Jun-2026" && a.doctorCode === doctorCode,
          )
          .map((a) => a.time),
      ),
    [existingAppointments, doctorCode],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId) return;
    setBooked(true);
  }

  if (booked && selectedPatient && selectedDoctor) {
    return (
      <Card>
        <CardBody className="space-y-4 py-10 text-center">
          <Badge variant="success">Status: Booked</Badge>
          <h2 className="text-xl font-semibold text-slate-900">
            Appointment booked
          </h2>
          <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-slate-50 p-5 text-left text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-900">Patient:</span>{" "}
              {selectedPatient.name} ({selectedPatient.id})
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900">Doctor:</span>{" "}
              {selectedDoctor.name} — {selectedDoctor.department}
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900">Branch:</span>{" "}
              {branchName} ({branchCode})
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900">Date / slot:</span>{" "}
              {apptDate} · {slotTime}
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-900">Type:</span>{" "}
              {apptType} · {priority}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" variant="secondary">
              Send confirmation
            </Button>
            <Button type="button" onClick={() => setBooked(false)}>
              Book another appointment
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Appointment booking
          </h2>
          <p className="text-sm text-slate-500">New entry</p>
        </div>
        <CardBody className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <Input
              label="Patient"
              placeholder="Search MRN / phone..."
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value);
                setPatientId("");
              }}
              required
            />
            <Link href="/patients/new">
              <Button type="button" variant="secondary">
                New patient
              </Button>
            </Link>
          </div>

          {patientQuery && (
            <ul className="rounded-xl border border-slate-200 bg-white">
              {filteredPatients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientId(patient.id);
                      setPatientQuery(`${patient.name} (${patient.id})`);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-teal-50",
                      patientId === patient.id && "bg-teal-50",
                    )}
                  >
                    <span className="font-medium text-slate-900">
                      {patient.name}
                    </span>
                    <span className="text-slate-500">
                      {patient.id} · {patient.phone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Branch"
              value={`${branchName} (${branchCode})`}
              readOnly
              className="bg-slate-50"
            />
            <Select
              label="Department"
              value={selectedDoctor?.department ?? ""}
              onChange={(e) => {
                const doctor = DOCTORS.find((d) => d.department === e.target.value);
                if (doctor) setDoctorCode(doctor.code);
              }}
            >
              {[...new Set(DOCTORS.map((d) => d.department))].map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
            <Select
              label="Doctor"
              value={doctorCode}
              onChange={(e) => setDoctorCode(e.target.value)}
              required
            >
              {DOCTORS.map((doctor) => (
                <option key={doctor.code} value={doctor.code}>
                  {doctor.name}
                </option>
              ))}
            </Select>
            <Input
              label="Date"
              type="date"
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              required
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Available slots</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => {
                const isBooked = bookedSlots.has(slot);
                const isSelected = slotTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSlotTime(slot)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      isBooked &&
                        "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                      !isBooked &&
                        isSelected &&
                        "border-teal-600 bg-teal-600 text-white",
                      !isBooked &&
                        !isSelected &&
                        "border-slate-300 bg-white text-slate-700 hover:border-teal-400",
                    )}
                  >
                    {slot}
                    {isBooked ? " (Booked)" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">
                Appointment type
              </legend>
              <div className="mt-2 space-y-2">
                {APPT_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="apptType"
                      value={type}
                      checked={apptType === type}
                      onChange={() => setApptType(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700">
                Priority
              </legend>
              <div className="mt-2 space-y-2">
                {PRIORITIES.map((level) => (
                  <label key={level} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="priority"
                      value={level}
                      checked={priority === level}
                      onChange={() => setPriority(level)}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary">
          Cancel
        </Button>
        <Button type="button" variant="secondary">
          Send confirmation
        </Button>
        <Button type="submit" disabled={!patientId}>
          Book appointment
        </Button>
      </div>
    </form>
  );
}
