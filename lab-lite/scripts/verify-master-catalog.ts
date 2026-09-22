import dotenv from "dotenv";

async function main() {
  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local", quiet: true });
  const { query, pool } = await import("../src/lib/db");
  const releaseCode = "ABS-DX-DRAFT-1.0";
  const release = (await query<{ starter_count:number;medium_count:number;advanced_count:number;field_count:number;source_status:string;clinical_validation_status:string }>(
    `select starter_count,medium_count,advanced_count,field_count,source_status,clinical_validation_status from catalog_releases where release_code=$1`, [releaseCode],
  )).rows[0];
  if (!release) throw new Error(`Missing catalog release ${releaseCode}`);
  const actual = (await query<{ starter:string;medium:string;advanced:string;fields:string;unsafe_templates:string }>(
    `select
       count(distinct t.id) filter(where t.tier_level <= 1)::text starter,
       count(distinct t.id) filter(where t.tier_level <= 2)::text medium,
       count(distinct t.id) filter(where t.tier_level <= 3)::text advanced,
       count(f.id)::text fields,
       count(distinct t.id) filter(where t.review_status <> 'UNREVIEWED' or t.tenant_default_active)::text unsafe_templates
     from catalog_templates t
     left join catalog_template_fields f on f.template_id=t.id and f.is_active
     where t.release_code=$1 and t.is_active`, [releaseCode],
  )).rows[0];
  const expected = { starter: release.starter_count, medium: release.medium_count, advanced: release.advanced_count, fields: release.field_count };
  const observed = { starter: Number(actual.starter), medium: Number(actual.medium), advanced: Number(actual.advanced), fields: Number(actual.fields) };
  if (JSON.stringify(expected) !== JSON.stringify(observed)) throw new Error(`Catalog count mismatch: expected=${JSON.stringify(expected)} observed=${JSON.stringify(observed)}`);
  if (Number(actual.unsafe_templates) !== 0) throw new Error("Draft catalog contains a reviewed or tenant-active-by-default template");
  process.stdout.write(`${JSON.stringify({ releaseCode, sourceStatus: release.source_status, clinicalValidationStatus: release.clinical_validation_status, ...observed, tenantDefaultActive: false })}\n`);
  await pool.end();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
