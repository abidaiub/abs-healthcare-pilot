import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CatalogReleaseSeed, CatalogTier, TemplateSeed } from "../src/services/catalog";

type Manifest = {
  releaseCode: string;
  canonicalFile: string;
  canonicalSha256: string;
  repeatGroupsFile: string;
  repeatGroupsSha256: string;
  sourceCreatedOn: string;
  sourceStatus: string;
  clinicalValidationStatus: string;
  counts: { starter: number; medium: number; advanced: number; fields: number };
};

type SourceTest = {
  test_code: string; test_name: string; group: string; min_tier: "Starter" | "Medium" | "Advanced";
  tier_level: number; starter: boolean; medium: boolean; advanced: boolean; specimen: string;
  workflow: string; template_key: string; price_bdt: null; max_discount_percent: null;
  clinical_status: string; enabled: boolean; source_id: string; provenance: string; notes: string;
};

type SourceField = {
  test_code: string; field_code: string; sort_order: number; result_title: string;
  data_type: "NUMBER" | "TEXT" | "CHOICE"; suggested_unit: string; allowed_values: string;
  repeat_group: string; default_value: null; reference_low: null; reference_high: null;
  reference_text: null; reference_population: null; method_specific_reference: null;
  required_for_release: string; field_status: string; remarks: string;
};

type SourceCatalog = {
  version: string; created: string; status: string; legacy_data_used: boolean;
  counts: { Starter: number; Medium: number; Advanced: number };
  test_catalog: SourceTest[]; result_fields: SourceField[];
  references: Array<{ source_id: string }>;
};

type RepeatGroup = { repeat_group: string };

const tierMap: Record<SourceTest["min_tier"], CatalogTier> = {
  Starter: "STARTER", Medium: "MEDIUM", Advanced: "ADVANCED",
};
const resultTypeMap: Record<SourceField["data_type"], string> = {
  NUMBER: "NUMERIC", TEXT: "TEXT", CHOICE: "OPTION_LIST",
};

function sha256(value: Buffer) { return createHash("sha256").update(value).digest("hex"); }
function invariant(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`Master catalog validation failed: ${message}`); }
function unique(values: string[], label: string) { invariant(new Set(values).size === values.length, `${label} must be unique`); }

export async function loadMasterCatalog() {
  const releaseDir = path.resolve(process.cwd(), "catalog", "abs-dx-draft-1.0");
  const manifest = JSON.parse(await readFile(path.join(releaseDir, "manifest.json"), "utf8")) as Manifest;
  const catalogBytes = await readFile(path.join(releaseDir, manifest.canonicalFile));
  const repeatBytes = await readFile(path.join(releaseDir, manifest.repeatGroupsFile));
  invariant(sha256(catalogBytes) === manifest.canonicalSha256, "canonical JSON SHA-256 mismatch");
  invariant(sha256(repeatBytes) === manifest.repeatGroupsSha256, "repeat-group SHA-256 mismatch");

  const source = JSON.parse(catalogBytes.toString("utf8")) as SourceCatalog;
  const repeatGroups = JSON.parse(repeatBytes.toString("utf8")) as RepeatGroup[];
  invariant(source.version === manifest.releaseCode, "release code mismatch");
  invariant(source.created === manifest.sourceCreatedOn, "source date mismatch");
  invariant(source.status === manifest.sourceStatus, "source status mismatch");
  invariant(source.legacy_data_used === false, "legacy-derived data is not accepted");
  invariant(source.test_catalog.length === manifest.counts.advanced, "advanced test count mismatch");
  invariant(source.result_fields.length === manifest.counts.fields, "result-field count mismatch");
  invariant(source.counts.Starter === manifest.counts.starter && source.counts.Medium === manifest.counts.medium && source.counts.Advanced === manifest.counts.advanced, "declared tier counts mismatch");

  unique(source.test_catalog.map((test) => test.test_code), "test codes");
  unique(source.test_catalog.map((test) => test.test_name.toLocaleLowerCase("en")), "case-insensitive test names");
  unique(source.result_fields.map((field) => field.field_code), "field codes");
  const testsByCode = new Map(source.test_catalog.map((test) => [test.test_code, test]));
  const fieldsByTest = new Map<string, SourceField[]>();
  for (const field of source.result_fields) {
    invariant(testsByCode.has(field.test_code), `orphan field ${field.field_code}`);
    invariant(field.default_value === null && field.reference_low === null && field.reference_high === null && field.reference_text === null && field.reference_population === null && field.method_specific_reference === null, `clinical default/reference supplied for ${field.field_code}`);
    invariant(field.field_status === "REVIEW_REQUIRED" && field.required_for_release === "LAB_CONFIGURE", `unexpected field review state for ${field.field_code}`);
    invariant(Object.hasOwn(resultTypeMap, field.data_type), `unsupported data type ${field.data_type}`);
    if (field.data_type === "CHOICE") invariant(field.allowed_values.trim().length > 0, `choice field ${field.field_code} has no choices`);
    const rows = fieldsByTest.get(field.test_code) ?? [];
    rows.push(field); fieldsByTest.set(field.test_code, rows);
  }
  const sourceIds = new Set(source.references.map((reference) => reference.source_id));
  const repeatKeys = new Set(repeatGroups.map((group) => group.repeat_group));
  unique([...repeatKeys], "repeat-group keys");
  for (const test of source.test_catalog) {
    invariant(test.price_bdt === null && test.max_discount_percent === null, `price/discount supplied for ${test.test_code}`);
    invariant(test.enabled === false && test.clinical_status === "REVIEW_REQUIRED", `unsafe activation state for ${test.test_code}`);
    invariant(sourceIds.has(test.source_id), `unknown source ${test.source_id}`);
    invariant((fieldsByTest.get(test.test_code)?.length ?? 0) > 0, `test ${test.test_code} has no fields`);
  }
  for (const field of source.result_fields) if (field.repeat_group) invariant(repeatKeys.has(field.repeat_group), `unknown repeat group ${field.repeat_group}`);
  invariant(source.test_catalog.filter((test) => test.starter).length === manifest.counts.starter, "Starter membership mismatch");
  invariant(source.test_catalog.filter((test) => test.medium).length === manifest.counts.medium, "Medium membership mismatch");
  invariant(source.test_catalog.filter((test) => test.advanced).length === manifest.counts.advanced, "Advanced membership mismatch");

  const release: CatalogReleaseSeed = {
    releaseCode: manifest.releaseCode, sourceSha256: manifest.canonicalSha256,
    sourceCreatedOn: manifest.sourceCreatedOn, sourceStatus: manifest.sourceStatus,
    clinicalValidationStatus: manifest.clinicalValidationStatus, starterCount: manifest.counts.starter,
    mediumCount: manifest.counts.medium, advancedCount: manifest.counts.advanced, fieldCount: manifest.counts.fields,
  };
  const templates: TemplateSeed[] = source.test_catalog.map((test) => ({
    code: test.test_code, name: test.test_name, groupCode: test.group, specimenCode: test.specimen || undefined,
    version: 1, provenance: `${manifest.releaseCode}: ${test.provenance}`, reviewStatus: "UNREVIEWED",
    releaseCode: manifest.releaseCode, minTier: tierMap[test.min_tier], tierLevel: test.tier_level,
    workflow: test.workflow, templateKey: test.template_key, sourceId: test.source_id, notes: test.notes,
    active: true, tenantDefaultActive: false,
    fields: (fieldsByTest.get(test.test_code) ?? []).sort((a, b) => a.sort_order - b.sort_order).map((field) => ({
      code: field.field_code, name: field.result_title, resultType: resultTypeMap[field.data_type],
      unitCode: field.suggested_unit || undefined,
      options: field.allowed_values ? field.allowed_values.split("|").map((value) => value.trim()).filter(Boolean) : undefined,
      repeatGroup: field.repeat_group || undefined, order: field.sort_order, required: false, active: true,
    })),
  }));
  return { manifest, release, templates, repeatGroups };
}
