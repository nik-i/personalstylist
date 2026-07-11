"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("email", { email, redirect: false });
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <h1 className="font-serif text-3xl text-frock-ink text-center">FROCK</h1>

        {sent ? (
          <div className="text-center flex flex-col gap-3">
            <p className="text-frock-ink font-medium">Check your email</p>
            <p className="text-frock-muted text-sm">
              We sent a sign-in link to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-frock-blush px-4 py-3 text-frock-ink placeholder:text-frock-muted outline-none focus:border-frock-red"
            />
            <button
              type="submit"
              className="rounded-full bg-frock-red py-4 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Continue with email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
