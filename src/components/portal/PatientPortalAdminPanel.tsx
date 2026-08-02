"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createPortalDelegationAction,
  enrollPatientPortalAccountAction,
  reassignPortalUsernameAction,
  revokePortalDelegationAction,
  setPortalAccountSuspensionAction,
} from "@/app/actions/tenant-patient-portal";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

export type PortalAccountAdminRow = {
  id: string;
  username: string;
  isVerified: boolean;
  isSuspended: boolean;
  isActive: boolean;
  patient: { patientNumber: string; fullName: string };
  delegations: Array<{
    id: string;
    relationship: string;
    accessLevel: string;
    grantorPatient: { patientNumber: string; fullName: string };
  }>;
};

export type PortalPatientOption = {
  id: string;
  patientNumber: string;
  fullName: string;
};

type Props = {
  accounts: PortalAccountAdminRow[];
  patients: PortalPatientOption[];
  canEnroll: boolean;
  canSuspend: boolean;
  canDelegate: boolean;
};

export function PatientPortalAdminPanel({
  accounts,
  patients,
  canEnroll,
  canSuspend,
  canDelegate,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [enrollPatientId, setEnrollPatientId] = useState(patients[0]?.id ?? "");
  const [enrollUsername, setEnrollUsername] = useState("");
  const [enrollPassword, setEnrollPassword] = useState("");

  const [reassignPatientId, setReassignPatientId] = useState(patients[0]?.id ?? "");
  const [reassignUsername, setReassignUsername] = useState("");
  const [reassignPassword, setReassignPassword] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [supersededAccountId, setSupersededAccountId] = useState("");

  const [grantorPatientId, setGrantorPatientId] = useState(patients[0]?.id ?? "");
  const [granteeAccountId, setGranteeAccountId] = useState(accounts[0]?.id ?? "");
  const [relationship, setRelationship] = useState("Father");
  const [accessLevel, setAccessLevel] = useState("READ_ONLY");
  const [consentReference, setConsentReference] = useState("");

  function showError(errorCode: string) {
    setNotice(null);
    setError(t(`portalAdmin.errors.${errorCode}`, t("portalAdmin.errors.generic")));
  }

  function handleEnroll() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await enrollPatientPortalAccountAction({
        patientId: enrollPatientId,
        username: enrollUsername || undefined,
        password: enrollPassword,
        markVerified: true,
      });
      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      setEnrollPassword("");
      setNotice(
        t("portalAdmin.notices.enrolled", "Portal account enrolled for {username}").replace(
          "{username}",
          result.username ?? "",
        ),
      );
      router.refresh();
    });
  }

  function handleReassign() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await reassignPortalUsernameAction({
        targetPatientId: reassignPatientId,
        username: reassignUsername.trim(),
        password: reassignPassword,
        reason: reassignReason.trim(),
        supersededAccountId: supersededAccountId || undefined,
        markVerified: true,
      });
      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      setReassignPassword("");
      setReassignReason("");
      setNotice(
        t("portalAdmin.notices.reassigned", "Portal username {username} reassigned to selected patient").replace(
          "{username}",
          result.username ?? "",
        ),
      );
      router.refresh();
    });
  }

  function handleSuspend(accountId: string, suspend: boolean) {
    const reason = window.prompt(
      suspend
        ? t("portalAdmin.prompts.suspendReason", "Suspension reason")
        : t("portalAdmin.prompts.reinstateReason", "Reinstatement reason"),
    );
    if (!reason?.trim()) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await setPortalAccountSuspensionAction({
        accountId,
        suspend,
        reason: reason.trim(),
      });
      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      setNotice(
        suspend
          ? t("portalAdmin.notices.suspended", "Portal account suspended")
          : t("portalAdmin.notices.reinstated", "Portal account reinstated"),
      );
      router.refresh();
    });
  }

  function handleDelegate() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await createPortalDelegationAction({
        grantorPatientId,
        granteeAccountId,
        relationship,
        accessLevel,
        consentReference,
      });
      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      setConsentReference("");
      setNotice(t("portalAdmin.notices.delegated", "Guardian / family delegation recorded"));
      router.refresh();
    });
  }

  function handleRevoke(delegationId: string) {
    const reason = window.prompt(
      t("portalAdmin.prompts.revokeReason", "Revocation reason"),
    );
    if (!reason?.trim()) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await revokePortalDelegationAction({
        delegationId,
        reason: reason.trim(),
      });
      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      setNotice(t("portalAdmin.notices.revoked", "Delegation revoked"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {(error || notice) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error ?? notice}
        </div>
      )}

      {canEnroll && (
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold">
              {t("portalAdmin.enroll.title", "Counter-assisted enrollment")}
            </h2>
            <p className="text-sm text-slate-600">
              {t(
                "portalAdmin.enroll.help",
                "Creates a portal login for an existing patient. Username defaults to mobile or email.",
              )}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label={t("portalAdmin.fields.patient", "Patient")}
                value={enrollPatientId}
                onChange={(e) => setEnrollPatientId(e.target.value)}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patientNumber} — {patient.fullName}
                  </option>
                ))}
              </Select>
              <Input
                label={t("portalAdmin.fields.username", "Username (optional)")}
                value={enrollUsername}
                onChange={(e) => setEnrollUsername(e.target.value)}
                placeholder={t("portalAdmin.fields.usernameHint", "Mobile or email")}
              />
              <Input
                label={t("portalAdmin.fields.password", "Temporary password")}
                type="password"
                value={enrollPassword}
                onChange={(e) => setEnrollPassword(e.target.value)}
              />
            </div>
            <Button type="button" disabled={pending || !enrollPatientId} onClick={handleEnroll}>
              {t("portalAdmin.actions.enroll", "Enroll portal account")}
            </Button>
          </CardBody>
        </Card>
      )}

      {canSuspend && (
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold">
              {t("portalAdmin.reassign.title", "Reassign portal username")}
            </h2>
            <p className="text-sm text-slate-600">
              {t(
                "portalAdmin.reassign.help",
                "Release a username from a superseded portal account and enroll the correct patient. The old account is archived and suspended; audit history is preserved.",
              )}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label={t("portalAdmin.fields.patient", "Patient")}
                value={reassignPatientId}
                onChange={(e) => setReassignPatientId(e.target.value)}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patientNumber} — {patient.fullName}
                  </option>
                ))}
              </Select>
              <Input
                label={t("portalAdmin.fields.username", "Username")}
                value={reassignUsername}
                onChange={(e) => setReassignUsername(e.target.value)}
                placeholder="8801712200002"
              />
              <Select
                label={t("portalAdmin.fields.supersededAccount", "Superseded account (optional)")}
                value={supersededAccountId}
                onChange={(e) => setSupersededAccountId(e.target.value)}
              >
                <option value="">{t("portalAdmin.fields.usernameHint", "Auto-detect by username")}</option>
                {accounts
                  .filter((account) => account.isActive)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.username} — {account.patient.patientNumber}
                    </option>
                  ))}
              </Select>
              <Input
                label={t("portalAdmin.fields.password", "Temporary password")}
                type="password"
                value={reassignPassword}
                onChange={(e) => setReassignPassword(e.target.value)}
              />
              <Input
                label={t("portalAdmin.fields.reassignReason", "Authorized reason")}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                className="md:col-span-2"
              />
            </div>
            <Button
              type="button"
              disabled={
                pending ||
                !reassignPatientId ||
                !reassignUsername.trim() ||
                !reassignPassword ||
                !reassignReason.trim()
              }
              onClick={handleReassign}
            >
              {t("portalAdmin.actions.reassign", "Reassign username to patient")}
            </Button>
          </CardBody>
        </Card>
      )}

      {canDelegate && (
        <Card>
          <CardBody className="space-y-4">
            <h2 className="text-base font-semibold">
              {t("portalAdmin.delegate.title", "Guardian / family delegation")}
            </h2>
            <p className="text-sm text-slate-600">
              {t(
                "portalAdmin.delegate.help",
                "Portal access for a dependent is never inferred from demographic guardian fields. Record consent explicitly.",
              )}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                label={t("portalAdmin.fields.grantor", "Dependent patient")}
                value={grantorPatientId}
                onChange={(e) => setGrantorPatientId(e.target.value)}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patientNumber} — {patient.fullName}
                  </option>
                ))}
              </Select>
              <Select
                label={t("portalAdmin.fields.grantee", "Portal account holder")}
                value={granteeAccountId}
                onChange={(e) => setGranteeAccountId(e.target.value)}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.username} — {account.patient.fullName}
                  </option>
                ))}
              </Select>
              <Input
                label={t("portalAdmin.fields.relationship", "Relationship")}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
              <Select
                label={t("portalAdmin.fields.accessLevel", "Access level")}
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
              >
                <option value="READ_ONLY">READ_ONLY</option>
                <option value="FULL">FULL</option>
                <option value="BILLING_ONLY">BILLING_ONLY</option>
              </Select>
              <Input
                label={t("portalAdmin.fields.consent", "Consent reference")}
                value={consentReference}
                onChange={(e) => setConsentReference(e.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={pending || !grantorPatientId || !granteeAccountId}
              onClick={handleDelegate}
            >
              {t("portalAdmin.actions.delegate", "Record delegation")}
            </Button>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-base font-semibold">
            {t("portalAdmin.list.title", "Portal accounts")}
          </h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-600">
              {t("portalAdmin.list.empty", "No portal accounts enrolled yet.")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">
                      {t("portalAdmin.columns.patient", "Patient")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("portalAdmin.columns.username", "Username")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("portalAdmin.columns.status", "Status")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("portalAdmin.columns.delegations", "Delegations held")}
                    </th>
                    <th className="px-2 py-2 font-medium">
                      {t("portalAdmin.columns.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b align-top">
                      <td className="px-2 py-3">
                        <div className="font-medium">{account.patient.fullName}</div>
                        <div className="text-slate-500">{account.patient.patientNumber}</div>
                      </td>
                      <td className="px-2 py-3">{account.username}</td>
                      <td className="px-2 py-3">
                        <div className="flex flex-wrap gap-1">
                          {account.isVerified && (
                            <Badge variant="success">
                              {t("portalAdmin.badges.verified", "Verified")}
                            </Badge>
                          )}
                          {account.isSuspended ? (
                            <Badge variant="danger">
                              {t("portalAdmin.badges.suspended", "Suspended")}
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              {t("portalAdmin.badges.active", "Active")}
                            </Badge>
                          )}
                          {!account.isActive && (
                            <Badge variant="default">
                              {t("portalAdmin.badges.archived", "Archived")}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        {account.delegations.length === 0 ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <ul className="space-y-2">
                            {account.delegations.map((delegation) => (
                              <li key={delegation.id} className="flex flex-wrap items-center gap-2">
                                <span>
                                  {delegation.grantorPatient.fullName} (
                                  {delegation.relationship})
                                </span>
                                {canDelegate && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    className="px-2 py-1 text-xs"
                                    disabled={pending}
                                    onClick={() => handleRevoke(delegation.id)}
                                  >
                                    {t("portalAdmin.actions.revoke", "Revoke")}
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        {canSuspend && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-2 py-1 text-xs"
                            disabled={pending}
                            onClick={() => handleSuspend(account.id, !account.isSuspended)}
                          >
                            {account.isSuspended
                              ? t("portalAdmin.actions.reinstate", "Reinstate")
                              : t("portalAdmin.actions.suspend", "Suspend")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
