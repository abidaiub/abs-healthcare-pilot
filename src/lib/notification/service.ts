import type {
  NotificationChannel,
  NotificationEventType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  DEFAULT_NOTIFICATION_BODIES,
  renderNotificationBody,
  type NotificationTemplateVariables,
} from "@/lib/notification/templates";
import { resolveNotificationProvider } from "@/lib/notification/provider";
import { normalizeMobile } from "@/lib/patient/normalize";

export const MAX_NOTIFICATION_ATTEMPTS = 5;

export type EnqueueNotificationInput = {
  tenantId: string;
  branchId?: string | null;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  locale?: string;
  recipientName?: string | null;
  recipientMobile?: string | null;
  recipientEmail?: string | null;
  /** Stable per-business-event key; repeated enqueues with the same key are ignored. */
  dedupeKey: string;
  entityType?: string | null;
  entityId?: string | null;
  variables: NotificationTemplateVariables;
  createdById?: string | null;
};

export type NotificationDispatchOutcome = {
  outboxId: string;
  status: "PENDING" | "SENT" | "FAILED" | "CANCELLED";
  alreadyQueued: boolean;
  providerReference: string | null;
  failureReason: string | null;
};

async function resolveBody(input: EnqueueNotificationInput): Promise<string> {
  const template = await prisma.notificationTemplate.findFirst({
    where: {
      tenantId: input.tenantId,
      eventType: input.eventType,
      channel: input.channel,
      isActive: true,
      ...(input.locale ? { locale: input.locale } : {}),
    },
  });
  const body = template?.bodyTemplate ?? DEFAULT_NOTIFICATION_BODIES[input.eventType];
  return renderNotificationBody(body, input.variables);
}

/**
 * Queues a notification. Idempotent on `(tenantId, dedupeKey)` so a retried report release
 * or a repeated request cannot create duplicate messages.
 */
export async function enqueueNotification(input: EnqueueNotificationInput) {
  const existing = await prisma.notificationOutbox.findFirst({
    where: { tenantId: input.tenantId, dedupeKey: input.dedupeKey },
  });
  if (existing) return { record: existing, alreadyQueued: true as const };

  const messageBody = await resolveBody(input);
  const record = await prisma.notificationOutbox.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId ?? null,
      eventType: input.eventType,
      channel: input.channel,
      status: "PENDING",
      recipientName: input.recipientName ?? null,
      recipientMobile: normalizeMobile(input.recipientMobile),
      recipientEmail: input.recipientEmail ?? null,
      messageBody,
      dedupeKey: input.dedupeKey,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      createdById: input.createdById ?? null,
    },
  });
  return { record, alreadyQueued: false as const };
}

/**
 * Attempts delivery for a queued notification. Already-sent messages are never re-sent, and
 * a provider failure is recorded without throwing so it cannot corrupt the caller's state.
 */
export async function dispatchNotification(
  tenantId: string,
  outboxId: string,
): Promise<NotificationDispatchOutcome> {
  const record = await prisma.notificationOutbox.findFirst({
    where: { id: outboxId, tenantId },
  });
  if (!record) {
    return {
      outboxId,
      status: "FAILED",
      alreadyQueued: false,
      providerReference: null,
      failureReason: "NOTIFICATION_NOT_FOUND",
    };
  }

  if (record.status === "SENT" || record.status === "CANCELLED") {
    return {
      outboxId: record.id,
      status: record.status,
      alreadyQueued: true,
      providerReference: record.providerReference,
      failureReason: record.failureReason,
    };
  }

  if (record.attemptCount >= MAX_NOTIFICATION_ATTEMPTS) {
    const cancelled = await prisma.notificationOutbox.update({
      where: { id: record.id },
      data: { status: "CANCELLED", failureReason: "MAX_ATTEMPTS_EXCEEDED" },
    });
    return {
      outboxId: cancelled.id,
      status: "CANCELLED",
      alreadyQueued: false,
      providerReference: null,
      failureReason: cancelled.failureReason,
    };
  }

  const provider = resolveNotificationProvider();
  const now = new Date();

  if (!provider.supports(record.channel)) {
    const failed = await prisma.notificationOutbox.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
        attemptCount: { increment: 1 },
        lastAttemptAt: now,
        providerName: provider.name,
        failureReason: "CHANNEL_NOT_SUPPORTED",
      },
    });
    return {
      outboxId: failed.id,
      status: "FAILED",
      alreadyQueued: false,
      providerReference: null,
      failureReason: failed.failureReason,
    };
  }

  const result = await provider.send({
    channel: record.channel,
    recipientMobile: record.recipientMobile,
    recipientEmail: record.recipientEmail,
    messageBody: record.messageBody,
  });

  const updated = await prisma.notificationOutbox.update({
    where: { id: record.id },
    data: {
      status: result.ok ? "SENT" : "FAILED",
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
      sentAt: result.ok ? now : null,
      providerName: result.providerName,
      providerReference: result.ok ? result.providerReference : null,
      failureReason: result.ok ? null : result.failureReason,
    },
  });

  return {
    outboxId: updated.id,
    status: updated.status,
    alreadyQueued: false,
    providerReference: updated.providerReference,
    failureReason: updated.failureReason,
  };
}

/** Queues and immediately attempts delivery. Never throws to the calling workflow. */
export async function notify(
  input: EnqueueNotificationInput,
): Promise<NotificationDispatchOutcome> {
  try {
    const { record, alreadyQueued } = await enqueueNotification(input);
    if (alreadyQueued && record.status === "SENT") {
      return {
        outboxId: record.id,
        status: "SENT",
        alreadyQueued: true,
        providerReference: record.providerReference,
        failureReason: null,
      };
    }
    return dispatchNotification(input.tenantId, record.id);
  } catch (error) {
    return {
      outboxId: "",
      status: "FAILED",
      alreadyQueued: false,
      providerReference: null,
      failureReason: error instanceof Error ? error.name : "NOTIFICATION_ENQUEUE_FAILED",
    };
  }
}
