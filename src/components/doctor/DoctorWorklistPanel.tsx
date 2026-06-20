"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, Select } from "@/components/ui";
import type { WorklistItem } from "@/lib/sample-data";

function statusVariant(status: WorklistItem["status"]) {
  if (status === "Completed") return "success" as const;
  if (status === "In Progress") return "info" as const;
  return "warning" as const;
}

type QueueTab = "active" | "completed" | "emergency" | "telemedicine";

export function DoctorWorklistPanel({
  doctorName,
  doctorCode,
  department,
  branchName,
  items,
}: {
  doctorName: string;
  doctorCode: string;
  department: string;
  branchName: string;
  items: WorklistItem[];
}) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [queueTab, setQueueTab] = useState<QueueTab>("active");

  const filteredItems = useMemo(() => {
    if (statusFilter === "All") return items;
    if (statusFilter === "Waiting") {
      return items.filter((i) => i.status === "Waiting");
    }
    if (statusFilter === "In Consultation") {
      return items.filter((i) => i.status === "In Progress");
    }
    return items.filter((i) => i.status === "Completed");
  }, [items, statusFilter]);

  const waiting = items.filter((i) => i.status === "Waiting");
  const inConsult = items.filter((i) => i.status === "In Progress");
  const completed = items.filter((i) => i.status === "Completed");

  const queueTabs: { id: QueueTab; label: string; count: number }[] = [
    { id: "active", label: "Active queue", count: waiting.length + inConsult.length },
    { id: "completed", label: "Completed patients", count: completed.length },
    { id: "emergency", label: "Emergency queue", count: 0 },
    { id: "telemedicine", label: "Telemedicine queue", count: 0 },
  ];

  const displayItems =
    queueTab === "completed"
      ? completed
      : queueTab === "emergency" || queueTab === "telemedicine"
        ? []
        : filteredItems;

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{doctorName}</p>
            <p className="text-sm text-slate-500">
              {doctorCode} · Dept: {department} · Date: 18-Jun-2026
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[160px]"
            >
              <option value="All">All</option>
              <option value="Waiting">Waiting</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
            </Select>
            <Select
              label="Branch"
              value={branchName}
              onChange={() => undefined}
              className="min-w-[180px]"
            >
              <option value={branchName}>{branchName}</option>
            </Select>
            <Button type="button" variant="secondary">
              Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Waiting</p>
            <p className="mt-1 text-3xl font-semibold text-amber-700">
              {waiting.length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">In consultation</p>
            <p className="mt-1 text-3xl font-semibold text-sky-700">
              {inConsult.length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Completed today</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-700">
              {completed.length}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {queueTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setQueueTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              queueTab === tab.id
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Patient name</th>
                <th className="px-4 py-3">Age/sex</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item) => (
                <tr
                  key={item.appointmentId}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-sm font-semibold text-teal-700">
                    {String(item.token).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {item.patientName}
                    </p>
                    <p className="text-xs text-slate-500">{item.patientId}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.age}/{item.gender}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">OPD</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(item.status)}>
                      {item.status === "In Progress"
                        ? "In Consultation"
                        : item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.status === "Waiting" ? (
                      <Button type="button" className="px-3 py-1.5 text-xs">
                        Call
                      </Button>
                    ) : item.status === "In Progress" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                      >
                        Resume
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayItems.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No patients in this queue.
          </div>
        )}
      </Card>
    </div>
  );
}
