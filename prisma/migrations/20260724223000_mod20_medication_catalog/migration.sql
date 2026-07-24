-- MOD-20 Pharmacy & Medication Catalog (Scope A — catalog foundation)

CREATE TYPE "MedicationCatalogStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

CREATE TABLE "tenant_medication_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tenant_medication_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "medication_manufacturers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "registration_number" TEXT,
    "country" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    CONSTRAINT "medication_manufacturers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_dosage_forms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "short_name" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "medication_dosage_forms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_routes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "medication_routes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "medication_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "medication_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_generics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "generic_code" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "category_id" TEXT,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "is_high_alert" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    CONSTRAINT "medication_generics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_catalog_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "internal_code" TEXT NOT NULL,
    "generic_id" TEXT,
    "manufacturer_id" TEXT,
    "category_id" TEXT,
    "dosage_form_id" TEXT,
    "route_id" TEXT,
    "unit_id" TEXT,
    "brand_name" TEXT NOT NULL,
    "generic_display_name" TEXT,
    "strength_value" DECIMAL(12,4),
    "strength_unit" TEXT,
    "denominator_value" DECIMAL(12,4),
    "denominator_unit" TEXT,
    "display_strength" TEXT,
    "route_code" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "pack_size" TEXT,
    "pack_description" TEXT,
    "default_dose" TEXT,
    "default_frequency" TEXT,
    "default_duration" TEXT,
    "default_instructions" TEXT,
    "is_prescription_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_dispensing_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_controlled_medicine" BOOLEAN NOT NULL DEFAULT false,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT true,
    "status" "MedicationCatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    CONSTRAINT "medication_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_ingredients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "medication_catalog_item_id" TEXT NOT NULL,
    "generic_id" TEXT NOT NULL,
    "strength_value" DECIMAL(12,4),
    "strength_unit" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medication_ingredients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "medication_aliases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "medication_catalog_item_id" TEXT,
    "generic_id" TEXT,
    "alias_text" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "medication_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "branch_medications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "medication_catalog_item_id" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_dispensing_enabled" BOOLEAN NOT NULL DEFAULT false,
    "local_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "branch_medications_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "prescription_medicines" ADD COLUMN "medication_catalog_item_id" TEXT;

CREATE UNIQUE INDEX "medication_generics_tenant_id_generic_code_key" ON "medication_generics"("tenant_id", "generic_code");
CREATE UNIQUE INDEX "medication_manufacturers_tenant_id_name_key" ON "medication_manufacturers"("tenant_id", "name");
CREATE UNIQUE INDEX "medication_dosage_forms_tenant_id_code_key" ON "medication_dosage_forms"("tenant_id", "code");
CREATE UNIQUE INDEX "medication_routes_tenant_id_code_key" ON "medication_routes"("tenant_id", "code");
CREATE UNIQUE INDEX "medication_categories_tenant_id_code_key" ON "medication_categories"("tenant_id", "code");
CREATE UNIQUE INDEX "medication_units_tenant_id_code_key" ON "medication_units"("tenant_id", "code");
CREATE UNIQUE INDEX "medication_catalog_items_tenant_id_internal_code_key" ON "medication_catalog_items"("tenant_id", "internal_code");
CREATE UNIQUE INDEX "medication_ingredients_medication_catalog_item_id_generic_id_key" ON "medication_ingredients"("medication_catalog_item_id", "generic_id");
CREATE UNIQUE INDEX "medication_aliases_tenant_id_normalized_alias_key" ON "medication_aliases"("tenant_id", "normalized_alias");
CREATE UNIQUE INDEX "branch_medications_tenant_id_branch_id_medication_catalog_item_id_key" ON "branch_medications"("tenant_id", "branch_id", "medication_catalog_item_id");
CREATE UNIQUE INDEX "medication_catalog_items_tenant_barcode_uidx" ON "medication_catalog_items"("tenant_id", "barcode") WHERE "barcode" IS NOT NULL AND "barcode" <> '';

CREATE INDEX "medication_generics_tenant_id_idx" ON "medication_generics"("tenant_id");
CREATE INDEX "medication_generics_tenant_id_is_active_idx" ON "medication_generics"("tenant_id", "is_active");
CREATE INDEX "medication_generics_tenant_id_generic_name_idx" ON "medication_generics"("tenant_id", "generic_name");
CREATE INDEX "medication_manufacturers_tenant_id_idx" ON "medication_manufacturers"("tenant_id");
CREATE INDEX "medication_manufacturers_tenant_id_is_active_idx" ON "medication_manufacturers"("tenant_id", "is_active");
CREATE INDEX "medication_dosage_forms_tenant_id_idx" ON "medication_dosage_forms"("tenant_id");
CREATE INDEX "medication_routes_tenant_id_idx" ON "medication_routes"("tenant_id");
CREATE INDEX "medication_categories_tenant_id_idx" ON "medication_categories"("tenant_id");
CREATE INDEX "medication_units_tenant_id_idx" ON "medication_units"("tenant_id");
CREATE INDEX "medication_catalog_items_tenant_id_idx" ON "medication_catalog_items"("tenant_id");
CREATE INDEX "medication_catalog_items_tenant_id_status_idx" ON "medication_catalog_items"("tenant_id", "status");
CREATE INDEX "medication_catalog_items_tenant_id_is_active_idx" ON "medication_catalog_items"("tenant_id", "is_active");
CREATE INDEX "medication_catalog_items_tenant_id_brand_name_idx" ON "medication_catalog_items"("tenant_id", "brand_name");
CREATE INDEX "medication_catalog_items_tenant_id_generic_display_name_idx" ON "medication_catalog_items"("tenant_id", "generic_display_name");
CREATE INDEX "medication_catalog_items_tenant_id_barcode_idx" ON "medication_catalog_items"("tenant_id", "barcode");
CREATE INDEX "medication_ingredients_tenant_id_idx" ON "medication_ingredients"("tenant_id");
CREATE INDEX "medication_ingredients_tenant_id_medication_catalog_item_id_idx" ON "medication_ingredients"("tenant_id", "medication_catalog_item_id");
CREATE INDEX "medication_aliases_tenant_id_idx" ON "medication_aliases"("tenant_id");
CREATE INDEX "medication_aliases_tenant_id_medication_catalog_item_id_idx" ON "medication_aliases"("tenant_id", "medication_catalog_item_id");
CREATE INDEX "medication_aliases_tenant_id_generic_id_idx" ON "medication_aliases"("tenant_id", "generic_id");
CREATE INDEX "branch_medications_tenant_id_idx" ON "branch_medications"("tenant_id");
CREATE INDEX "branch_medications_tenant_id_branch_id_idx" ON "branch_medications"("tenant_id", "branch_id");
CREATE INDEX "branch_medications_tenant_id_medication_catalog_item_id_idx" ON "branch_medications"("tenant_id", "medication_catalog_item_id");
CREATE INDEX "prescription_medicines_tenant_id_medication_catalog_item_id_idx" ON "prescription_medicines"("tenant_id", "medication_catalog_item_id");

ALTER TABLE "tenant_medication_counters" ADD CONSTRAINT "tenant_medication_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_generics" ADD CONSTRAINT "medication_generics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_generics" ADD CONSTRAINT "medication_generics_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "medication_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_manufacturers" ADD CONSTRAINT "medication_manufacturers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_dosage_forms" ADD CONSTRAINT "medication_dosage_forms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_routes" ADD CONSTRAINT "medication_routes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_categories" ADD CONSTRAINT "medication_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_units" ADD CONSTRAINT "medication_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_catalog_items" ADD CONSTRAINT "medication_catalog_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_catalog_items" ADD CONSTRAINT "medication_catalog_items_generic_id_fkey" FOREIGN KEY ("generic_id") REFERENCES "medication_generics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_catalog_items" ADD CONSTRAINT "medication_catalog_items_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "medication_manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_catalog_items" ADD CONSTRAINT "medication_catalog_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "medication_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_catalog_items" ADD CONSTRAINT "medication_catalog_items_dosage_form_id_fkey" FOREIGN KEY ("dosage_form_id") REFERENCES "medication_dosage_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_catalog_items" ADD CONSTRAINT "medication_catalog_items_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "medication_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_catalog_items" ADD CONSTRAINT "medication_catalog_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "medication_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "medication_ingredients" ADD CONSTRAINT "medication_ingredients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_ingredients" ADD CONSTRAINT "medication_ingredients_medication_catalog_item_id_fkey" FOREIGN KEY ("medication_catalog_item_id") REFERENCES "medication_catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_ingredients" ADD CONSTRAINT "medication_ingredients_generic_id_fkey" FOREIGN KEY ("generic_id") REFERENCES "medication_generics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "medication_aliases" ADD CONSTRAINT "medication_aliases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_aliases" ADD CONSTRAINT "medication_aliases_medication_catalog_item_id_fkey" FOREIGN KEY ("medication_catalog_item_id") REFERENCES "medication_catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medication_aliases" ADD CONSTRAINT "medication_aliases_generic_id_fkey" FOREIGN KEY ("generic_id") REFERENCES "medication_generics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_medications" ADD CONSTRAINT "branch_medications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_medications" ADD CONSTRAINT "branch_medications_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "branch_medications" ADD CONSTRAINT "branch_medications_medication_catalog_item_id_fkey" FOREIGN KEY ("medication_catalog_item_id") REFERENCES "medication_catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_medicines" ADD CONSTRAINT "prescription_medicines_medication_catalog_item_id_fkey" FOREIGN KEY ("medication_catalog_item_id") REFERENCES "medication_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
