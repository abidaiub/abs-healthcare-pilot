"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveTenantAdminAccessAction } from "@/app/actions/host-tenant-admin-access";
import { Badge, Button, Card, CardBody, CardHeader } from "@/components/ui";
import { RECOMMENDED_TENANT_ADMIN_GRANT_IDS, TENANT_ADMIN_ACCESS_GRANTS, type TenantAdminAccessGrantId } from "@/lib/saas/tenant-admin-access";
import type { TenantAdminAccessRecord } from "@/lib/saas/tenant-admin-access-query";

export function TenantAdminAccessPanel({ access, tenantId }: { access: TenantAdminAccessRecord | null; tenantId: string }) {
  const [selected, setSelected] = useState<TenantAdminAccessGrantId[]>(access?.selectedGrantIds ?? []);
  const [token, setToken] = useState(access?.stateToken ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ auditId: string | null; savedAt: string; added: string[]; removed: string[]; unchanged: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!access) return <Card><CardHeader title="Tenant Administrator Access" description="No active user with a tenant-owned TENANT_ADMIN role assignment was found." /><CardBody><p className="text-sm text-rose-700">Access cannot be edited until the tenant has a valid Tenant Administrator role assignment.</p></CardBody></Card>;
  const groups = [
    "User Management",
    "Branch & Lookups",
    "Go-Live Wizard",
    "Clinical Setup",
    "Diagnostic Catalog",
    "Audit Access",
  ] as const;
  const toggle = (id: TenantAdminAccessGrantId) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const save = () => startTransition(async () => {
    setMessage(null); setReceipt(null);
    const result = await saveTenantAdminAccessAction({ tenantId: access.tenantId, adminUserId: access.administrator.id, roleId: access.administrator.roleId, grantIds: selected, stateToken: token });
    if (!result.ok) return setMessage(result.error);
    setToken(result.receipt.stateToken); setReceipt(result.receipt);
    setMessage(result.receipt.unchanged ? "No changes were required; the saved access already matches this selection." : "Tenant Administrator access saved.");
  });

  return <Card>
    <CardHeader title="Tenant Administrator Access" description="Host-controlled, role-based access for this tenant's existing administrator." action={<Badge variant="info">{selected.length} of {TENANT_ADMIN_ACCESS_GRANTS.length} selected</Badge>} />
    <CardBody className="space-y-6">
      <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-3">
        <div><span className="text-slate-500">Tenant</span><p className="font-medium">{access.tenantName} ({access.tenantCode})</p></div>
        <div><span className="text-slate-500">Administrator</span><p className="font-medium">{access.administrator.displayName}</p><p className="text-slate-500">{access.administrator.email}</p></div>
        <div><span className="text-slate-500">Role / status</span><p className="font-medium">{access.administrator.roleName} ({access.administrator.roleCode})</p><p className="text-slate-500">{access.administrator.status} · Last login: Not recorded</p></div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">These permissions allow tenant-level user administration only. Host/platform administration and unrelated clinical, laboratory, billing, or pharmacy permissions are excluded.</div>
      {groups.map((group) => <fieldset key={group} className="space-y-3"><legend className="text-sm font-semibold text-slate-900">{group}</legend>
        <div className="grid gap-3 md:grid-cols-2">{TENANT_ADMIN_ACCESS_GRANTS.filter((grant) => grant.group === group).map((grant) => <label key={grant.id} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"><input type="checkbox" checked={selected.includes(grant.id)} onChange={() => toggle(grant.id)} className="mt-1 h-4 w-4" /><span><span className="block text-sm font-medium text-slate-900">{grant.label}</span><span className="block text-xs text-slate-500">{grant.description}</span></span></label>)}</div>
      </fieldset>)}
      {message && <p className={`rounded-lg p-3 text-sm ${receipt ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{message}</p>}
      {receipt && !receipt.unchanged && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900"><p>Audit ID: {receipt.auditId}</p><p>Timestamp: {receipt.savedAt}</p><p>Added: {receipt.added.join(", ") || "None"}</p><p>Removed: {receipt.removed.join(", ") || "None"}</p></div>}
      <div className="flex flex-wrap gap-3"><Button type="button" onClick={() => setSelected([...RECOMMENDED_TENANT_ADMIN_GRANT_IDS])} variant="secondary">Use recommended</Button><Button type="button" onClick={() => setSelected([])} variant="secondary">Clear all</Button><Button type="button" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save access"}</Button><Link href={`/host/tenants/${tenantId}`}><Button type="button" variant="secondary">Cancel</Button></Link></div>
    </CardBody>
  </Card>;
}
