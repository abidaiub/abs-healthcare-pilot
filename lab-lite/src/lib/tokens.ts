import { createHmac, randomBytes, randomUUID } from "node:crypto";

export function generateToken(): string { return randomBytes(32).toString("base64url"); }
export function digestToken(token: string): string {
  const pepper = process.env.SESSION_TOKEN_PEPPER;
  if (!pepper || pepper.length < 32) throw new Error("SESSION_TOKEN_PEPPER must contain at least 32 characters");
  return createHmac("sha256", pepper).update(token).digest("hex");
}
export function stableOperationId(deviceId: string): string {
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(deviceId)) throw new Error("Invalid device ID");
  return `${deviceId}_${randomUUID()}`;
}
