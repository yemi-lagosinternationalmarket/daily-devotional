"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2 tracking-[-0.3px]">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mb-8">
          Sign in to your devotional
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
              text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]
              outline-none focus:border-[var(--surface-hover-border)]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
              text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]
              outline-none focus:border-[var(--surface-hover-border)]"
          />

          {error && (
            <p className="text-sm text-[rgba(255,100,100,0.8)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
              hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
              transition-all duration-150 cursor-pointer text-[15px] font-medium text-[var(--text-primary)]
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-[var(--text-ghost)] mt-6 text-center">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
