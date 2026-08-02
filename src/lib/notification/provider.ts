import type { NotificationChannel } from "@/generated/prisma/client";

export type NotificationSendRequest = {
  channel: NotificationChannel;
  recipientMobile: string | null;
  recipientEmail: string | null;
  messageBody: string;
};

export type NotificationSendResult =
  | { ok: true; providerName: string; providerReference: string | null }
  | { ok: false; providerName: string; failureReason: string };

export type NotificationProvider = {
  name: string;
  supports(channel: NotificationChannel): boolean;
  send(request: NotificationSendRequest): Promise<NotificationSendResult>;
};

/**
 * Development/QC provider. It records that a dispatch was attempted without contacting an
 * external gateway and without writing recipient contact details or message content to logs.
 */
const consoleProvider: NotificationProvider = {
  name: "console",
  supports: () => true,
  async send() {
    return {
      ok: true,
      providerName: "console",
      providerReference: `console-${Date.now().toString(36)}`,
    };
  },
};

/**
 * Generic HTTP gateway provider. Endpoint and credentials come from environment
 * configuration only; nothing is hardcoded and no secret is ever logged or persisted.
 */
function createHttpProvider(name: string): NotificationProvider {
  return {
    name,
    supports: (channel) => channel === "SMS" || channel === "WHATSAPP",
    async send(request) {
      const endpoint = process.env.NOTIFICATION_GATEWAY_URL;
      const apiKey = process.env.NOTIFICATION_GATEWAY_API_KEY;
      const sender = process.env.NOTIFICATION_GATEWAY_SENDER_ID;

      if (!endpoint || !apiKey) {
        return {
          ok: false,
          providerName: name,
          failureReason: "NOTIFICATION_GATEWAY_NOT_CONFIGURED",
        };
      }
      if (!request.recipientMobile) {
        return { ok: false, providerName: name, failureReason: "RECIPIENT_MOBILE_MISSING" };
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            channel: request.channel,
            to: request.recipientMobile,
            from: sender ?? undefined,
            message: request.messageBody,
          }),
        });

        if (!response.ok) {
          return {
            ok: false,
            providerName: name,
            failureReason: `GATEWAY_HTTP_${response.status}`,
          };
        }

        const payload = (await response.json().catch(() => null)) as {
          reference?: string;
          messageId?: string;
        } | null;

        return {
          ok: true,
          providerName: name,
          providerReference: payload?.reference ?? payload?.messageId ?? null,
        };
      } catch {
        return { ok: false, providerName: name, failureReason: "GATEWAY_UNREACHABLE" };
      }
    },
  };
}

/**
 * Resolves the configured provider. Defaults to the console provider so a deployment
 * without gateway configuration never blocks a clinical workflow.
 */
export function resolveNotificationProvider(): NotificationProvider {
  const configured = process.env.NOTIFICATION_PROVIDER?.trim().toLowerCase();
  if (!configured || configured === "console" || configured === "log") {
    return consoleProvider;
  }
  return createHttpProvider(configured);
}
