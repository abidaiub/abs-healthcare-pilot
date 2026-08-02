/**
 * Money handling for MOD-10 diagnostic billing.
 *
 * All arithmetic runs on integer minor units (paisa). Values cross the Prisma
 * boundary as decimal strings so no intermediate step uses binary floating point.
 */

export type MinorUnits = number;

const MINOR_SCALE = 100;
const PERCENT_SCALE = 10_000;
const MONEY_PATTERN = /^-?\d*(\.\d*)?$/;

type DecimalLike = { toString(): string };

function toRawString(value: string | number | DecimalLike | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Money value must be finite");
    return value.toFixed(3);
  }
  return (typeof value === "string" ? value : value.toString()).trim();
}

/** Parses a decimal money string into integer minor units, rounding half-up. */
export function parseMoneyToMinor(
  value: string | number | DecimalLike | null | undefined,
): MinorUnits {
  const raw = toRawString(value);
  if (!raw || raw === "-") return 0;
  if (!MONEY_PATTERN.test(raw)) {
    throw new Error(`Invalid money value: ${raw}`);
  }

  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [wholePart = "", fractionPart = ""] = unsigned.split(".");

  const whole = wholePart === "" ? 0 : Number(wholePart);
  const padded = `${fractionPart}000`.slice(0, 3);
  const paisa = Number(padded.slice(0, 2));
  const roundingDigit = Number(padded[2]);

  let minor = whole * MINOR_SCALE + paisa;
  if (roundingDigit >= 5) minor += 1;

  return negative ? -minor : minor;
}

/** Renders integer minor units as a decimal string suitable for a Prisma Decimal column. */
export function formatMinorForDb(minor: MinorUnits): string {
  const truncated = Math.trunc(minor);
  const negative = truncated < 0;
  const absolute = Math.abs(truncated);
  const whole = Math.floor(absolute / MINOR_SCALE);
  const fraction = String(absolute % MINOR_SCALE).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/** Converts minor units to a number for presentation only — never for arithmetic. */
export function minorToDisplayNumber(minor: MinorUnits): number {
  return Math.trunc(minor) / MINOR_SCALE;
}

/**
 * Applies a percentage to a gross amount, rounding half-up.
 * `percentValue` is a human percentage such as "10" or "12.50".
 */
export function applyPercentageToMinor(
  grossMinor: MinorUnits,
  percentValue: string | number | DecimalLike,
): MinorUnits {
  const percentHundredths = parseMoneyToMinor(percentValue);
  if (percentHundredths <= 0) return 0;
  const numerator = grossMinor * percentHundredths;
  return Math.floor((numerator + PERCENT_SCALE / 2) / PERCENT_SCALE);
}

export function sumMinor(values: MinorUnits[]): MinorUnits {
  return values.reduce((total, value) => total + Math.trunc(value), 0);
}

export function clampMinor(value: MinorUnits, min: MinorUnits, max: MinorUnits): MinorUnits {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
