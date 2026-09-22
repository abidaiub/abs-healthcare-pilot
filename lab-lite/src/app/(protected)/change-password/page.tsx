import { requirePrincipal } from "../../../lib/session";
import { changePasswordAction } from "../../actions";
export default async function ChangePasswordPage() {
  const p = await requirePrincipal(undefined, undefined, true);
  return <main><section className="card"><h1>Change password</h1>{p.forcePasswordChange && <p className="warning">A password change is required before using the application.</p>}<form className="stack" action={changePasswordAction}><label>Current password<input name="currentPassword" type="password" required autoComplete="current-password"/></label><label>New password<input name="newPassword" type="password" minLength={12} required autoComplete="new-password"/></label><p className="muted">Use at least 12 characters with lower/upper case, a number, and a special character.</p><button>Change password and sign out</button></form></section></main>;
}
