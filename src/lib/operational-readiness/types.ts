export type ReadinessTone = "green" | "yellow" | "red";

export type ReadinessCheckItem = {
  id: string;
  label: string;
  tone: ReadinessTone;
  detail: string;
  href?: string;
  blocking: boolean;
  missing?: string[];
};

export type OperationalReadinessReport = {
  scorePercent: number;
  readyStatus: "NOT_READY" | "READY_FOR_FIRST_PATIENT";
  canDeclareReady: boolean;
  declaredReady: boolean;
  declaredReadyAt: string | null;
  declaredReadyBy: string | null;
  items: ReadinessCheckItem[];
  blockers: string[];
};
