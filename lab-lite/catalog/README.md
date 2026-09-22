# ABS Lab Lite master catalog

The versioned JSON under this directory is the release source for global catalog master data. It is loaded into `catalog_releases`, `catalog_templates`, and `catalog_template_fields` by `npm run seed:master`.

Tenant databases do not read the ZIP or workbook at runtime. A tenant installs a Starter, Medium, or Advanced projection from the global master tables. Installed tests, fields, prices, and later local customizations remain tenant-owned.

`ABS-DX-DRAFT-1.0` is structurally validated but not clinically approved. Its templates are available for controlled installation with `UNREVIEWED` status and are disabled in the tenant by default. Local authorization must validate the offered test, specimen/container, method, units, result fields, reference ranges, price, and discount policy before activation.

The checked-in manifest pins the canonical JSON and repeat-group SHA-256 hashes. Do not edit the generated JSON in place. Publish a new versioned release and retain stable `test_code` and `field_code` keys.
