import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function generateTemporaryPassword(length = 16): string {
  const minLength = Math.max(length, 12);
  const lowers = "abcdefghijkmnopqrstuvwxyz";
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const specials = "!@#$%&*";
  const all = lowers + uppers + digits + specials;
  const required = [lowers[randomBytes(1)[0]! % lowers.length], uppers[randomBytes(1)[0]! % uppers.length], digits[randomBytes(1)[0]! % digits.length], specials[randomBytes(1)[0]! % specials.length]];
  const rest = Array.from(randomBytes(minLength - required.length), (byte) => all[byte % all.length]);
  return [...required, ...rest].sort(() => randomBytes(1)[0]! / 255 - 0.5).join("");
}

export function validatePassword(password: string): string | null {
  if (password.length < 12) return "Password must contain at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) return "Password must contain lower, upper, number, and special characters.";
  return null;
}

export function hashPassword(password: string): string {
  const error = validatePassword(password);
  if (error) throw new Error(error);
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, KEYLEN).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(password, salt, KEYLEN);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}

