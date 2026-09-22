import { loginAction } from "../actions";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  return <main className="login"><section className="card"><h1>ABS Lab Lite</h1><p className="muted">Sign in to an isolated tenant and branch.</p>
    {error && <p role="alert">The supplied credentials were not accepted.</p>}
    <form className="stack" action={loginAction}>
      <label>Tenant code<input name="tenantCode" required autoComplete="organization" /></label>
      <label>Branch code<input name="branchCode" required /></label>
      <label>Username<input name="username" required autoComplete="username" /></label>
      <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
      <button>Sign in</button>
    </form>
  </section></main>;
}
