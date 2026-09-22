import { query } from "../lib/db";

function normalizePhone(value?: string) { return value?.replace(/\D/g, "") || null; }

export async function createDoctor(input: { tenantId: string; branchId?: string; code: string; name: string; phone?: string }) {
  return (await query<{ id: string }>(
    `insert into doctors(tenant_id,branch_id,code,name,phone) values($1,$2,upper($3),$4,$5) returning id`,
    [input.tenantId, input.branchId ?? null, input.code, input.name, input.phone ?? null],
  )).rows[0];
}

export async function createReferralPartner(input: { tenantId: string; branchId?: string; code: string; name: string; type: "BROKER" | "AGENT" | "COLLECTION_POINT" | "CORPORATE" | "POLLI_DOCTOR" }) {
  return (await query<{ id: string }>(
    `insert into referral_partners(tenant_id,branch_id,code,name,type) values($1,$2,upper($3),$4,$5) returning id`,
    [input.tenantId, input.branchId ?? null, input.code, input.name, input.type],
  )).rows[0];
}

export async function createPatient(input: { tenantId: string; branchId: string; patientNumber: string; fullName: string; sex?: "M" | "F" | "OTHER" | "UNKNOWN"; mobile?: string; nationalId?: string }) {
  return (await query<{ id: string }>(
    `insert into patients(tenant_id,registration_branch_id,patient_number,full_name,sex,mobile,mobile_normalized,national_id_normalized)
     values($1,$2,upper($3),$4,$5,$6,$7,$8) returning id`,
    [input.tenantId, input.branchId, input.patientNumber, input.fullName, input.sex ?? "UNKNOWN", input.mobile ?? null,
      normalizePhone(input.mobile), input.nationalId?.replace(/\s/g, "").toUpperCase() ?? null],
  )).rows[0];
}

export async function searchPatients(tenantId: string, term: string) {
  const normalized = normalizePhone(term);
  return (await query<{ id: string; patient_number: string; full_name: string; mobile: string | null }>(
    `select id,patient_number,full_name,mobile from patients where tenant_id=$1 and is_active and
     (lower(full_name) like lower($2) or patient_number=upper($3) or ($4::text is not null and mobile_normalized=$4))
     order by full_name limit 50`, [tenantId, `%${term.trim()}%`, term.trim(), normalized],
  )).rows;
}

export async function listDirectories(tenantId: string) {
  const [doctors, partners] = await Promise.all([
    query(`select id,code,name,phone from doctors where tenant_id=$1 and is_active order by name`, [tenantId]),
    query(`select id,code,name,type from referral_partners where tenant_id=$1 and is_active order by name`, [tenantId]),
  ]);
  return { doctors: doctors.rows, partners: partners.rows };
}
