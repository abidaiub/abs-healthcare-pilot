import Link from "next/link";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  StatCard,
} from "@/components/ui";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import {
  DIAGNOSTIC_WORKFLOW_STEPS,
  formatCurrency,
  getDiagnosticDashboardStats,
  INVESTIGATION_ORDERS,
  SAMPLE_COLLECTION_QUEUE,
} from "@/lib/diagnostic-data";

export default async function DashboardPage() {
  const session = await requireTenantSession();
  const stats = getDiagnosticDashboardStats();
  const pendingOrders = INVESTIGATION_ORDERS.filter(
    (order) => order.status === "Pending Collection",
  );
  const sampleQueue = SAMPLE_COLLECTION_QUEUE.filter(
    (item) => item.status === "Pending Collection",
  );

  const kpiCards = [
    {
      label: "Today's Bills",
      value: stats.todaysBills,
      hint: "Investigation orders billed",
      accent: "teal" as const,
    },
    {
      label: "Today's Collection",
      value: formatCurrency(stats.todaysCollection),
      hint: "Cash & digital received",
      accent: "blue" as const,
    },
    {
      label: "Pending Sample Collection",
      value: stats.pendingSampleCollection,
      hint: "Awaiting phlebotomy",
      accent: "amber" as const,
    },
    {
      label: "Pending Result Entry",
      value: stats.pendingResultEntry,
      hint: "LIS / manual fallback",
      accent: "violet" as const,
    },
    {
      label: "Pending Verification",
      value: stats.pendingVerification,
      hint: "Pathologist queue",
      accent: "amber" as const,
    },
    {
      label: "Reports Ready",
      value: stats.reportsReady,
      hint: "Verified, release pending",
      accent: "blue" as const,
    },
    {
      label: "Reports Released to Portal",
      value: stats.reportsReleasedToPortal,
      hint: "Patient self-service",
      accent: "teal" as const,
    },
    {
      label: "Due Amount",
      value: formatCurrency(stats.dueAmount),
      hint: "Outstanding investigation dues",
      accent: "violet" as const,
    },
  ];

  const sampleCollectionKpis = [
    { label: "Collected Today", value: stats.collectedToday },
    { label: "Rejected Samples", value: stats.rejectedSamples },
    { label: "Recollection Required", value: stats.recollectionRequired },
  ];

  const resultEntryKpis = [
    { label: "Pending Validation", value: stats.pendingValidation },
    { label: "Critical Alerts", value: stats.criticalAlerts },
  ];

  const verificationKpis = [
    { label: "Escalated Results", value: stats.escalatedResults },
    { label: "On Hold", value: stats.onHoldResults },
  ];

  const releaseKpis = [
    { label: "Blocked Reports", value: stats.blockedReports },
    { label: "Reprints", value: stats.reprints },
    { label: "Delivery Failures", value: stats.deliveryFailures },
  ];

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="receptionDashboard"
        description={`Diagnostic operations dashboard for ${session.branchName} · ${session.tenantCode}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/patients/new"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Register patient
            </Link>
            <Link
              href="/diagnostic/billing"
              className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              New test order
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            accent={card.accent}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader
            title="Sample collection"
            description="Phlebotomy queue metrics"
          />
          <CardBody className="grid gap-3 sm:grid-cols-3">
            {sampleCollectionKpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {kpi.value}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Result entry" description="Validation & alerts" />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {resultEntryKpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {kpi.value}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Verification" description="Pathologist queue" />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {verificationKpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {kpi.value}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Release" description="Report dispatch metrics" />
          <CardBody className="grid gap-3 sm:grid-cols-3">
            {releaseKpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {kpi.value}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader
            title="Diagnostic workflow"
            description="Billing → Sample Collection → LIS → Result Entry → Verification → Report Release → Portal"
          />
          <CardBody>
            <div className="grid gap-3 lg:grid-cols-7">
              {DIAGNOSTIC_WORKFLOW_STEPS.map((step, index) => (
                <div key={step.id} className="relative">
                  {index > 0 && (
                    <span
                      className="absolute -left-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-slate-200 lg:block"
                      aria-hidden
                    />
                  )}
                  <Link
                    href={step.href}
                    className="block h-full rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-700">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {step.description}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      {stats[step.countKey]}
                    </p>
                  </Link>
                  {index < DIAGNOSTIC_WORKFLOW_STEPS.length - 1 && (
                    <span
                      className="mx-auto my-2 block text-center text-slate-300 lg:hidden"
                      aria-hidden
                    >
                      ↓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="TAT overview" description="Turnaround time widget" />
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>On time</span>
                  <span>68%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[68%] rounded-full bg-emerald-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>At risk</span>
                  <span>22%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[22%] rounded-full bg-amber-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Overdue</span>
                  <span>10%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[10%] rounded-full bg-rose-500" />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                UI placeholder — no live TAT calculation.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Machine status" description="Analyzer connectivity" />
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>Hematology Analyzer (AST-003)</span>
                <Badge variant="success">Online</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>Biochemistry Analyzer</span>
                <Badge variant="success">Online</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>Immunoassay Analyzer</span>
                <Badge variant="warning">Maintenance</Badge>
              </div>
              <p className="text-xs text-slate-500">
                UI placeholder — no device integration.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader
            title="Pending sample collection queue"
            description="Orders billed today awaiting phlebotomy"
          />
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Tests</th>
                  <th className="px-6 py-3">Paid / Due</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((order) => (
                  <tr
                    key={order.orderNo}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-teal-700">
                      {order.orderNo}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-900">
                      {order.patientName}
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {order.patientId}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {order.tests.join(", ")}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {formatCurrency(order.paid)} /{" "}
                      {formatCurrency(order.due)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="warning">{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Branch context" />
            <CardBody className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Company / Tenant</p>
                <p className="font-medium text-slate-900">{session.tenantName}</p>
                <p className="text-xs text-slate-500">{session.tenantCode}</p>
              </div>
              <div>
                <p className="text-slate-500">Branch</p>
                <p className="font-medium text-slate-900">{session.branchName}</p>
                <p className="text-xs text-slate-500">{session.branchCode}</p>
              </div>
              <div>
                <p className="text-slate-500">Signed in as</p>
                <p className="font-medium text-slate-900">{session.user.name}</p>
                <p className="text-xs text-slate-500">{session.user.role}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Sample queue snapshot" />
            <CardBody className="space-y-3 text-sm">
              {sampleQueue.map((item) => (
                <div
                  key={item.sampleId}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">{item.patientName}</p>
                  <p className="text-xs text-slate-500">
                    {item.tests.join(", ")} · {item.tubeColor}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
