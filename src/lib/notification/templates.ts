import type { NotificationEventType } from "@/generated/prisma/client";

export type NotificationTemplateVariables = {
  tenantName: string;
  patientName?: string;
  orderReference?: string;
  reportReference?: string;
  receiptReference?: string;
};

/**
 * Privacy-safe fallbacks used when a tenant has not configured a template.
 * Messages deliberately exclude clinical values, test names and result detail.
 */
export const DEFAULT_NOTIFICATION_BODIES: Record<NotificationEventType, string> = {
  LAB_REPORT_READY:
    "{{tenantName}}: Your diagnostic report is ready. Please sign in to the patient portal or contact the report desk. Order: {{orderReference}}",
  INVOICE_PAYMENT_RECEIPT:
    "{{tenantName}}: Payment received. Cash memo: {{receiptReference}}. Please keep this reference for your records.",
  CRITICAL_RESULT_ALERT:
    "{{tenantName}}: A result requires urgent clinical attention. Please contact the laboratory. Order: {{orderReference}}",
};

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

export function renderNotificationBody(
  template: string,
  variables: NotificationTemplateVariables,
): string {
  return template.replace(PLACEHOLDER_PATTERN, (_match, key: string) => {
    const value = (variables as Record<string, string | undefined>)[key];
    return value ?? "";
  });
}
