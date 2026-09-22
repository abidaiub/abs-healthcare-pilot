import { requirePrincipal } from "../../../lib/session";
import { BillingWorkbench } from "../../../components/billing/BillingWorkbench";
export default async function BillingPage(){await requirePrincipal("billing","read");return <BillingWorkbench/>;}
