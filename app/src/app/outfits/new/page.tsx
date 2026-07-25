"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GOAL_TYPES = [
  { id: "trip", label: "Trip" },
  { id: "event", label: "Event" },
  { id: "job-interview", label: "Job interview" },
  { id: "new-season", label: "New season" },
  { id: "life-change", label: "Life change" },
  { id: "just-exploring", label: "Just exploring" },
];

export default function NewOutfitPage() {
  const router = useRouter();
  const [goalType, setGoalType] = useState("");
  const [description, setDescription] = useState("");
  const [frustration, setFrustration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!goalType) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalType, description: description || undefined, frustration: frustration || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "empty_wardrobe" ? "Add some items to your wardrobe first." : "Something went wrong. Try again.");
        return;
      }
      router.push(`/outfits/${data.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-1">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-frock-muted mb-1 self-start"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          What are you dressing for?
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          I'll check your wardrobe and tell you exactly what's missing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {GOAL_TYPES.map((g) => {
          const active = goalType === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setGoalType(g.id)}
              className="rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.98]"
              style={{
                background: active ? "#D6402B" : "#FFFFFF",
                color: active ? "#FFFFFF" : "#201B15",
                border: `1.5px solid ${active ? "#D6402B" : "rgba(32,27,21,0.12)"}`,
              }}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs tracking-widest text-frock-muted uppercase" style={{ letterSpacing: "0.12em" }}>
          Tell me more (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Edinburgh for 4 days, lots of walking, one nice dinner"
          rows={3}
          className="rounded-xl px-3 py-2.5 text-sm text-frock-ink outline-none transition-colors bg-white resize-none"
          style={{ border: `1px solid ${description ? "#D6402B" : "rgba(32,27,21,0.12)"}` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs tracking-widest text-frock-muted uppercase" style={{ letterSpacing: "0.12em" }}>
          Biggest wardrobe frustration (optional)
        </label>
        <textarea
          value={frustration}
          onChange={(e) => setFrustration(e.target.value)}
          placeholder="e.g. I always end up buying things I never wear"
          rows={2}
          className="rounded-xl px-3 py-2.5 text-sm text-frock-ink outline-none transition-colors bg-white resize-none"
          style={{ border: `1px solid ${frustration ? "#D6402B" : "rgba(32,27,21,0.12)"}` }}
        />
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: "#D6402B" }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!goalType || loading}
        className="w-full rounded-full py-4 font-medium text-base text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
        style={{ background: "#D6402B" }}
      >
        {loading ? "Checking your wardrobe…" : "Analyse my wardrobe →"}
      </button>
    </div>
  );
}
