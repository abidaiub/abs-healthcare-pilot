"use client";

import Link from "next/link";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";

type Doctor = {
  id: string;
  doctorCode: string;
  doctorName: string;
  specialty: string | null;
  bmdcNo: string | null;
  departmentName: string;
  isVerifying: boolean;
  isPathologist: boolean;
  publishedSchedules: number;
  isActive: boolean;
};

export function DoctorSetupReadinessPanel({ doctors }: { doctors: Doctor[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Doctor Setup"
          description="Doctors, departments, speciality, registration, schedules, and verification permission."
          action={
            <div className="flex gap-3 text-sm">
              <Link href="/settings/doctors" className="font-medium text-teal-700 hover:underline">
                Manage doctors
              </Link>
              <Link
                href="/settings/doctor-schedules"
                className="font-medium text-teal-700 hover:underline"
              >
                Manage schedules
              </Link>
            </div>
          }
        />
        <CardBody>
          <p className="text-sm text-slate-600">
            {doctors.length} doctors ·{" "}
            {doctors.filter((d) => d.isVerifying || d.isPathologist).length} with
            verification permission ·{" "}
            {doctors.filter((d) => d.publishedSchedules > 0).length} with published
            schedules
          </p>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Speciality</th>
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Schedules</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    {d.doctorName}{" "}
                    <span className="text-slate-400">({d.doctorCode})</span>
                  </td>
                  <td className="px-4 py-3">{d.departmentName}</td>
                  <td className="px-4 py-3">{d.specialty ?? "—"}</td>
                  <td className="px-4 py-3">{d.bmdcNo ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        d.isVerifying || d.isPathologist ? "success" : "default"
                      }
                    >
                      {d.isVerifying || d.isPathologist ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{d.publishedSchedules}</td>
                  <td className="px-4 py-3">
                    <Badge variant={d.isActive ? "success" : "default"}>
                      {d.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
