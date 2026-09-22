export type PendingOperation<T> = {
  operationId: string;
  tenantId: string;
  branchId: string;
  deviceId: string;
  aggregateId: string;
  aggregateVersion: number;
  occurredAtUtc: string;
  businessDate: string;
  payload: T;
};

export const OFFLINE_FINANCIAL_AUTHORITY = {
  pilotTopology: "ONE_BILLING_PC_PER_BRANCH",
  dueCollection: "ONLINE_ONLY_UNLESS_THE_BRANCH_DEVICE_HAS_AN_EXCLUSIVE_SERVER_ISSUED_LEASE",
  refund: "ONLINE_ONLY_WITH_APPROVAL",
} as const;

