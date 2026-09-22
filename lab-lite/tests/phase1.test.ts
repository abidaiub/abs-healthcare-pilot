import assert from "node:assert/strict";
import test from "node:test";
import { pool, query, verifyDatabaseIdentity } from "../src/lib/db";
import { provisionTenant, createUser, authenticate, changeOwnPassword, resolveSession, revokeSession } from "../src/services/identity";
import { installCatalogTier, installTemplate, upsertGlobalTemplate } from "../src/services/catalog";
import { createDoctor, createPatient, createReferralPartner, searchPatients } from "../src/services/records";
import { calculateQuote } from "../src/domain/billing/quote";
import { PATCH as patchSettings } from "../src/app/api/tenant/settings/route";
import { POST as installCatalogApi } from "../src/app/api/catalog/install/route";

test("Phase 1 isolated foundation", async (t) => {
  await verifyDatabaseIdentity();
  const identity = await query<{ name: string }>("select current_database() name");
  assert.equal(identity.rows[0].name, "abs_lab_lite_test");
  await query("truncate table tenants,catalog_templates cascade");

  await upsertGlobalTemplate({
    code: "TEST-NUMERIC", name: "Synthetic Test Numeric", groupCode: "SYNTH", specimenCode: "SYNTH",
    version: 1, provenance: "AUTOMATED_TEST", reviewStatus: "UNREVIEWED",
    fields: [{ code: "VALUE", name: "Synthetic Value", resultType: "NUMERIC", unitCode: "SYNTH-U", order: 1 }],
  });

  const alpha = await provisionTenant({ tenantCode: "ALPHA", tenantName: "Alpha Test Lab", branchCode: "MAIN", branchName: "Alpha Main", username: "admin", displayName: "Alpha Admin", password: "Alpha!Secure123" });
  const beta = await provisionTenant({ tenantCode: "BETA", tenantName: "Beta Test Lab", branchCode: "MAIN", branchName: "Beta Main", username: "admin", displayName: "Beta Admin", password: "Beta!Secure1234" });
  assert.notEqual(alpha.tenantId, beta.tenantId);

  const counter = await createUser({ tenantId: alpha.tenantId, username: "counter", displayName: "Counter User", password: "Counter!Secure123", roleCode: "COUNTER", branchId: alpha.branchId });
  const adminLogin = await authenticate({ tenantCode: "ALPHA", branchCode: "MAIN", username: "admin", password: "Alpha!Secure123" });
  const initialCounterLogin = await authenticate({ tenantCode: "ALPHA", branchCode: "MAIN", username: "counter", password: "Counter!Secure123" });
  assert.ok(adminLogin && initialCounterLogin);
  assert.equal((await resolveSession(initialCounterLogin.token))?.forcePasswordChange, true);
  await changeOwnPassword(alpha.tenantId, counter.id, "Counter!Secure123", "Counter!Changed456");
  assert.equal(await resolveSession(initialCounterLogin.token), null);
  const counterLogin = await authenticate({ tenantCode: "ALPHA", branchCode: "MAIN", username: "counter", password: "Counter!Changed456" });
  assert.ok(counterLogin);

  await t.test("direct API denies missing and insufficient permission", async () => {
    const body = JSON.stringify({ name: "No" });
    const unauthenticated = await patchSettings(new Request("http://test/api/tenant/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body }));
    assert.equal(unauthenticated.status, 401);
    const forbidden = await patchSettings(new Request("http://test/api/tenant/settings", { method: "PATCH", headers: { authorization: `Bearer ${counterLogin.token}`, "content-type": "application/json" }, body }));
    assert.equal(forbidden.status, 403);
    const catalogForbidden = await installCatalogApi(new Request("http://test/api/catalog/install", { method: "POST", headers: { authorization: `Bearer ${counterLogin.token}`, "content-type": "application/json" }, body: JSON.stringify({ templateCode: "TEST-NUMERIC" }) }));
    assert.equal(catalogForbidden.status, 403);
    const allowed = await patchSettings(new Request("http://test/api/tenant/settings", { method: "PATCH", headers: { authorization: `Bearer ${adminLogin.token}`, "content-type": "application/json" }, body: JSON.stringify({ name: "Alpha Renamed" }) }));
    assert.equal(allowed.status, 200);
  });

  await t.test("database rejects cross-tenant branch assignment", async () => {
    await assert.rejects(
      query(`insert into user_branches(tenant_id,user_id,branch_id) values($1,$2,$3)`, [alpha.tenantId, counter.id, beta.branchId]),
      (error: unknown) => typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23503",
    );
  });

  await t.test("catalog install is repeatable and preserves customizations", async () => {
    await installTemplate(alpha.tenantId, "TEST-NUMERIC", "125.00");
    await installTemplate(alpha.tenantId, "TEST-NUMERIC", "999.00");
    const installed = await query<{ id: string; name: string; price: string }>(`select id,name,price::text from tenant_tests where tenant_id=$1 and code='TEST-NUMERIC'`, [alpha.tenantId]);
    assert.equal(installed.rowCount, 1);
    assert.equal(installed.rows[0].price, "125.00");
    await query(`update tenant_tests set name='Alpha Custom Test',name_customized=true,price=150 where id=$1`, [installed.rows[0].id]);
    await query(`update tenant_result_fields set name='Alpha Custom Field',is_customized=true where tenant_id=$1 and tenant_test_id=$2`, [alpha.tenantId, installed.rows[0].id]);
    await upsertGlobalTemplate({
      code: "TEST-NUMERIC", name: "Synthetic Test Numeric V2", groupCode: "SYNTH", specimenCode: "SYNTH",
      version: 2, provenance: "AUTOMATED_TEST_V2", reviewStatus: "TECHNICALLY_REVIEWED",
      fields: [{ code: "VALUE", name: "Synthetic Value V2", resultType: "NUMERIC", unitCode: "SYNTH-U", order: 2 }],
    });
    await installTemplate(alpha.tenantId, "TEST-NUMERIC", "0");
    const preserved = await query<{ name: string; price: string; installed_template_version: number }>(`select name,price::text,installed_template_version from tenant_tests where id=$1`, [installed.rows[0].id]);
    const field = await query<{ name: string }>(`select name from tenant_result_fields where tenant_id=$1 and tenant_test_id=$2`, [alpha.tenantId, installed.rows[0].id]);
    assert.deepEqual(preserved.rows[0], { name: "Alpha Custom Test", price: "150.00", installed_template_version: 2 });
    assert.equal(field.rows[0].name, "Alpha Custom Field");
  });

  await t.test("cumulative master tiers install drafts disabled and preserve tenant activation", async () => {
    for (const template of [
      { code: "TIER-START", name: "Synthetic Starter", minTier: "STARTER" as const, tierLevel: 1 },
      { code: "TIER-MEDIUM", name: "Synthetic Medium", minTier: "MEDIUM" as const, tierLevel: 2 },
      { code: "TIER-ADVANCED", name: "Synthetic Advanced", minTier: "ADVANCED" as const, tierLevel: 3 },
    ]) await upsertGlobalTemplate({ ...template, groupCode: "SYNTH", version: 1, provenance: "AUTOMATED_TEST", reviewStatus: "UNREVIEWED", tenantDefaultActive: false, fields: [{ code: "VALUE", name: "Value", resultType: "TEXT" }] });
    const first = await installCatalogTier(beta.tenantId, "MEDIUM");
    assert.equal(first.installedCount, 2);
    const installed = await query<{ code:string;is_active:boolean;price:string|null }>(`select code,is_active,price::text from tenant_tests where tenant_id=$1 and code like 'TIER-%' order by code`, [beta.tenantId]);
    assert.deepEqual(installed.rows, [{ code: "TIER-MEDIUM", is_active: false, price: null }, { code: "TIER-START", is_active: false, price: null }]);
    await query(`update tenant_tests set is_active=true,price=77 where tenant_id=$1 and code='TIER-START'`, [beta.tenantId]);
    await installCatalogTier(beta.tenantId, "MEDIUM");
    const preserved = await query<{ is_active:boolean;price:string }>(`select is_active,price::text from tenant_tests where tenant_id=$1 and code='TIER-START'`, [beta.tenantId]);
    assert.deepEqual(preserved.rows[0], { is_active: true, price: "77.00" });
  });

  await t.test("directories and patients stay in tenant scope", async () => {
    await createDoctor({ tenantId: alpha.tenantId, branchId: alpha.branchId, code: "D1", name: "Synthetic Doctor" });
    await createReferralPartner({ tenantId: alpha.tenantId, branchId: alpha.branchId, code: "R1", name: "Synthetic Partner", type: "AGENT" });
    await createPatient({ tenantId: alpha.tenantId, branchId: alpha.branchId, patientNumber: "P1", fullName: "Synthetic Patient", mobile: "+880 1700-000000" });
    assert.equal((await searchPatients(alpha.tenantId, "Synthetic Patient")).length, 1);
    assert.equal((await searchPatients(beta.tenantId, "Synthetic Patient")).length, 0);
  });

  await t.test("billing is calculation and snapshot only", () => {
    const quote = calculateQuote({ operationId: "device_operation", tenantId: alpha.tenantId, branchId: alpha.branchId, currencyCode: "BDT", discountType: "PERCENTAGE", discountValue: "10", lines: [{ testId: "t1", testCode: "T1", testName: "Synthetic", unitPrice: "100.00" }] });
    assert.equal(quote.gross, "100.00"); assert.equal(quote.discount, "10.00"); assert.equal(quote.net, "90.00");
    assert.equal(Object.hasOwn(quote, "paymentId"), false);
  });

  await revokeSession(counterLogin.token);
  assert.equal(await resolveSession(counterLogin.token), null);
  await pool.end();
});
