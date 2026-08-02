/**
 * Doctors Point (DPDC) UAT reference ranges.
 *
 * Uses the existing `ServiceParameterReferenceRange` model — no parallel table.
 * Values are sourced from approved project docs where available; remaining rows are
 * explicitly tagged CONFIGURATION_GAP / UAT-only so they are never mistaken for
 * production clinical authority.
 *
 * Scope supported by schema: tenantId + serviceParameterId + gender + ageFrom/ToDays
 * + unit + priority + normal/critical bounds. Not in schema: branch, method/analyzer,
 * effective dates.
 *
 * Sources:
 * - APPROVED_ARCHITECTURE — docs/Architecture/04-Phase2-DiagnosticSchemaDesign.md §6.3
 * - APPROVED_SAMPLE_DICT — docs/PDF|UIUXMockups Sample Data Dictionary §17
 * - APPROVED_RESULT_FOUNDATION — prisma/seed/result-foundation.ts criticals (pilot CBC)
 * - CONFIGURATION_GAP_UAT_ONLY — no approved numeric range; provisional for UAT workflow only
 */

import type { PrismaClient } from "../../../src/generated/prisma/client";

export type RangeAuthority =
  | "APPROVED_ARCHITECTURE"
  | "APPROVED_SAMPLE_DICT"
  | "APPROVED_RESULT_FOUNDATION"
  | "CONFIGURATION_GAP_UAT_ONLY"
  | "TEXT_DISPLAY_ONLY";

export type DoctorsPointRangeSeed = {
  hostServiceCode: string;
  parameterCode: string;
  gender: string | null;
  ageFromDays: number | null;
  ageToDays: number | null;
  normalLow: number | null;
  normalHigh: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  textRange: string | null;
  unit: string | null;
  priority: number;
  authority: RangeAuthority;
  notes: string;
};

/** Adult boundary used by Architecture §6.3 and result-foundation (18y × 365). */
export const ADULT_FROM_DAYS = 6570;
/** Day before adult boundary — paediatric upper bound for Case 3 (12y). */
export const PAEDIATRIC_TO_DAYS = ADULT_FROM_DAYS - 1;

export const DOCTORS_POINT_REFERENCE_RANGE_GAPS = [
  {
    hostServiceCode: "ESR",
    parameterCode: "ESR",
    reason: "No approved numeric ESR range in Architecture §6.3 or Sample Data Dictionary §17",
  },
  {
    hostServiceCode: "RBS",
    parameterCode: "GLU",
    reason: "Sample Data Dictionary §17 documents FBS only; RBS range is not approved",
  },
  {
    hostServiceCode: "CREAT",
    parameterCode: "CREAT",
    reason: "No approved Serum Creatinine reference range in project sources",
  },
  {
    hostServiceCode: "TSH",
    parameterCode: "TSH",
    reason: "No approved TSH reference range in project sources",
  },
  {
    hostServiceCode: "FT4",
    parameterCode: "FT4",
    reason: "No approved Free T4 reference range in project sources",
  },
  {
    hostServiceCode: "ELECTRO",
    parameterCode: "NA",
    reason: "No approved Sodium reference range in project sources",
  },
  {
    hostServiceCode: "ELECTRO",
    parameterCode: "K",
    reason: "No approved Potassium reference range in project sources",
  },
  {
    hostServiceCode: "ELECTRO",
    parameterCode: "CL",
    reason: "No approved Chloride reference range in project sources",
  },
  {
    hostServiceCode: "CBC",
    parameterCode: "HGB",
    reason: "Architecture §6.3 CBC HGB starts at adult day 6570; no approved paediatric HGB row",
  },
] as const;

/**
 * Minimum complete DPDC UAT ranges for Case 1–3 parameter coverage.
 * CONFIGURATION_GAP_UAT_ONLY rows are provisional workflow values only.
 */
export const DOCTORS_POINT_REFERENCE_RANGES: DoctorsPointRangeSeed[] = [
  // ---- CBC HGB (Architecture §6.3 normals + result-foundation criticals) ---------------
  {
    hostServiceCode: "CBC",
    parameterCode: "HGB",
    gender: "M",
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 13,
    normalHigh: 17,
    criticalLow: 7,
    criticalHigh: 20,
    textRange: null,
    unit: "g/dL",
    priority: 10,
    authority: "APPROVED_ARCHITECTURE",
    notes: "Architecture §6.3 adult male; criticals from result-foundation",
  },
  {
    hostServiceCode: "CBC",
    parameterCode: "HGB",
    gender: "F",
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 12,
    normalHigh: 16,
    criticalLow: 7,
    criticalHigh: 20,
    textRange: null,
    unit: "g/dL",
    priority: 10,
    authority: "APPROVED_ARCHITECTURE",
    notes: "Architecture §6.3 adult female 12–16; criticals from result-foundation",
  },
  {
    hostServiceCode: "CBC",
    parameterCode: "HGB",
    gender: "M",
    ageFromDays: 0,
    ageToDays: PAEDIATRIC_TO_DAYS,
    normalLow: 11.5,
    normalHigh: 15.5,
    criticalLow: 7,
    criticalHigh: 20,
    textRange: null,
    unit: "g/dL",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only paediatric male HGB for Case 3 — not an approved clinical source",
  },
  // ---- CBC WBC / PLT (Architecture age 0–36500; criticals from result-foundation) ------
  {
    hostServiceCode: "CBC",
    parameterCode: "WBC",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: 4000,
    normalHigh: 11000,
    criticalLow: 2000,
    criticalHigh: 30000,
    textRange: null,
    unit: "/cumm",
    priority: 10,
    authority: "APPROVED_ARCHITECTURE",
    notes: "Architecture §6.3 BOTH 0–36500; criticals from result-foundation",
  },
  {
    hostServiceCode: "CBC",
    parameterCode: "PLT",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: 150000,
    normalHigh: 450000,
    criticalLow: 50000,
    criticalHigh: 1000000,
    textRange: null,
    unit: "/cumm",
    priority: 10,
    authority: "APPROVED_ARCHITECTURE",
    notes: "Architecture §6.3 BOTH 0–36500; criticals from result-foundation",
  },
  // ---- ESR (gap) -----------------------------------------------------------------------
  {
    hostServiceCode: "ESR",
    parameterCode: "ESR",
    gender: "M",
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 0,
    normalHigh: 15,
    criticalLow: null,
    criticalHigh: null,
    textRange: null,
    unit: "mm/1st hour",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only adult male ESR",
  },
  {
    hostServiceCode: "ESR",
    parameterCode: "ESR",
    gender: "F",
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 0,
    normalHigh: 20,
    criticalLow: null,
    criticalHigh: null,
    textRange: null,
    unit: "mm/1st hour",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only adult female ESR",
  },
  {
    hostServiceCode: "ESR",
    parameterCode: "ESR",
    gender: "M",
    ageFromDays: 0,
    ageToDays: PAEDIATRIC_TO_DAYS,
    normalLow: 0,
    normalHigh: 10,
    criticalLow: null,
    criticalHigh: null,
    textRange: null,
    unit: "mm/1st hour",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only paediatric male ESR for Case 3",
  },
  // ---- FBS (Sample Data Dictionary §17) ------------------------------------------------
  {
    hostServiceCode: "FBS",
    parameterCode: "GLU",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: 3.9,
    normalHigh: 5.5,
    criticalLow: 2.2,
    criticalHigh: 22,
    textRange: null,
    unit: "mmol/L",
    priority: 10,
    authority: "APPROVED_SAMPLE_DICT",
    notes: "Sample Dict §17 FBS 3.9–5.5 mmol/L; criticals UAT workflow extension",
  },
  // ---- RBS (gap; same unit as host GLU) ------------------------------------------------
  {
    hostServiceCode: "RBS",
    parameterCode: "GLU",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: 3.9,
    normalHigh: 7.8,
    criticalLow: 2.2,
    criticalHigh: 22,
    textRange: null,
    unit: "mmol/L",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only RBS — FBS range approved; RBS upper bound provisional",
  },
  // ---- HbA1c (Sample Data Dictionary §17: normal < 5.7%) -------------------------------
  {
    hostServiceCode: "HBA1C",
    parameterCode: "HBA1C",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: null,
    normalHigh: 5.7,
    criticalLow: null,
    criticalHigh: 14,
    textRange: "< 5.7%",
    unit: "%",
    priority: 10,
    authority: "APPROVED_SAMPLE_DICT",
    notes: "Sample Dict §17 normal < 5.7%; criticalHigh UAT workflow only",
  },
  // ---- Creatinine (gap) ----------------------------------------------------------------
  {
    hostServiceCode: "CREAT",
    parameterCode: "CREAT",
    gender: "M",
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 0.7,
    normalHigh: 1.3,
    criticalLow: 0.2,
    criticalHigh: 5,
    textRange: null,
    unit: "mg/dL",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only adult male creatinine",
  },
  {
    hostServiceCode: "CREAT",
    parameterCode: "CREAT",
    gender: "F",
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 0.6,
    normalHigh: 1.1,
    criticalLow: 0.2,
    criticalHigh: 5,
    textRange: null,
    unit: "mg/dL",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only adult female creatinine",
  },
  // ---- TSH / FT4 (gap) -----------------------------------------------------------------
  {
    hostServiceCode: "TSH",
    parameterCode: "TSH",
    gender: null,
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 0.4,
    normalHigh: 4.0,
    criticalLow: 0.01,
    criticalHigh: 20,
    textRange: null,
    unit: "mIU/L",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only adult TSH",
  },
  {
    hostServiceCode: "FT4",
    parameterCode: "FT4",
    gender: null,
    ageFromDays: ADULT_FROM_DAYS,
    ageToDays: null,
    normalLow: 0.8,
    normalHigh: 1.8,
    criticalLow: 0.2,
    criticalHigh: 4,
    textRange: null,
    unit: "ng/dL",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only adult Free T4",
  },
  // ---- Electrolytes (gap; K carries Case 3 critical) -----------------------------------
  {
    hostServiceCode: "ELECTRO",
    parameterCode: "NA",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: 136,
    normalHigh: 145,
    criticalLow: 120,
    criticalHigh: 160,
    textRange: null,
    unit: "mmol/L",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only sodium — covers adult + paediatric Case profiles",
  },
  {
    hostServiceCode: "ELECTRO",
    parameterCode: "K",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: 3.5,
    normalHigh: 5.1,
    criticalLow: 2.5,
    criticalHigh: 6.0,
    textRange: null,
    unit: "mmol/L",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only potassium with critical thresholds for Case 3 acknowledgement",
  },
  {
    hostServiceCode: "ELECTRO",
    parameterCode: "CL",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: 98,
    normalHigh: 107,
    criticalLow: 80,
    criticalHigh: 120,
    textRange: null,
    unit: "mmol/L",
    priority: 10,
    authority: "CONFIGURATION_GAP_UAT_ONLY",
    notes: "UAT-only chloride",
  },
  // ---- Urine R/E (TEXT — flag NOT_APPLICABLE; textRange for report display only) -------
  {
    hostServiceCode: "URINE",
    parameterCode: "APPEAR",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: null,
    normalHigh: null,
    criticalLow: null,
    criticalHigh: null,
    textRange: "Clear",
    unit: null,
    priority: 10,
    authority: "TEXT_DISPLAY_ONLY",
    notes: "TEXT parameter — abnormal flag N/A; textRange for report snapshot only",
  },
  {
    hostServiceCode: "URINE",
    parameterCode: "PROT",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: null,
    normalHigh: null,
    criticalLow: null,
    criticalHigh: null,
    textRange: "Nil",
    unit: null,
    priority: 10,
    authority: "TEXT_DISPLAY_ONLY",
    notes: "TEXT parameter — abnormal flag N/A; textRange for report snapshot only",
  },
  {
    hostServiceCode: "URINE",
    parameterCode: "SUGAR",
    gender: null,
    ageFromDays: 0,
    ageToDays: null,
    normalLow: null,
    normalHigh: null,
    criticalLow: null,
    criticalHigh: null,
    textRange: "Nil",
    unit: null,
    priority: 10,
    authority: "TEXT_DISPLAY_ONLY",
    notes: "TEXT parameter — abnormal flag N/A; textRange for report snapshot only",
  },
];

const ACTOR = "seed.uat.dpdc.reference-ranges";

export async function seedDoctorsPointReferenceRanges(
  prisma: PrismaClient,
  tenantId: string,
): Promise<{ createdOrUpdated: number; gaps: number }> {
  let createdOrUpdated = 0;

  for (const seed of DOCTORS_POINT_REFERENCE_RANGES) {
    const parameter = await prisma.serviceParameter.findFirst({
      where: {
        tenantId,
        parameterCode: seed.parameterCode,
        tenantService: { hostService: { serviceCode: seed.hostServiceCode } },
      },
      select: { id: true, unit: true },
    });
    if (!parameter) continue;

    if (
      seed.unit &&
      parameter.unit &&
      seed.unit.trim().toLowerCase() !== parameter.unit.trim().toLowerCase()
    ) {
      throw new Error(
        `DPDC range unit mismatch for ${seed.hostServiceCode}/${seed.parameterCode}: ` +
          `range=${seed.unit} parameter=${parameter.unit}`,
      );
    }

    const existing = await prisma.serviceParameterReferenceRange.findFirst({
      where: {
        tenantId,
        serviceParameterId: parameter.id,
        gender: seed.gender,
        ageFromDays: seed.ageFromDays,
        priority: seed.priority,
      },
    });

    const data = {
      ageToDays: seed.ageToDays,
      normalLow: seed.normalLow,
      normalHigh: seed.normalHigh,
      criticalLow: seed.criticalLow,
      criticalHigh: seed.criticalHigh,
      textRange: seed.textRange,
      unit: seed.unit,
      isActive: true,
      updatedBy: ACTOR,
    };

    if (existing) {
      await prisma.serviceParameterReferenceRange.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.serviceParameterReferenceRange.create({
        data: {
          tenantId,
          serviceParameterId: parameter.id,
          gender: seed.gender,
          ageFromDays: seed.ageFromDays,
          priority: seed.priority,
          createdBy: `${ACTOR}:${seed.authority}`,
          ...data,
        },
      });
    }
    createdOrUpdated += 1;
  }

  return { createdOrUpdated, gaps: DOCTORS_POINT_REFERENCE_RANGE_GAPS.length };
}
