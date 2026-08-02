"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  saveAnalyzerLisConfigAction,
  testAnalyzerLisConnectionAction,
} from "@/app/actions/tenant-operational-readiness";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@/components/ui";

type Analyzer = {
  id: string;
  analyzerCode: string;
  machineName: string;
  lisEndpoint: string | null;
  lisConnectionStatus: string;
  lisLastCommunicationAt: string | null;
  mappedTests: string[];
};

export function LisReadinessPanel({
  analyzers,
  canEdit,
}: {
  analyzers: Analyzer[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<Record<string, string>>(
    Object.fromEntries(analyzers.map((a) => [a.id, a.lisEndpoint ?? ""])),
  );

  function save(id: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAnalyzerLisConfigAction({
        analyzerId: id,
        lisEndpoint: endpoints[id] ?? "",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("LIS endpoint saved.");
      router.refresh();
    });
  }

  function test(id: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const saveResult = await saveAnalyzerLisConfigAction({
        analyzerId: id,
        lisEndpoint: endpoints[id] || "sim://local-lis",
      });
      if (!saveResult.ok) {
        setError(saveResult.error);
        return;
      }
      const result = await testAnalyzerLisConnectionAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`Import/connection test OK · ${result.data?.status}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="LIS Readiness"
          description="No real hardware required. Configure simulated endpoints and run connection/import tests."
        />
        <CardBody className="text-sm text-slate-600">
          {error && <p className="text-rose-600">{error}</p>}
          {message && <p className="text-emerald-700">{message}</p>}
        </CardBody>
      </Card>

      {analyzers.map((a) => (
        <Card key={a.id}>
          <CardHeader
            title={`${a.machineName} (${a.analyzerCode})`}
            description={`Mapped tests: ${a.mappedTests.length ? a.mappedTests.join(", ") : "none"}`}
            action={
              <Badge
                variant={
                  a.lisConnectionStatus.includes("CONNECTED")
                    ? "success"
                    : a.lisConnectionStatus === "CONFIGURED"
                      ? "warning"
                      : "danger"
                }
              >
                {a.lisConnectionStatus}
              </Badge>
            }
          />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Input
              label="LIS endpoint"
              value={endpoints[a.id] ?? ""}
              disabled={!canEdit || pending}
              className="md:col-span-2"
              onChange={(e) =>
                setEndpoints((prev) => ({ ...prev, [a.id]: e.target.value }))
              }
            />
            <div className="text-sm text-slate-600">
              Last communication:{" "}
              {a.lisLastCommunicationAt
                ? new Date(a.lisLastCommunicationAt).toLocaleString()
                : "Never"}
            </div>
          </CardBody>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              disabled={!canEdit || pending}
              onClick={() => save(a.id)}
            >
              Save endpoint
            </Button>
            <Button
              type="button"
              disabled={!canEdit || pending}
              onClick={() => test(a.id)}
            >
              Import / connection test
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
