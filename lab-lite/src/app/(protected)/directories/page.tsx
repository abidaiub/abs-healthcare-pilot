import { requirePrincipal } from "../../../lib/session";
import { listDirectories } from "../../../services/records";
import { createDoctorAction, createPartnerAction } from "../../actions";
export default async function DirectoriesPage() {
  const p = await requirePrincipal("directories", "read"); const data = await listDirectories(p.tenantId);
  return <main><h1>Doctors and referrals</h1><div className="grid"><section className="card"><h2>Add doctor</h2><form className="stack" action={createDoctorAction}><label>Code<input name="code" required /></label><label>Name<input name="name" required /></label><label>Phone<input name="phone" /></label><button>Add doctor</button></form><ul>{data.doctors.map((d)=><li key={String(d.id)}>{String(d.code)} — {String(d.name)}</li>)}</ul></section>
  <section className="card"><h2>Add referral partner</h2><form className="stack" action={createPartnerAction}><label>Code<input name="code" required /></label><label>Name<input name="name" required /></label><label>Type<select name="type"><option>BROKER</option><option>AGENT</option><option>COLLECTION_POINT</option><option>CORPORATE</option><option>POLLI_DOCTOR</option></select></label><button>Add partner</button></form><ul>{data.partners.map((d)=><li key={String(d.id)}>{String(d.code)} — {String(d.name)} ({String(d.type)})</li>)}</ul></section></div></main>;
}
