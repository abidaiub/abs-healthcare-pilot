"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  createManualLabOrderAction,
  searchTenantServicesAction,
  updateLabOrderDraftAction,
} from "@/app/actions/tenant-lab-orders";
import { listPatientsAction } from "@/app/actions/tenant-patients";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import type { LabOrderPriority } from "@/generated/prisma/client";
import { useI18n } from "@/lib/i18n/client";

type ServiceResult = Awaited<ReturnType<typeof searchTenantServicesAction>>[number];
type PatientResult = Awaited<ReturnType<typeof listPatientsAction>>["rows"][number];

export type LabOrderFormOrder = {
  id: string;
  orderNumber: string;
  priority: LabOrderPriority;
  clinicalNote: string | null;
  tests: Array<{ id: string; testName: string; tenantServiceId: string | null }>;
};

export function LabOrderForm({
  mode,
  order,
  canEdit,
}: {
  mode: "create" | "edit";
  order?: LabOrderFormOrder;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceResults, setServiceResults] = useState<ServiceResult[]>([]);
  const [serviceSearching, setServiceSearching] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceResult[]>([]);
  const [priority, setPriority] = useState<LabOrderPriority>(order?.priority ?? "ROUTINE");
  const [clinicalNote, setClinicalNote] = useState(order?.clinicalNote ?? "");
  const [pending, startTransition] = useTransition();
  const serviceSearchTimer = useRef<number | null>(null);
  const serviceSearchRequest = useRef(0);

  function handleServiceQueryChange(value: string) {
    setServiceQuery(value);
    if (serviceSearchTimer.current) window.clearTimeout(serviceSearchTimer.current);
    const term = value.trim();
    if (term.length < 2) {
      setServiceResults([]);
      setServiceSearching(false);
      return;
    }
    setServiceSearching(true);
    const requestId = ++serviceSearchRequest.current;
    serviceSearchTimer.current = window.setTimeout(() => {
      void searchTenantServicesAction(term)
        .then((rows) => {
          if (requestId !== serviceSearchRequest.current) return;
          setServiceResults(rows);
        })
        .catch(() => {
          if (requestId !== serviceSearchRequest.current) return;
          setServiceResults([]);
        })
        .finally(() => {
          if (requestId !== serviceSearchRequest.current) return;
          setServiceSearching(false);
        });
    }, 300);
  }

  function searchPatients() {
    startTransition(async () => {
      const result = await listPatientsAction({ search: patientQuery.trim(), pageSize: 10 });
      setPatientResults(result.rows);
    });
  }

  function addService(service: ServiceResult) {
    if (selectedServices.some((row) => row.id === service.id)) return;
    setSelectedServices((current) => [...current, service]);
    setServiceQuery("");
    setServiceResults([]);
  }

  function removeService(serviceId: string) {
    setSelectedServices((current) => current.filter((row) => row.id !== serviceId));
  }

  function submit() {
    startTransition(async () => {
      const serviceIds = selectedServices.length
        ? selectedServices.map((row) => row.id)
        : (order?.tests.map((row) => row.tenantServiceId).filter(Boolean) as string[]);
      if (mode === "create") {
        if (!selectedPatientId) {
          setError(t("laboratory.errors.LAB_PATIENT_INVALID"));
          return;
        }
        const result = await createManualLabOrderAction({
          patientId: selectedPatientId,
          tenantServiceIds: serviceIds,
          priority,
          clinicalNote,
        });
        if (!result.ok) {
          setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
          return;
        }
        router.push(`/lab/orders/${result.labOrderId}/edit`);
        return;
      }

      const result = await updateLabOrderDraftAction(order!.id, {
        tenantServiceIds: serviceIds.length ? serviceIds : undefined,
        priority,
        clinicalNote,
      });
      if (!result.ok) {
        setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
        return;
      }
      router.push(`/lab/orders/${order!.id}`);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {mode === "create" && (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1">
                <Input
                  label={t("laboratory.fields.patientSearch")}
                  value={patientQuery}
                  onChange={(event) => setPatientQuery(event.target.value)}
                />
              </div>
              <Button type="button" disabled={pending} onClick={searchPatients}>
                {t("pharmacy.fields.search")}
              </Button>
            </div>
            {patientResults.length > 0 && (
              <div className="space-y-2">
                {patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${selectedPatientId === patient.id ? "border-teal-500 bg-teal-50" : "border-slate-200"}`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    {patient.fullName} ({patient.patientNumber})
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("laboratory.sections.serviceSearch")}</h2>
        </div>
        <CardBody className="space-y-4">
          <Input
            label={t("laboratory.fields.serviceSearch")}
            value={serviceQuery}
            onChange={(event) => handleServiceQueryChange(event.target.value)}
          />
          {serviceSearching && <p className="text-sm text-slate-500">{t("pharmacy.fields.search")}…</p>}
          {serviceResults.length > 0 && (
            <div className="space-y-2">
              {serviceResults.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
                  onClick={() => addService(service)}
                >
                  <span>{service.localName}</span>
                  <span className="text-xs text-slate-500">
                    {[service.sampleType?.sampleType, service.sampleContainer?.containerType].filter(Boolean).join(" / ") || "—"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selectedServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((service) => (
                <Badge key={service.id} variant="info">
                  {service.localName}
                  {canEdit && (
                    <button type="button" className="ml-2" onClick={() => removeService(service.id)}>
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
          {mode === "edit" && order && selectedServices.length === 0 && (
            <div className="space-y-2 text-sm">
              {order.tests.map((test) => (
                <p key={test.id}>{test.testName}</p>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("laboratory.fields.priority")}
            value={priority}
            disabled={!canEdit || pending}
            onChange={(event) => setPriority(event.target.value as LabOrderPriority)}
          >
            <option value="ROUTINE">{t("laboratory.priority.routine")}</option>
            <option value="URGENT">{t("laboratory.priority.urgent")}</option>
            <option value="STAT">{t("laboratory.priority.stat")}</option>
          </Select>
          <Textarea
            label={t("laboratory.fields.clinicalNote")}
            value={clinicalNote}
            disabled={!canEdit || pending}
            onChange={(event) => setClinicalNote(event.target.value)}
            rows={3}
          />
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <Button type="button" disabled={pending} onClick={submit}>
            {t("laboratory.actions.save")}
          </Button>
        )}
        <Link href={mode === "edit" && order ? `/lab/orders/${order.id}` : "/lab/orders"}>
          <Button type="button" variant="ghost">{t("laboratory.actions.backToList")}</Button>
        </Link>
      </div>
    </div>
  );
}
