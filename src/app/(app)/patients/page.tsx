import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PatientSearchPanel } from "@/components/patients/PatientSearchPanel";
import { Button } from "@/components/ui";
import {
  listPatients,
  listRegistrationBranchOptions,
} from "@/lib/patient/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission, hasTenantPermission } from "@/lib/rbac/auth";
import type { PatientGender } from "@/generated/prisma/client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const session = await requireTenantPermission("/patients");
  const { t } = await getServerI18n(session);
  const params = await searchParams;

  const page = Number(readParam(params, "page") ?? "1") || 1;
  const search = readParam(params, "search") ?? "";
  const statusRaw = readParam(params, "status") ?? "all";
  const genderRaw = readParam(params, "gender") ?? "all";
  const registrationBranchId = readParam(params, "registrationBranchId") ?? "all";

  const status =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : ("all" as const);
  const gender =
    genderRaw && genderRaw !== "all" ? (genderRaw as PatientGender) : ("all" as const);

  const [result, branches, canCreate] = await Promise.all([
    listPatients(session.tenantId, {
      search,
      status,
      gender,
      registrationBranchId,
      page,
      pageSize: 20,
    }),
    listRegistrationBranchOptions(session.tenantId),
    hasTenantPermission(session.tenantId, session.userId, "/patients/new", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="patientSearch"
        description={t("patient.list.description")}
        action={
          canCreate ? (
            <Link href="/patients/new">
              <Button type="button">{t("patient.actions.register")}</Button>
            </Link>
          ) : undefined
        }
      />
      <PatientSearchPanel
        patients={result.rows}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        branches={branches}
        canCreate={canCreate}
      />
    </div>
  );
}
