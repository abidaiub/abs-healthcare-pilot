import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui";

export function SetupEmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="py-12 text-center">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        {children && <div className="mt-4">{children}</div>}
      </CardBody>
    </Card>
  );
}

export function SetupErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardBody className="py-8">
        <p className="text-sm font-semibold text-rose-700">Failed to load data</p>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
      </CardBody>
    </Card>
  );
}
