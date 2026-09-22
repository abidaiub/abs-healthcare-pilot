import assert from "node:assert/strict";
import test from "node:test";
import { loadMasterCatalog } from "../scripts/catalog-master";

test("versioned master catalog is structurally safe to seed", async () => {
  const catalog = await loadMasterCatalog();
  assert.equal(catalog.release.releaseCode, "ABS-DX-DRAFT-1.0");
  assert.equal(catalog.templates.length, 725);
  assert.equal(catalog.templates.filter((template) => template.tierLevel === 1).length, 312);
  assert.equal(catalog.templates.filter((template) => template.tierLevel === 2).length, 132);
  assert.equal(catalog.templates.filter((template) => template.tierLevel === 3).length, 281);
  assert.equal(catalog.templates.reduce((count, template) => count + template.fields.length, 0), 3571);
  assert.ok(catalog.templates.every((template) => template.reviewStatus === "UNREVIEWED"));
  assert.ok(catalog.templates.every((template) => template.tenantDefaultActive === false));
  assert.ok(catalog.templates.flatMap((template) => template.fields).every((field) => field.required === false));
  const cbc = catalog.templates.find((template) => template.code === "ABS-DX-0001");
  assert.equal(cbc?.name, "Complete blood count with differential");
  assert.equal(cbc?.fields[0]?.resultType, "NUMERIC");
  const choice = catalog.templates.flatMap((template) => template.fields).find((field) => field.resultType === "OPTION_LIST");
  assert.ok(choice?.options && choice.options.length > 1);
  assert.equal(catalog.repeatGroups.length, 7);
});
