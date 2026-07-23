"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  assignUserToBranchAction,
  removeUserFromBranchAction,
  setUserDefaultBranchAction,
  updateTenantBranchAction,
} from "@/app/actions/tenant-branches";
import { BranchForm } from "@/components/branch/BranchManagementPanel";
import { Badge, Button, Card, CardBody, Select } from "@/components/ui";
import { BRANCH_TYPE_I18N_KEYS } from "@/lib/branch/constants";
import type { getTenantBranchDetail } from "@/lib/branch/queries";
import type { listEligibleUsersForBranchAssignment } from "@/lib/branch/queries";
import { useI18n } from "@/lib/i18n/client";

type BranchDetail = NonNullable<Awaited<ReturnType<typeof getTenantBranchDetail>>>;
type EligibleUser = Awaited<ReturnType<typeof listEligibleUsersForBranchAssignment>>[number];

export function BranchDetailPanel({
  branch,
  eligibleUsers,
  canEdit,
}: {
  branch: BranchDetail;
  eligibleUsers: EligibleUser[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const unassignedUsers = eligibleUsers.filter(
    (user) => !branch.userBranches.some((row) => row.user.id === user.id),
  );

  function runAction(action: () => Promise<{ ok: boolean; errorCode?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(t(`branch.errors.${result.errorCode}`, t("branch.errors.generic")));
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/settings/branches">
          <Button type="button" variant="secondary">
            {t("branch.actions.backToList")}
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{branch.name}</h2>
            <Badge variant="info">{branch.code}</Badge>
            {branch.isDefault && <Badge variant="success">{t("branch.status.default")}</Badge>}
            <Badge variant={branch.isActive ? "success" : "default"}>
              {branch.isActive ? t("branch.status.active") : t("branch.status.inactive")}
            </Badge>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label={t("branch.fields.type")} value={t(BRANCH_TYPE_I18N_KEYS[branch.branchType])} />
            <DetailItem label={t("branch.fields.city")} value={branch.city} />
            <DetailItem label={t("branch.fields.phone")} value={branch.phone} />
            <DetailItem label={t("branch.fields.email")} value={branch.email} />
            <DetailItem label={t("branch.fields.timezone")} value={branch.timezone} />
            <DetailItem label={t("branch.fields.addressLine1")} value={branch.addressLine1 ?? branch.address} />
          </dl>
        </CardBody>
      </Card>

      {canEdit && (
        <Card>
          <CardBody className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">{t("branch.actions.edit")}</h3>
            <BranchForm
              initial={{
                code: branch.code,
                name: branch.name,
                branchType: branch.branchType,
                city: branch.city,
                phone: branch.phone,
                email: branch.email,
                isDefault: branch.isDefault,
                addressLine1: branch.addressLine1 ?? branch.address,
                timezone: branch.timezone,
              }}
              pending={pending}
              submitLabel={t("branch.actions.save")}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                runAction(() =>
                  updateTenantBranchAction(branch.id, formData).then((r) => ({
                    ok: r.ok,
                    errorCode: r.ok ? undefined : r.errorCode,
                  })),
                );
              }}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">{t("branch.assignments.title")}</h3>
          {canEdit && unassignedUsers.length > 0 && (
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label={t("branch.assignments.selectUser")}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">{t("branch.assignments.chooseUser")}</option>
                {unassignedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                disabled={!selectedUserId || pending}
                onClick={() =>
                  runAction(() =>
                    assignUserToBranchAction(branch.id, selectedUserId).then((r) => ({
                      ok: r.ok,
                      errorCode: r.ok ? undefined : r.errorCode,
                    })),
                  )
                }
              >
                {t("branch.assignments.assign")}
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-start text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">{t("branch.assignments.user")}</th>
                  <th className="px-3 py-2">{t("branch.assignments.defaultWorking")}</th>
                  <th className="px-3 py-2">{t("branch.list.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {branch.userBranches.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                      {t("branch.assignments.empty")}
                    </td>
                  </tr>
                ) : (
                  branch.userBranches.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-3 py-2">{row.user.username}</td>
                      <td className="px-3 py-2">
                        {row.isPrimary ? (
                          <Badge variant="success">{t("branch.status.default")}</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {canEdit && (
                          <div className="flex flex-wrap gap-2">
                            {!row.isPrimary && (
                              <Button
                                type="button"
                                variant="ghost"
                                className="px-2 py-1 text-xs"
                                disabled={pending}
                                onClick={() =>
                                  runAction(() =>
                                    setUserDefaultBranchAction(branch.id, row.user.id).then((r) => ({
                                      ok: r.ok,
                                      errorCode: r.ok ? undefined : r.errorCode,
                                    })),
                                  )
                                }
                              >
                                {t("branch.assignments.setDefaultWorking")}
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2 py-1 text-xs"
                              disabled={pending}
                              onClick={() =>
                                runAction(() =>
                                  removeUserFromBranchAction(branch.id, row.user.id).then((r) => ({
                                    ok: r.ok,
                                    errorCode: r.ok ? undefined : r.errorCode,
                                  })),
                                )
                              }
                            >
                              {t("branch.assignments.remove")}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}
