"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";
  const nextPath = searchParams.get("next") || "/";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        if (isLogin) {
          await login({
            identifier: String(formData.get("identifier") || ""),
            password: String(formData.get("password") || "")
          });
        } else {
          await register({
            name: String(formData.get("name") || ""),
            email: String(formData.get("email") || ""),
            phone: String(formData.get("phone") || ""),
            password: String(formData.get("password") || "")
          });
        }

        router.push(nextPath);
        router.refresh();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Authentication failed."
        );
      }
    });
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <p className="eyebrow">{isLogin ? "Secure Access" : "Create Account"}</p>
        <h1 className="page-title auth-title">
          {isLogin ? "Login before entering the library workspace." : "Register a new library account."}
        </h1>
        <p className="page-description">
          {isLogin
            ? "Use username, email, or membership number. Any account with 'Librarian' in the name or email will enter the librarian workspace."
            : "Register to access the application. Librarian accounts are created automatically when the name or email contains 'Librarian'."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isLogin ? (
            <label className="auth-field">
              <span>Username or Email</span>
              <input name="identifier" type="text" placeholder="librarian or you@example.com" required />
            </label>
          ) : (
            <>
              <label className="auth-field">
                <span>Full Name</span>
                <input name="name" type="text" placeholder="Sonia Patel" required />
              </label>
              <label className="auth-field">
                <span>Email</span>
                <input name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label className="auth-field">
                <span>Phone</span>
                <input name="phone" type="tel" placeholder="0812345678" required />
              </label>
            </>
          )}

          <label className="auth-field">
            <span>Password</span>
            <input name="password" type="password" placeholder="At least 8 characters" minLength={8} required />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="button button-primary auth-submit" disabled={isPending}>
            {isPending ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="auth-switch">
          <span>{isLogin ? "No account yet?" : "Already registered?"}</span>
          <Link href={isLogin ? "/register" : "/login"} className="auth-switch-link">
            {isLogin ? "Create account" : "Go to login"}
          </Link>
        </div>
      </div>
    </section>
  );
}
