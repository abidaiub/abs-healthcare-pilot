"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  activateTenantBranchAction,
  createTenantBranchAction,
  deactivateTenantBranchAction,
  setDefaultTenantBranchAction,
} from "@/app/actions/tenant-branches";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { BRANCH_TYPES, BRANCH_TYPE_I18N_KEYS } from "@/lib/branch/constants";
import type { BranchListRow } from "@/lib/branch/queries";
import { useI18n } from "@/lib/i18n/client";

type BranchManagementPanelProps = {
  branches: BranchListRow[];
  total: number;
  page: number;
  totalPages: number;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
};

export function BranchManagementPanel({
  branches,
  total,
  page,
  totalPages,
  canCreate,
  canEdit,
  canApprove,
}: BranchManagementPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const branchType = searchParams.get("branchType") ?? "all";

  function updateFilters(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(`/settings/branches?${params.toString()}`);
  }

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

  function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    runAction(() => createTenantBranchAction(formData).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })));
    setShowCreate(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Input
            label={t("branch.filters.search")}
            name="search"
            defaultValue={search}
            placeholder={t("branch.filters.searchPlaceholder")}
            onBlur={(e) => updateFilters({ search: e.target.value })}
          />
          <Select
            label={t("branch.filters.status")}
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
          >
            <option value="all">{t("branch.filters.allStatuses")}</option>
            <option value="active">{t("branch.status.active")}</option>
            <option value="inactive">{t("branch.status.inactive")}</option>
          </Select>
          <Select
            label={t("branch.fields.type")}
            value={branchType}
            onChange={(e) => updateFilters({ branchType: e.target.value })}
          >
            <option value="all">{t("branch.filters.allTypes")}</option>
            {BRANCH_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(BRANCH_TYPE_I18N_KEYS[type])}
              </option>
            ))}
          </Select>
        </div>
        {canCreate && (
          <Button type="button" onClick={() => setShowCreate((v) => !v)}>
            {t("branch.actions.create")}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showCreate && canCreate && (
        <Card>
          <CardBody>
            <BranchForm onSubmit={handleCreateSubmit} pending={pending} submitLabel={t("branch.actions.create")} />
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("branch.fields.code")}</th>
                <th className="px-4 py-3">{t("branch.fields.name")}</th>
                <th className="px-4 py-3">{t("branch.fields.type")}</th>
                <th className="px-4 py-3">{t("branch.fields.city")}</th>
                <th className="px-4 py-3">{t("branch.list.assignedUsers")}</th>
                <th className="px-4 py-3">{t("branch.fields.status")}</th>
                <th className="px-4 py-3">{t("branch.list.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    {t("branch.list.empty")}
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-mono font-medium text-teal-700">
                      {branch.code}
                      {branch.isDefault && (
                        <span className="ms-2 inline-block">
                          <Badge variant="info">{t("branch.status.default")}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{branch.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t(BRANCH_TYPE_I18N_KEYS[branch.branchType])}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{branch.city ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{branch.assignedUserCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={branch.isActive ? "success" : "default"}>
                        {branch.isActive ? t("branch.status.active") : t("branch.status.inactive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/settings/branches/${branch.id}`}>
                          <Button type="button" variant="ghost" className="px-2 py-1 text-xs">
                            {t("branch.actions.view")}
                          </Button>
                        </Link>
                        {canEdit && branch.isActive && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            disabled={pending}
                            onClick={() =>
                              runAction(() =>
                                deactivateTenantBranchAction(branch.id).then((r) => ({
                                  ok: r.ok,
                                  errorCode: r.ok ? undefined : r.errorCode,
                                })),
                              )
                            }
                          >
                            {t("branch.actions.deactivate")}
                          </Button>
                        )}
                        {canEdit && !branch.isActive && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            disabled={pending}
                            onClick={() =>
                              runAction(() =>
                                activateTenantBranchAction(branch.id).then((r) => ({
                                  ok: r.ok,
                                  errorCode: r.ok ? undefined : r.errorCode,
                                })),
                              )
                            }
                          >
                            {t("branch.actions.activate")}
                          </Button>
                        )}
                        {canApprove && !branch.isDefault && branch.isActive && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            disabled={pending}
                            onClick={() =>
                              runAction(() =>
                                setDefaultTenantBranchAction(branch.id).then((r) => ({
                                  ok: r.ok,
                                  errorCode: r.ok ? undefined : r.errorCode,
                                })),
                              )
                            }
                          >
                            {t("branch.actions.setDefault")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
            <span>{`${t("branch.list.page")} ${page} / ${totalPages} · ${total} ${t("branch.list.total")}`}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => router.push(`/settings/branches?page=${page - 1}`)}
              >
                {t("branch.list.previousPage")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => router.push(`/settings/branches?page=${page + 1}`)}
              >
                {t("branch.list.nextPage")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function BranchForm({
  initial,
  onSubmit,
  pending,
  submitLabel,
}: {
  initial?: Partial<BranchListRow & { addressLine1?: string | null; timezone?: string | null }>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  submitLabel: string;
}) {
  const { t } = useI18n();

  return (
    <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={onSubmit}>
      <Input label={t("branch.fields.code")} name="code" defaultValue={initial?.code ?? ""} required />
      <Input label={t("branch.fields.name")} name="name" defaultValue={initial?.name ?? ""} required />
      <Select label={t("branch.fields.type")} name="branchType" defaultValue={initial?.branchType ?? "OTHER"}>
        {BRANCH_TYPES.map((type) => (
          <option key={type} value={type}>
            {t(BRANCH_TYPE_I18N_KEYS[type])}
          </option>
        ))}
      </Select>
      <Input label={t("branch.fields.addressLine1")} name="addressLine1" defaultValue={initial?.addressLine1 ?? ""} />
      <Input label={t("branch.fields.city")} name="city" defaultValue={initial?.city ?? ""} />
      <Input label={t("branch.fields.district")} name="district" defaultValue="" />
      <Input label={t("branch.fields.phone")} name="phone" defaultValue={initial?.phone ?? ""} />
      <Input label={t("branch.fields.email")} name="email" type="email" defaultValue={initial?.email ?? ""} />
      <Input label={t("branch.fields.timezone")} name="timezone" defaultValue={initial?.timezone ?? ""} />
      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
        <input type="checkbox" name="isDefault" value="true" defaultChecked={initial?.isDefault} />
        {t("branch.fields.isDefault")}
      </label>
      <div className="sm:col-span-3 flex justify-end">
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export { BranchForm };
