-- AlterTable
ALTER TABLE "encounter_investigation_advices" ADD COLUMN     "tenant_service_id" TEXT;

-- AlterTable
ALTER TABLE "prescription_investigations" ADD COLUMN     "tenant_service_id" TEXT;

-- CreateIndex
CREATE INDEX "encounter_investigation_advices_tenant_id_tenant_service_id_idx" ON "encounter_investigation_advices"("tenant_id", "tenant_service_id");

-- CreateIndex
CREATE INDEX "prescription_investigations_tenant_id_tenant_service_id_idx" ON "prescription_investigations"("tenant_id", "tenant_service_id");

-- AddForeignKey
ALTER TABLE "encounter_investigation_advices" ADD CONSTRAINT "encounter_investigation_advices_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_investigations" ADD CONSTRAINT "prescription_investigations_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
