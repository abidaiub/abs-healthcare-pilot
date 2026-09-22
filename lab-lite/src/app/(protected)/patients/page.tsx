import { requirePrincipal } from "../../../lib/session";
import { searchPatients } from "../../../services/records";
import { createPatientAction } from "../../actions";
export default async function PatientsPage() {
  const p = await requirePrincipal("patients", "read"); const patients = await searchPatients(p.tenantId, "");
  return <main><h1>Patient registration</h1><section className="card"><form className="stack" action={createPatientAction}><label>Patient number<input name="patientNumber" required /></label><label>Full name<input name="fullName" required /></label><label>Sex<select name="sex"><option value="UNKNOWN">Unknown</option><option value="M">Male</option><option value="F">Female</option><option value="OTHER">Other</option></select></label><label>Mobile<input name="mobile" /></label><button>Register patient</button></form></section><section className="card"><table><thead><tr><th>Number</th><th>Name</th><th>Mobile</th></tr></thead><tbody>{patients.map(x=><tr key={x.id}><td>{x.patient_number}</td><td>{x.full_name}</td><td>{x.mobile}</td></tr>)}</tbody></table></section></main>;
}
