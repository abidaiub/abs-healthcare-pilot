export type MinorUnits = number;
export type DecimalLike = { toString(): string };

export function parseMoneyToMinor(value: string | number | DecimalLike): MinorUnits {
  const raw = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) throw new Error("Invalid money value");
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const padded = `${fraction}000`;
  let minor = Number(whole) * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) minor += 1;
  if (!Number.isSafeInteger(minor)) throw new Error("Money value exceeds safe range");
  return negative ? -minor : minor;
}

export function formatMinor(minor: MinorUnits): string {
  if (!Number.isSafeInteger(minor)) throw new Error("Minor units must be a safe integer");
  const sign = minor < 0 ? "-" : "";
  const absolute = Math.abs(minor);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

