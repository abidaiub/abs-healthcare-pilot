import { SampleCollectionPanel } from "@/components/diagnostic/SampleCollectionPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function SampleCollectionPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="sampleCollection"
        description="Phlebotomist queue for pending sample collection, rejection, and recollection."
      />
      <SampleCollectionPanel />
    </div>
  );
}
