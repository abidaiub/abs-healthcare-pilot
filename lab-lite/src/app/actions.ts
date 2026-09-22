"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE, requirePrincipal } from "../lib/session";
import { authenticate, changeOwnPassword, createUser, revokeSession } from "../services/identity";
import { installCatalogTier, installTemplate, type CatalogTier } from "../services/catalog";
import { createDoctor, createPatient, createReferralPartner } from "../services/records";
import { query } from "../lib/db";

function text(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }

export async function loginAction(form: FormData) {
  const login = await authenticate({ tenantCode: text(form, "tenantCode"), branchCode: text(form, "branchCode"), username: text(form, "username"), password: text(form, "password") });
  if (!login) redirect("/login?error=invalid");
  (await cookies()).set(SESSION_COOKIE, login.token, { httpOnly: true, sameSite: "strict", secure: process.env.COOKIE_SECURE === "true", path: "/", maxAge: 60 * 60 * 12 });
  redirect("/");
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function changePasswordAction(form: FormData) {
  const p = await requirePrincipal(undefined, undefined, true);
  await changeOwnPassword(p.tenantId, p.userId, text(form, "currentPassword"), text(form, "newPassword"));
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function updateTenantAction(form: FormData) {
  const principal = await requirePrincipal("tenant_settings", "update");
  const receiptFormat=text(form,"receiptFormat")||"A5";if(!["A4","A5","POS80","POS58"].includes(receiptFormat))throw new Error("Invalid receipt format");
  await query(`update tenants set name=$2,address=$3,phone=$4,email=$5,receipt_footer=$6,receipt_format=$7,show_referral_partner_on_receipt=$8,counter_discount_limit_bps=$9,admin_discount_limit_bps=$10,updated_at=now() where id=$1`,
    [principal.tenantId, text(form, "name"), text(form, "address") || null, text(form, "phone") || null, text(form, "email") || null, text(form, "receiptFooter") || null,receiptFormat,form.get("showReferral")==="on",Number(text(form,"counterDiscountBps")||1000),Number(text(form,"adminDiscountBps")||3000)]);
  revalidatePath("/settings");
}

export async function createBranchAction(form: FormData) {
  const principal = await requirePrincipal("branches", "create");
  await query(`insert into branches(tenant_id,code,name,address,phone) values($1,upper($2),$3,$4,$5)`,
    [principal.tenantId, text(form, "code"), text(form, "name"), text(form, "address") || null, text(form, "phone") || null]);
  revalidatePath("/settings");
}

export async function createUserAction(form: FormData) {
  const principal = await requirePrincipal("users", "create");
  await createUser({ tenantId: principal.tenantId, username: text(form, "username"), displayName: text(form, "displayName"), password: text(form, "password"), roleCode: text(form, "roleCode") as "LAB_ADMIN" | "COUNTER" | "ACCOUNTS_VIEWER", branchId: text(form, "branchId") || principal.branchId });
  revalidatePath("/settings");
}

export async function installCatalogAction(form: FormData) {
  const principal = await requirePrincipal("catalog", "create");
  await installTemplate(principal.tenantId, text(form, "templateCode"), text(form, "price") || null);
  revalidatePath("/catalog");
}

export async function installCatalogTierAction(form: FormData) {
  const principal = await requirePrincipal("catalog", "create");
  await installCatalogTier(principal.tenantId, text(form, "tier") as CatalogTier);
  revalidatePath("/catalog");
}

export async function updateTenantTestAction(form: FormData) {
  const p = await requirePrincipal("catalog", "update");
  await query(`update tenant_tests set name=$3,price=$4,name_customized=true,updated_at=now() where tenant_id=$1 and id=$2`,
    [p.tenantId, text(form, "testId"), text(form, "name"), text(form, "price") || null]);
  revalidatePath("/catalog");
}

export async function updateResultFieldAction(form: FormData) {
  const p = await requirePrincipal("catalog", "update");
  await query(`update tenant_result_fields set name=$3,method_code=$4,is_customized=true where tenant_id=$1 and id=$2`,
    [p.tenantId, text(form, "fieldId"), text(form, "name"), text(form, "methodCode") || null]);
  revalidatePath("/catalog");
}

export async function addReferenceRangeAction(form: FormData) {
  const p = await requirePrincipal("catalog", "update");
  const fieldId = text(form, "fieldId");
  const owned = await query(`select 1 from tenant_result_fields where tenant_id=$1 and id=$2`, [p.tenantId, fieldId]);
  if (!owned.rowCount) throw new Error("Result field does not belong to tenant");
  await query(`insert into tenant_reference_ranges(tenant_id,result_field_id,sex,age_from_days,age_to_days,method_code,normal_low,normal_high,text_range,provenance,review_status,is_customized)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,'TENANT_AUTHORED','UNREVIEWED',true)`, [p.tenantId, fieldId, text(form,"sex")||null, text(form,"ageFrom")||null, text(form,"ageTo")||null, text(form,"methodCode")||null, text(form,"low")||null, text(form,"high")||null, text(form,"textRange")||null]);
  revalidatePath("/catalog");
}

export async function createCatalogLookupAction(form: FormData) {
  const p = await requirePrincipal("catalog", "create");
  const kind = text(form, "kind"); const code = text(form, "code"); const name = text(form, "name");
  if (kind === "group") await query(`insert into test_groups(tenant_id,code,name) values($1,upper($2),$3)`, [p.tenantId,code,name]);
  else if (kind === "specimen") await query(`insert into specimens(tenant_id,code,name,container) values($1,upper($2),$3,$4)`, [p.tenantId,code,name,text(form,"detail")||null]);
  else if (kind === "unit") await query(`insert into units(tenant_id,code,symbol,name) values($1,upper($2),$3,$4)`, [p.tenantId,code,text(form,"detail")||code,name]);
  else throw new Error("Unsupported catalog lookup type");
  revalidatePath("/catalog");
}

export async function createDoctorAction(form: FormData) {
  const p = await requirePrincipal("directories", "create");
  await createDoctor({ tenantId: p.tenantId, branchId: p.branchId, code: text(form, "code"), name: text(form, "name"), phone: text(form, "phone") });
  revalidatePath("/directories");
}

export async function createPartnerAction(form: FormData) {
  const p = await requirePrincipal("directories", "create");
  await createReferralPartner({ tenantId: p.tenantId, branchId: p.branchId, code: text(form, "code"), name: text(form, "name"), type: text(form, "type") as "BROKER" | "AGENT" | "COLLECTION_POINT" | "CORPORATE" | "POLLI_DOCTOR" });
  revalidatePath("/directories");
}

export async function createPatientAction(form: FormData) {
  const p = await requirePrincipal("patients", "create");
  await createPatient({ tenantId: p.tenantId, branchId: p.branchId, patientNumber: text(form, "patientNumber"), fullName: text(form, "fullName"), mobile: text(form, "mobile"), sex: (text(form, "sex") || "UNKNOWN") as "M" | "F" | "OTHER" | "UNKNOWN" });
  revalidatePath("/patients");
}
