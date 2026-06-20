"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { searchPatients, type Patient } from "@/lib/sample-data";

function formatDob(patient: Patient): string {
  return patient.dob;
}

function PatientRow({ patient }: { patient: Patient }) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm font-medium text-teal-700">
        {patient.id}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-slate-900">
        {patient.name}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{patient.phone}</td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {patient.gender === "M" ? "Male" : "Female"}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatDob(patient)}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/appointments?patient=${patient.id}`}
          className="mr-3 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          Book
        </Link>
        <button
          type="button"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          View
        </button>
      </td>
    </tr>
  );
}

export function PatientSearchPanel({ patients }: { patients: Patient[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchPatients(query), [query]);

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Search by name, phone, MRN, or NID"
              placeholder="Search by Name, Phone, MRN, or NID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary">
              Advanced search
            </Button>
            <Link href="/patients/new">
              <Button type="button">Register new patient</Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Patient list
            </h2>
            <p className="text-sm text-slate-500">
              {results.length} record{results.length === 1 ? "" : "s"}
            </p>
          </div>
          <Badge variant="info">Search first workflow</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">MRN</th>
                <th className="px-4 py-3">Patient name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((patient) => (
                <PatientRow key={patient.id} patient={patient} />
              ))}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No patients match your search. Register a new patient or refine
            filters in advanced search.
          </div>
        )}
      </Card>

      {!query && (
        <p className="text-xs text-slate-500">
          {patients.length} registered patients in current branch context.
        </p>
      )}
    </div>
  );
}
