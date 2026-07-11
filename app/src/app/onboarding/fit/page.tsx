"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const SIZE_FIELDS = [
  { key: "tops" as const, label: "TOPS", ph: "e.g. 12 or M" },
  { key: "bottoms" as const, label: "BOTTOMS", ph: "e.g. 12" },
  { key: "dresses" as const, label: "DRESSES", ph: "e.g. 12" },
  { key: "shoes" as const, label: "SHOES", ph: "e.g. UK 6" },
];

const SHAPES = [
  { id: "pear", label: "Pear", path: "M10 4h4l3 16H7L10 4Z" },
  { id: "hourglass", label: "Hourglass", path: "M7 4h10l-4 8 4 8H7l4-8-4-8Z" },
  { id: "straight", label: "Straight", path: "M8 4h8v16H8Z" },
  { id: "apple", label: "Apple", path: "M7 4h10l-3 16H10L7 4Z" },
  { id: "unsure", label: "Not sure", path: "M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1-1.5 2.4M12 18h.01" },
];

const EMPHASIS_AREAS = ["Shoulders", "Arms", "Waist", "Legs"];

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-frock-blush" />
      <span className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.12em" }}>
        {label}
      </span>
      <div className="flex-1 h-px bg-frock-blush" />
    </div>
  );
}

export default function FitPage() {
  const router = useRouter();
  const { sizeInputs, setSizeInput, shape, setShape, emphasis, setEmphasis, setHubDone } = useOnboardingStore();

  function handleSave() {
    setHubDone("fit", true);
    router.push("/onboarding/hub");
  }

  function toggleEmphasis(area: string, mode: "show" | "down") {
    const current = emphasis[area];
    setEmphasis(area, current === mode ? null : mode);
  }

  return (
    <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-1">
        <h1
          className="text-3xl text-frock-ink leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Sizes, shape & fit
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          Fill in what you know — skipped fields won't limit your recommendations.
        </p>
      </div>

      {/* Sizes */}
      <Divider label="Sizes" />
      <div className="grid grid-cols-2 gap-3">
        {SIZE_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <label className="text-xs tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
              {f.label}
            </label>
            <input
              type="text"
              placeholder={f.ph}
              value={sizeInputs[f.key]}
              onChange={(e) => setSizeInput(f.key, e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-sm text-frock-ink placeholder-frock-muted/60 outline-none transition-colors"
              style={{
                background: "#FFFFFF",
                borderColor: sizeInputs[f.key] ? "#D6402B" : "rgba(32,27,21,0.12)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Body shape */}
      <Divider label="Shape" />
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SHAPES.map((s) => {
          const selected = shape === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setShape(selected ? null : s.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 rounded-xl p-2.5 transition-all"
              style={{
                minWidth: 60,
                background: selected ? "#F5DCD3" : "#FFFFFF",
                border: selected ? "1.5px solid #D6402B" : "1.5px solid rgba(32,27,21,0.10)",
              }}
            >
              <svg width="24" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d={s.path}
                  fill={selected ? "#D6402B" : "none"}
                  stroke={selected ? "#D6402B" : "#554C41"}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs" style={{ color: selected ? "#D6402B" : "#8C8375" }}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Emphasis areas */}
      <Divider label="Emphasis" />
      <div className="flex flex-col gap-2">
        {EMPHASIS_AREAS.map((area) => {
          const mode = emphasis[area];
          return (
            <div key={area} className="flex items-center gap-3">
              <span className="text-sm text-frock-ink w-24 shrink-0">{area}</span>
              <div className="flex gap-2 flex-1">
                {(["show", "down"] as const).map((m) => {
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => toggleEmphasis(area, m)}
                      className="flex-1 rounded-full py-1.5 text-xs font-medium transition-all"
                      style={{
                        background: active ? (m === "show" ? "#D6402B" : "#201B15") : "#F8F3EB",
                        color: active ? "#FFFFFF" : "#8C8375",
                        border: active ? "none" : "1px solid rgba(32,27,21,0.10)",
                      }}
                    >
                      {m === "show" ? "Show off" : "Play down"}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={handleSave}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: "#D6402B" }}
        >
          Save fit
        </button>
        <button
          onClick={() => { setHubDone("fit", false); router.push("/onboarding/hub"); }}
          className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
