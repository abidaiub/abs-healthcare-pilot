"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type { SessionContext } from "@/lib/session";
import { BLOOD_GROUPS } from "@/lib/sample-data";

const ID_TYPES = ["NID", "Passport", "Birth Certificate"] as const;
const RELATIONS = ["Spouse", "Father", "Mother", "Sibling", "Other"] as const;
const CITIES = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Barishal"] as const;
const PATIENT_STATUSES = ["Active", "Inactive", "Deceased", "Merged"] as const;
const NEXT_MRN_PREVIEW = "PT-260001";

type RegistrationFormState = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  patientStatus: string;
  idType: string;
  idNumber: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  presentAddress: string;
  permanentAddress: string;
  sameAsPresent: boolean;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
};

const EMPTY_FORM: RegistrationFormState = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  patientStatus: "Active",
  idType: "NID",
  idNumber: "",
  phone: "",
  email: "",
  city: "Dhaka",
  country: "Bangladesh",
  presentAddress: "",
  permanentAddress: "",
  sameAsPresent: false,
  emergencyContactName: "",
  emergencyContactRelation: "Spouse",
  emergencyContactPhone: "",
};

export function PatientRegistrationForm({
  session,
}: {
  session: SessionContext;
}) {
  const [form, setForm] = useState<RegistrationFormState>(EMPTY_FORM);
  const [assignedMrn, setAssignedMrn] = useState<string | null>(null);
  const [duplicateCheckRan, setDuplicateCheckRan] = useState(false);

  function updateField<K extends keyof RegistrationFormState>(
    key: K,
    value: RegistrationFormState[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "sameAsPresent" && value === true) {
        next.permanentAddress = prev.presentAddress;
      }
      if (key === "presentAddress" && prev.sameAsPresent) {
        next.permanentAddress = value as string;
      }
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssignedMrn(NEXT_MRN_PREVIEW);
  }

  function handleClear() {
    setForm(EMPTY_FORM);
    setAssignedMrn(null);
    setDuplicateCheckRan(false);
  }

  if (assignedMrn) {
    return (
      <Card>
        <CardBody className="space-y-4 py-10 text-center">
          <Badge variant="success">MPI assigned</Badge>
          <h2 className="text-xl font-semibold text-slate-900">
            Patient registered
          </h2>
          <p className="text-sm text-slate-500">
            Medical Record Number:{" "}
            <span className="font-semibold text-slate-900">{assignedMrn}</span>
          </p>
          <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-600">
            <p>
              {form.firstName} {form.lastName} · {form.gender} · {form.dob}
            </p>
            <p className="mt-1">{form.phone}</p>
            <p className="mt-1">{session.branchName}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" variant="secondary">
              Print registration slip
            </Button>
            <Button type="button" variant="secondary">
              Print ID card
            </Button>
            <Button type="button" onClick={handleClear}>
              Register another patient
            </Button>
            <Link href="/patients">
              <Button type="button" variant="ghost">
                Back to search
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                New patient registration
              </h2>
              <p className="text-sm text-slate-500">
                {session.branchName} · {session.tenantCode}
              </p>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                MRN preview
              </p>
              <p className="font-mono font-semibold text-teal-900">
                {NEXT_MRN_PREVIEW}
              </p>
            </div>
          </div>
        </div>
        <CardBody>
          <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                Photo
              </div>
              <Button type="button" variant="secondary" className="w-full text-xs">
                Capture
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                required
              />
              <Input
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                required
              />
              <Input
                label="Date of birth"
                name="dob"
                type="date"
                value={form.dob}
                onChange={(e) => updateField("dob", e.target.value)}
                required
              />
              <Select
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                required
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              <Select
                label="Blood group"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={(e) => updateField("bloodGroup", e.target.value)}
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </Select>
              <Select
                label="Patient status"
                name="patientStatus"
                value={form.patientStatus}
                onChange={(e) => updateField("patientStatus", e.target.value)}
              >
                {PATIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Identity</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Select
            label="ID type"
            name="idType"
            value={form.idType}
            onChange={(e) => updateField("idType", e.target.value)}
          >
            {ID_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            label="ID number"
            name="idNumber"
            value={form.idNumber}
            onChange={(e) => updateField("idNumber", e.target.value)}
            placeholder="National ID or passport number"
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Contact</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+880 17 1111 0001"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="patient@email.com"
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Address</h2>
        </div>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="City"
              name="city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
            />
          </div>
          <Textarea
            label="Present address"
            name="presentAddress"
            rows={2}
            value={form.presentAddress}
            onChange={(e) => updateField("presentAddress", e.target.value)}
            placeholder="House, road, area"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.sameAsPresent}
              onChange={(e) => updateField("sameAsPresent", e.target.checked)}
              className="rounded border-slate-300"
            />
            Permanent address same as present
          </label>
          <Textarea
            label="Permanent address"
            name="permanentAddress"
            rows={2}
            value={form.permanentAddress}
            onChange={(e) => updateField("permanentAddress", e.target.value)}
            placeholder="House, road, area"
            disabled={form.sameAsPresent}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Emergency contact
          </h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Name"
            name="emergencyContactName"
            value={form.emergencyContactName}
            onChange={(e) => updateField("emergencyContactName", e.target.value)}
          />
          <Select
            label="Relation"
            name="emergencyContactRelation"
            value={form.emergencyContactRelation}
            onChange={(e) =>
              updateField("emergencyContactRelation", e.target.value)
            }
          >
            {RELATIONS.map((relation) => (
              <option key={relation} value={relation}>
                {relation}
              </option>
            ))}
          </Select>
          <Input
            label="Phone"
            name="emergencyContactPhone"
            value={form.emergencyContactPhone}
            onChange={(e) => updateField("emergencyContactPhone", e.target.value)}
            placeholder="+880 17 1111 0002"
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Duplicate check
          </h2>
          <p className="text-sm text-slate-500">
            MPI duplicate detection placeholder — no backend matching yet.
          </p>
        </div>
        <CardBody className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDuplicateCheckRan(true)}
          >
            Run duplicate check
          </Button>
          {duplicateCheckRan && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-900">No exact duplicates found</p>
              <p className="mt-1 text-slate-600">
                Possible match: Mohammad Ali (PT-260001) — 72% name similarity.
                Review before saving.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary">
          Print ID card
        </Button>
        <Button type="button" variant="secondary" onClick={handleClear}>
          Clear
        </Button>
        <Button type="submit">Save patient</Button>
      </div>
    </form>
  );
}
