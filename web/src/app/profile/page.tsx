"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

// ── Types ─────────────────────────────────────────────────────────────────────

type GoalsData = {
  adjectives: string[];
  styleIcons: string;
  goalType: string;
  goalNote: string;
};

type ProfileData = {
  height: string;
  bodyShape: string;
  coloring: string;
  highlightPrefs: string;
  downplayPrefs: string;
  hardNos: string;
  styleGoals: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const BODY_SHAPES = [
  { id: "hourglass", label: "Hourglass" },
  { id: "pear", label: "Pear" },
  { id: "apple", label: "Apple" },
  { id: "rectangle", label: "Rectangle" },
  { id: "inverted-triangle", label: "Inverted triangle" },
  { id: "not-sure", label: "Not sure" },
];

const HIGHLIGHT_OPTIONS = ["Shoulders", "Décolletage", "Waist", "Legs", "Arms", "Back"];
const DOWNPLAY_OPTIONS = ["Hips", "Tummy", "Upper arms", "Thighs", "Bust", "Shoulders"];
const HARD_NO_PRESETS = ["No heels", "Nothing sleeveless", "No logos", "No sheer", "No bodycon", "No fur"];
const STYLE_ADJECTIVES = ["Polished", "Minimal", "Edgy", "Romantic", "Classic", "Bold", "Preppy", "Bohemian", "Athleisure", "Maximalist", "Monochrome", "Eclectic"];
const GOAL_TYPES = [
  { id: "senior-at-work", label: "Look more senior at work" },
  { id: "put-together", label: "Feel more put-together" },
  { id: "age-differently", label: "Dress my age differently" },
  { id: "capsule", label: "Build a capsule wardrobe" },
  { id: "more-from-wardrobe", label: "Make more of what I own" },
  { id: "other", label: "Something else" },
];

// ── Primitives ────────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-all border"
      style={
        selected
          ? { background: "#D6402B", color: "#fff", borderColor: "#D6402B" }
          : { background: "#fff", color: "#554C41", borderColor: "rgba(32,27,21,0.15)" }
      }
    >
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  subtitle,
  open,
  onToggle,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 text-left"
    >
      <div>
        <p className="font-semibold text-frock-ink text-base">{title}</p>
        <p className="text-xs text-frock-muted mt-0.5">{subtitle}</p>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0 transition-transform"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "#8C8375" }}
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function SaveButton({
  saving,
  saved,
  onClick,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="w-full rounded-full py-3.5 text-sm font-medium transition-all"
      style={
        saved
          ? { background: "#4F7B58", color: "#fff" }
          : { background: "#D6402B", color: "#fff", opacity: saving ? 0.6 : 1 }
      }
    >
      {saved ? "Saved ✓" : saving ? "Saving…" : "Save"}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-wider text-frock-muted"
        style={{ letterSpacing: "0.1em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-xl px-3.5 py-2.5 text-sm text-frock-ink bg-white outline-none w-full"
      style={{ border: "1px solid rgba(32,27,21,0.15)" }}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-xl px-3.5 py-2.5 text-sm text-frock-ink bg-white outline-none w-full resize-none leading-relaxed"
      style={{ border: "1px solid rgba(32,27,21,0.15)" }}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeParseArray(val: string | undefined): string[] {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function safeParseObject<T>(val: string | undefined, defaults: T): T {
  if (!val) return defaults;
  try {
    return { ...defaults, ...JSON.parse(val) };
  } catch {
    return defaults;
  }
}

function commaSplit(val: string): string[] {
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<"you" | "goals" | null>("you");

  // Section 1 — You
  const [height, setHeight] = useState("");
  const [bodyShape, setBodyShape] = useState("");
  const [coloring, setColoring] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [downplays, setDownplays] = useState<string[]>([]);
  const [hardNos, setHardNos] = useState<string[]>([]);
  const [hardNoInput, setHardNoInput] = useState("");
  const [youSaving, setYouSaving] = useState(false);
  const [youSaved, setYouSaved] = useState(false);

  // Section 2 — Goals
  const [adjectives, setAdjectives] = useState<string[]>([]);
  const [styleIcons, setStyleIcons] = useState("");
  const [goalType, setGoalType] = useState("");
  const [goalNote, setGoalNote] = useState("");
  const [goalsSaving, setGoalsSaving] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d: Partial<ProfileData>) => {
        setHeight(d.height ?? "");
        setBodyShape(d.bodyShape ?? "");
        setColoring(d.coloring ?? "");
        setHighlights(safeParseArray(d.highlightPrefs));
        setDownplays(safeParseArray(d.downplayPrefs));
        setHardNos(safeParseArray(d.hardNos));

        const goals = safeParseObject<GoalsData>(d.styleGoals, {
          adjectives: [],
          styleIcons: "",
          goalType: "",
          goalNote: "",
        });
        setAdjectives(goals.adjectives ?? []);
        setStyleIcons(goals.styleIcons ?? "");
        setGoalType(goals.goalType ?? "");
        setGoalNote(goals.goalNote ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleArr(arr: string[], val: string, setArr: (v: string[]) => void) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  function addHardNo(val: string) {
    const trimmed = val.trim();
    if (!trimmed || hardNos.includes(trimmed)) return;
    setHardNos([...hardNos, trimmed]);
    setHardNoInput("");
  }

  async function saveSection(payload: Record<string, string>) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  async function saveYou() {
    setYouSaving(true);
    await saveSection({
      height,
      bodyShape,
      coloring,
      highlightPrefs: JSON.stringify(highlights),
      downplayPrefs: JSON.stringify(downplays),
      hardNos: JSON.stringify(hardNos),
    });
    setYouSaving(false);
    setYouSaved(true);
    setTimeout(() => setYouSaved(false), 2000);
  }

  async function saveGoals() {
    setGoalsSaving(true);
    await saveSection({
      styleGoals: JSON.stringify({ adjectives, styleIcons, goalType, goalNote }),
    });
    setGoalsSaving(false);
    setGoalsSaved(true);
    setTimeout(() => setGoalsSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl animate-pulse bg-frock-cream-2" />
        ))}
      </div>
    );
  }

  const divider = <div style={{ height: 1, background: "rgba(32,27,21,0.08)" }} />;

  return (
    <div className="flex flex-col py-2">
      <h1
        className="text-3xl text-frock-ink leading-tight mb-6"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        My style profile
      </h1>

      {/* ── Sign out ── */}
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        className="self-start text-sm text-frock-muted hover:text-frock-ink transition-colors mb-6"
      >
        Sign out
      </button>

      {/* ── Section 1: You ── */}
      <div
        className="bg-white rounded-2xl overflow-hidden mb-3"
        style={{ border: "1px solid rgba(32,27,21,0.08)" }}
      >
        <div className="px-4">
          <SectionHeader
            title="You"
            subtitle="Body, coloring, and hard limits"
            open={openSection === "you"}
            onToggle={() => setOpenSection(openSection === "you" ? null : "you")}
          />
        </div>

        {openSection === "you" && (
          <div className="px-4 pb-5 flex flex-col gap-5">
            {divider}

            <Field label="Height">
              <TextInput value={height} onChange={setHeight} placeholder={"e.g. 5'6\" or 168cm"} />
            </Field>

            <Field label="Body shape">
              <div className="flex flex-wrap gap-2">
                {BODY_SHAPES.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.label}
                    selected={bodyShape === s.id}
                    onClick={() => setBodyShape(bodyShape === s.id ? "" : s.id)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Coloring & colors that suit me">
              <TextInput
                value={coloring}
                onChange={setColoring}
                placeholder="e.g. warm undertones, get compliments in rust and olive"
              />
            </Field>

            <Field label="Emphasize">
              <div className="flex flex-wrap gap-2">
                {HIGHLIGHT_OPTIONS.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={highlights.includes(opt)}
                    onClick={() => toggleArr(highlights, opt, setHighlights)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Downplay">
              <div className="flex flex-wrap gap-2">
                {DOWNPLAY_OPTIONS.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    selected={downplays.includes(opt)}
                    onClick={() => toggleArr(downplays, opt, setDownplays)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Hard no's">
              <div className="flex flex-wrap gap-2 mb-2">
                {HARD_NO_PRESETS.filter((p) => !hardNos.includes(p)).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addHardNo(p)}
                    className="rounded-full px-3 py-1 text-xs border text-frock-muted transition-colors hover:border-frock-red hover:text-frock-red"
                    style={{ borderColor: "rgba(32,27,21,0.15)", background: "#FAFAFA" }}
                  >
                    + {p}
                  </button>
                ))}
              </div>
              {hardNos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {hardNos.map((n) => (
                    <span
                      key={n}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: "#F5DCD3", color: "#D6402B" }}
                    >
                      {n}
                      <button
                        type="button"
                        onClick={() => setHardNos(hardNos.filter((x) => x !== n))}
                        className="ml-0.5 hover:opacity-70"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hardNoInput}
                  onChange={(e) => setHardNoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHardNo(hardNoInput)}
                  placeholder="Add your own…"
                  className="flex-1 rounded-xl px-3.5 py-2 text-sm text-frock-ink bg-white outline-none"
                  style={{ border: "1px solid rgba(32,27,21,0.15)" }}
                />
                <button
                  type="button"
                  onClick={() => addHardNo(hardNoInput)}
                  className="rounded-xl px-3.5 py-2 text-sm font-medium text-white transition-opacity"
                  style={{ background: "#D6402B" }}
                >
                  Add
                </button>
              </div>
            </Field>

            <SaveButton saving={youSaving} saved={youSaved} onClick={saveYou} />
          </div>
        )}
      </div>

      {/* ── Section 2: Taste & goals ── */}
      <div
        className="bg-white rounded-2xl overflow-hidden mb-3"
        style={{ border: "1px solid rgba(32,27,21,0.08)" }}
      >
        <div className="px-4">
          <SectionHeader
            title="Taste & goals"
            subtitle="Style adjectives, icons, and what you're working towards"
            open={openSection === "goals"}
            onToggle={() => setOpenSection(openSection === "goals" ? null : "goals")}
          />
        </div>

        {openSection === "goals" && (
          <div className="px-4 pb-5 flex flex-col gap-5">
            {divider}

            <Field label="My style in words (pick up to 5)">
              <div className="flex flex-wrap gap-2">
                {STYLE_ADJECTIVES.map((adj) => (
                  <Chip
                    key={adj}
                    label={adj}
                    selected={adjectives.includes(adj)}
                    onClick={() => {
                      if (adjectives.includes(adj)) {
                        setAdjectives(adjectives.filter((a) => a !== adj));
                      } else if (adjectives.length < 5) {
                        setAdjectives([...adjectives, adj]);
                      }
                    }}
                  />
                ))}
              </div>
            </Field>

            <Field label="People whose style I admire">
              <TextInput
                value={styleIcons}
                onChange={setStyleIcons}
                placeholder="e.g. Victoria Beckham, Zendaya, Alexa Chung"
              />
            </Field>

            <Field label="What I'm working towards">
              <div className="flex flex-col gap-2">
                {GOAL_TYPES.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoalType(goalType === g.id ? "" : g.id)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-left transition-all"
                    style={
                      goalType === g.id
                        ? { background: "#FDF0ED", border: "1.5px solid #D6402B", color: "#D6402B" }
                        : { background: "#fff", border: "1px solid rgba(32,27,21,0.12)", color: "#554C41" }
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Anything else?">
              <TextArea
                value={goalNote}
                onChange={setGoalNote}
                placeholder="Tell me more about what you're going for…"
                rows={2}
              />
            </Field>

            <SaveButton saving={goalsSaving} saved={goalsSaved} onClick={saveGoals} />
          </div>
        )}
      </div>
    </div>
  );
}
