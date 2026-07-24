"use client";

import Link from "next/link";
import { listVerificationWorklistAction } from "@/app/actions/tenant-lab-verification";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

export type VerificationWorklistRow = Awaited<
  ReturnType<typeof listVerificationWorklistAction>
>[number];

export function VerificationWorklistPanel({ rows }: { rows: VerificationWorklistRow[] }) {
  const { t } = useI18n();

  if (!rows.length) {
    return (
      <Card>
        <CardBody className="text-sm text-slate-600">{t("laboratoryVerification.worklist.empty")}</CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {rows.map((row) => {
        const criticalCount = row.items.filter((item) => item.isCritical).length;
        const unacknowledged = row.criticalEvents.filter((event) => !event.acknowledgedAt).length;
        return (
          <Card key={row.id}>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.labOrderTest.testName}</p>
                  <p className="text-sm text-slate-600">
                    {row.labOrder.patient.fullName} · {row.labOrder.orderNumber}
                    {row.labSample ? ` · ${row.labSample.accessionNumber}` : ""}
                  </p>
                  {row.labOrderTest.department?.name ? (
                    <p className="text-xs text-slate-500">{row.labOrderTest.department.name}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {criticalCount > 0 ? (
                    <Badge variant="danger">
                  {criticalCount} {t("laboratoryVerification.badges.critical")}
                    </Badge>
                  ) : null}
                  {unacknowledged > 0 ? (
                    <Badge variant="warning">
                  {unacknowledged} {t("laboratoryVerification.badges.unacknowledged")}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/lab/verification/${row.id}`}>
                  <Button type="button">{t("laboratoryVerification.actions.review")}</Button>
                </Link>
                <Link href={`/lab/verification/${row.id}/history`}>
                  <Button type="button" variant="ghost">
                    {t("laboratoryVerification.actions.viewHistory")}
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
