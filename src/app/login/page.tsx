import { Suspense } from "react";
import { connection } from "next/server";
import { getDemoUsername } from "@/lib/auth";
import { LoginForm } from "./login-form";

async function ConfiguredLoginForm() {
  await connection();
  return <LoginForm initialUsername={getDemoUsername()} />;
}

export default function LoginPage() {
  return <main className="login-page">
    <section className="panel login-card">
      <div className="login-brand"><span className="brand-mark">n</span><span><strong>nexus</strong><small>AGENCY CRM</small></span></div>
      <p className="eyebrow">Demo workspace</p>
      <h1>Sign in</h1>
      <p className="page-description">Use the demo account configured for this server.</p>
      <Suspense fallback={<LoginForm initialUsername="" />}>
        <ConfiguredLoginForm />
      </Suspense>
    </section>
  </main>;
}
