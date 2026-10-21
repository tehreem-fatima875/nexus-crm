"use client";

import { useState, type FormEvent } from "react";

type LoginFormProps = {
  initialUsername: string;
};

export function LoginForm({ initialUsername }: LoginFormProps) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = new FormData(event.currentTarget);
    const username = credentials.get("username");
    const password = credentials.get("password");
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      setError("Enter a username and password.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? "Unable to sign in.");
      }

      const requestedPath = new URL(window.location.href).searchParams.get("next") ?? "/dashboard";
      const destination = new URL(requestedPath, window.location.origin);
      const nextPath = destination.origin === window.location.origin
        ? `${destination.pathname}${destination.search}${destination.hash}`
        : "/dashboard";
      window.location.replace(nextPath);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return <form className="login-form" onSubmit={(event) => void submit(event)}>
    <label className="form-field"><span className="field-label">Username</span><input className="input-control" name="username" autoComplete="username" defaultValue={initialUsername} required /></label>
    <label className="form-field"><span className="field-label">Password</span><input className="input-control" name="password" type="password" autoComplete="current-password" required /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
    <p className="field-hint">This is basic demo authentication, not production-grade account security.</p>
  </form>;
}
