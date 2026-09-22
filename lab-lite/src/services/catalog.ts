import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { transaction, query } from "../lib/db";

export type CatalogTier = "STARTER" | "MEDIUM" | "ADVANCED";

export type CatalogReleaseSeed = {
  releaseCode: string;
  sourceSha256: string;
  sourceCreatedOn: string;
  sourceStatus: string;
  clinicalValidationStatus: string;
  starterCount: number;
  mediumCount: number;
  advancedCount: number;
  fieldCount: number;
};

export type TemplateSeed = {
  code: string; name: string; groupCode: string; specimenCode?: string; version: number;
  provenance: string; reviewStatus: "UNREVIEWED" | "TECHNICALLY_REVIEWED" | "CLINICALLY_APPROVED" | "UNSUPPORTED";
  releaseCode?: string; minTier?: CatalogTier; tierLevel?: number; workflow?: string; templateKey?: string;
  sourceId?: string; notes?: string; active?: boolean; tenantDefaultActive?: boolean;
  fields: Array<{ code: string; name: string; resultType: string; unitCode?: string; methodCode?: string; options?: string[]; repeatGroup?: string; order?: number; required?: boolean; active?: boolean }>;
};

export async function upsertCatalogRelease(seed: CatalogReleaseSeed) {
  await query(
    `insert into catalog_releases(release_code,source_sha256,source_created_on,source_status,clinical_validation_status,starter_count,medium_count,advanced_count,field_count)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9)
     on conflict(release_code) do update set
       source_sha256=excluded.source_sha256,source_created_on=excluded.source_created_on,source_status=excluded.source_status,
       clinical_validation_status=excluded.clinical_validation_status,starter_count=excluded.starter_count,
       medium_count=excluded.medium_count,advanced_count=excluded.advanced_count,field_count=excluded.field_count,imported_at=now()`,
    [seed.releaseCode, seed.sourceSha256, seed.sourceCreatedOn, seed.sourceStatus, seed.clinicalValidationStatus,
      seed.starterCount, seed.mediumCount, seed.advancedCount, seed.fieldCount],
  );
}

export async function upsertGlobalTemplate(seed: TemplateSeed) {
  const contentHash = createHash("sha256").update(JSON.stringify(seed)).digest("hex");
  return transaction(async (client) => {
    const template = await client.query<{ id: string }>(
      `insert into catalog_templates(code,name,group_code,specimen_code,version,provenance,review_status,content_hash,release_code,min_tier,tier_level,workflow,template_key,source_id,notes,is_active,tenant_default_active)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       on conflict(code) do update set name=excluded.name,group_code=excluded.group_code,specimen_code=excluded.specimen_code,
       version=excluded.version,provenance=excluded.provenance,review_status=excluded.review_status,content_hash=excluded.content_hash,
       release_code=excluded.release_code,min_tier=excluded.min_tier,tier_level=excluded.tier_level,workflow=excluded.workflow,
       template_key=excluded.template_key,source_id=excluded.source_id,notes=excluded.notes,is_active=excluded.is_active,
       tenant_default_active=excluded.tenant_default_active,updated_at=now()
       returning id`,
      [seed.code, seed.name, seed.groupCode, seed.specimenCode ?? null, seed.version, seed.provenance, seed.reviewStatus, contentHash,
        seed.releaseCode ?? null, seed.minTier ?? null, seed.tierLevel ?? null, seed.workflow ?? null, seed.templateKey ?? null,
        seed.sourceId ?? null, seed.notes ?? null, seed.active ?? true, seed.tenantDefaultActive ?? true],
    );
    const templateId = template.rows[0].id;
    await client.query(`update catalog_template_fields set is_active=false where template_id=$1`, [templateId]);
    for (const field of seed.fields) {
      await client.query(
        `insert into catalog_template_fields(template_id,code,name,result_type,unit_code,method_code,option_values,repeat_group,display_order,is_required,provenance,review_status,is_active)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         on conflict(template_id,code) do update set name=excluded.name,result_type=excluded.result_type,unit_code=excluded.unit_code,
         method_code=excluded.method_code,option_values=excluded.option_values,repeat_group=excluded.repeat_group,
         display_order=excluded.display_order,is_required=excluded.is_required,provenance=excluded.provenance,
         review_status=excluded.review_status,is_active=excluded.is_active`,
        [templateId, field.code, field.name, field.resultType, field.unitCode ?? null, field.methodCode ?? null,
          field.options ? JSON.stringify(field.options) : null, field.repeatGroup ?? null, field.order ?? 0,
          field.required ?? true, seed.provenance, seed.reviewStatus, field.active ?? true],
      );
    }
    return templateId;
  });
}

async function installTemplateWithClient(client: PoolClient, tenantId: string, templateCode: string, initialPrice: string | null) {
    const templateResult = await client.query<{ id: string; code: string; name: string; group_code: string; specimen_code: string | null; version: number; provenance: string; review_status: string; tenant_default_active: boolean }>(
      `select id,code,name,group_code,specimen_code,version,provenance,review_status,tenant_default_active from catalog_templates where code=$1 and is_active`, [templateCode],
    );
    const template = templateResult.rows[0];
    if (!template) throw new Error("Catalog template not found");
    const group = await client.query<{ id: string }>(
      `insert into test_groups(tenant_id,code,name) values($1,$2,$2)
       on conflict(tenant_id,code) do update set is_active=true returning id`, [tenantId, template.group_code],
    );
    let specimenId: string | null = null;
    if (template.specimen_code) {
      const specimen = await client.query<{ id: string }>(
        `insert into specimens(tenant_id,code,name) values($1,$2,$2)
         on conflict(tenant_id,code) do update set is_active=true returning id`, [tenantId, template.specimen_code],
      );
      specimenId = specimen.rows[0].id;
    }
    const test = await client.query<{ id: string }>(
      `insert into tenant_tests(tenant_id,template_id,installed_template_version,code,name,group_id,specimen_id,price,provenance,review_status,is_active)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict(tenant_id,template_id) do update set
         installed_template_version=excluded.installed_template_version,
         name=case when tenant_tests.name_customized then tenant_tests.name else excluded.name end,
         group_id=case when tenant_tests.group_customized then tenant_tests.group_id else excluded.group_id end,
         specimen_id=case when tenant_tests.specimen_customized then tenant_tests.specimen_id else excluded.specimen_id end,
         provenance=excluded.provenance,review_status=excluded.review_status,updated_at=now()
       returning id`,
      [tenantId, template.id, template.version, template.code, template.name, group.rows[0].id, specimenId, initialPrice,
        template.provenance, template.review_status, template.tenant_default_active],
    );
    const fields = await client.query<{ id: string; code: string; name: string; result_type: string; unit_code: string | null; method_code: string | null; option_values: unknown; repeat_group: string | null; display_order: number; is_required: boolean; provenance: string; review_status: string }>(
      `select * from catalog_template_fields where template_id=$1 and is_active order by display_order,code`, [template.id],
    );
    for (const field of fields.rows) {
      let unitId: string | null = null;
      if (field.unit_code) {
        const unit = await client.query<{ id: string }>(
          `insert into units(tenant_id,code,symbol,name) values($1,$2,$2,$2)
           on conflict(tenant_id,code) do update set is_active=true returning id`, [tenantId, field.unit_code],
        );
        unitId = unit.rows[0].id;
      }
      await client.query(
        `insert into tenant_result_fields(tenant_id,tenant_test_id,template_field_id,code,name,result_type,unit_id,method_code,option_values,repeat_group,display_order,is_required,provenance,review_status)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict(tenant_id,tenant_test_id,code) do update set
           template_field_id=excluded.template_field_id,
           name=case when tenant_result_fields.is_customized then tenant_result_fields.name else excluded.name end,
           result_type=case when tenant_result_fields.is_customized then tenant_result_fields.result_type else excluded.result_type end,
           unit_id=case when tenant_result_fields.is_customized then tenant_result_fields.unit_id else excluded.unit_id end,
           method_code=case when tenant_result_fields.is_customized then tenant_result_fields.method_code else excluded.method_code end,
           option_values=case when tenant_result_fields.is_customized then tenant_result_fields.option_values else excluded.option_values end,
           repeat_group=case when tenant_result_fields.is_customized then tenant_result_fields.repeat_group else excluded.repeat_group end,
           display_order=case when tenant_result_fields.is_customized then tenant_result_fields.display_order else excluded.display_order end,
           is_required=case when tenant_result_fields.is_customized then tenant_result_fields.is_required else excluded.is_required end,
           provenance=excluded.provenance,review_status=excluded.review_status,is_active=true`,
        [tenantId, test.rows[0].id, field.id, field.code, field.name, field.result_type, unitId, field.method_code,
          field.option_values == null ? null : JSON.stringify(field.option_values), field.repeat_group, field.display_order,
          field.is_required, field.provenance, field.review_status],
      );
    }
    return test.rows[0];
}

export async function installTemplate(tenantId: string, templateCode: string, initialPrice: string | null = null) {
  return transaction((client) => installTemplateWithClient(client, tenantId, templateCode, initialPrice));
}

export async function installCatalogTier(tenantId: string, tier: CatalogTier, initialPrice: string | null = null) {
  const tierLevel = { STARTER: 1, MEDIUM: 2, ADVANCED: 3 }[tier];
  if (!tierLevel) throw new Error("Unsupported catalog tier");
  return transaction(async (client) => {
    const templates = await client.query<{ code: string }>(
      `select code from catalog_templates where is_active and tier_level <= $1 order by code`, [tierLevel],
    );
    for (const template of templates.rows) await installTemplateWithClient(client, tenantId, template.code, initialPrice);
    return { tier, installedCount: templates.rowCount };
  });
}

export async function listTenantTests(tenantId: string) {
  return (await query<{ id: string; code: string; name: string; price: string | null; review_status: string; is_active: boolean }>(
    `select id,code,name,price::text,review_status,is_active from tenant_tests where tenant_id=$1 order by code`, [tenantId],
  )).rows;
}
