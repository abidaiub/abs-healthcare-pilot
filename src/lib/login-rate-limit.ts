import { cookies } from "next/headers";

import { prisma } from "@/lib/db";

const ATTEMPT_COOKIE = "abs-login-attempts";
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

type AttemptRecord = {
  count: number;
  firstAttemptAt: number;
};

async function readAttempts(key: string): Promise<AttemptRecord | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(`${ATTEMPT_COOKIE}-${key}`)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return null;
  }
}

async function writeAttempts(key: string, record: AttemptRecord): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${ATTEMPT_COOKIE}-${key}`, JSON.stringify(record), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WINDOW_SECONDS,
  });
}

export async function assertLoginAllowed(scope: string): Promise<void> {
  const record = await readAttempts(scope);
  if (!record) return;

  const elapsedMs = Date.now() - record.firstAttemptAt;
  if (elapsedMs > WINDOW_SECONDS * 1000) return;

  if (record.count >= MAX_ATTEMPTS) {
    throw new Error(
      "Too many failed login attempts. Please wait a few minutes and try again.",
    );
  }
}

export async function recordFailedLogin(
  scope: string,
  userId?: string,
): Promise<number> {
  const record = await readAttempts(scope);
  const now = Date.now();

  let nextCount = 1;
  if (record && now - record.firstAttemptAt <= WINDOW_SECONDS * 1000) {
    nextCount = record.count + 1;
  }

  await writeAttempts(scope, {
    count: nextCount,
    firstAttemptAt: record && now - record.firstAttemptAt <= WINDOW_SECONDS * 1000
      ? record.firstAttemptAt
      : now,
  });

  if (nextCount >= MAX_ATTEMPTS && userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { userStatus: "LOCKED" },
    });
  }

  return nextCount;
}

export async function clearLoginAttempts(scope: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`${ATTEMPT_COOKIE}-${scope}`);
}
