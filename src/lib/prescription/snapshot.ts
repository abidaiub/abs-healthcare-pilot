import type { Prisma } from "@/generated/prisma/client";
import type { PrescriptionDurationUnit } from "@/generated/prisma/client";

function parseDurationUnit(value: string | null | undefined): PrescriptionDurationUnit | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper.includes("WEEK")) return "WEEK";
  if (upper.includes("MONTH")) return "MONTH";
  if (upper.includes("DAY") || /^\d+$/.test(value.trim())) return "DAY";
  return null;
}

function parseDurationValue(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function replacePrescriptionSnapshotFromEncounter(
  tx: Prisma.TransactionClient,
  prescriptionId: string,
  tenantId: string,
  encounter: {
    generalAdvice: string | null;
    followUpDate: Date | null;
    followUpIntervalDays: number | null;
    followUpInstructions: string | null;
    clinicalNotes: string | null;
    diagnoses: Array<{
      id: string;
      diagnosisType: "PRIMARY" | "SECONDARY" | "PROVISIONAL" | "CONFIRMED";
      diagnosisText: string;
      icdCode: string | null;
      notes: string | null;
      sortOrder: number;
    }>;
    medicines: Array<{
      id: string;
      medicineText: string;
      strength: string | null;
      dose: string | null;
      route: string | null;
      frequency: string | null;
      duration: string | null;
      quantity: string | null;
      instructions: string | null;
      foodTiming: string | null;
      sortOrder: number;
    }>;
    investigations: Array<{
      id: string;
      investigationText: string;
      priority: string | null;
      instructions: string | null;
      clinicalNote: string | null;
      status: "ADVISED" | "CANCELLED";
      sortOrder: number;
    }>;
  },
) {
  await tx.prescriptionMedicine.deleteMany({ where: { prescriptionId, tenantId } });
  await tx.prescriptionDiagnosis.deleteMany({ where: { prescriptionId, tenantId } });
  await tx.prescriptionInvestigation.deleteMany({ where: { prescriptionId, tenantId } });

  if (encounter.diagnoses.length > 0) {
    await tx.prescriptionDiagnosis.createMany({
      data: encounter.diagnoses.map((row, index) => ({
        tenantId,
        prescriptionId,
        sourceEncounterDiagnosisId: row.id,
        diagnosisType: row.diagnosisType,
        diagnosisText: row.diagnosisText,
        icdCode: row.icdCode,
        notes: row.notes,
        sequence: row.sortOrder ?? index,
      })),
    });
  }

  if (encounter.medicines.length > 0) {
    await tx.prescriptionMedicine.createMany({
      data: encounter.medicines.map((row, index) => ({
        tenantId,
        prescriptionId,
        sourceEncounterMedicineAdviceId: row.id,
        medicineName: row.medicineText,
        strength: row.strength,
        dose: row.dose,
        route: row.route,
        frequency: row.frequency,
        durationValue: parseDurationValue(row.duration),
        durationUnit: parseDurationUnit(row.duration),
        durationText: row.duration,
        quantity: row.quantity,
        foodTiming: row.foodTiming,
        instructions: row.instructions,
        sequence: row.sortOrder ?? index,
      })),
    });
  }

  if (encounter.investigations.length > 0) {
    await tx.prescriptionInvestigation.createMany({
      data: encounter.investigations.map((row, index) => ({
        tenantId,
        prescriptionId,
        sourceEncounterInvestigationId: row.id,
        investigationText: row.investigationText,
        priority: row.priority,
        instructions: row.instructions,
        clinicalNote: row.clinicalNote,
        status: row.status,
        sequence: row.sortOrder ?? index,
      })),
    });
  }

  await tx.prescription.update({
    where: { id: prescriptionId },
    data: {
      generalAdvice: encounter.generalAdvice,
      followUpDate: encounter.followUpDate,
      followUpIntervalDays: encounter.followUpIntervalDays,
      followUpInstructions: encounter.followUpInstructions,
      clinicalSummary: encounter.clinicalNotes,
    },
  });
}

export async function prescriptionHasClinicalContent(
  tx: Prisma.TransactionClient,
  prescriptionId: string,
  tenantId: string,
): Promise<boolean> {
  const [medicines, diagnoses, investigations, prescription] = await Promise.all([
    tx.prescriptionMedicine.count({ where: { prescriptionId, tenantId, isActive: true } }),
    tx.prescriptionDiagnosis.count({ where: { prescriptionId, tenantId, isActive: true } }),
    tx.prescriptionInvestigation.count({ where: { prescriptionId, tenantId, isActive: true } }),
    tx.prescription.findFirst({ where: { id: prescriptionId, tenantId } }),
  ]);
  return (
    medicines > 0 ||
    diagnoses > 0 ||
    investigations > 0 ||
    Boolean(prescription?.generalAdvice?.trim()) ||
    Boolean(prescription?.followUpInstructions?.trim())
  );
}
