"use client";

import { ProfileMenu } from "@/components/ui/ProfileMenu";

type NavId = "wardrobe" | "style-me" | "profile";

const NAV: Array<{ id: NavId; label: string; topLabel: string; icon: React.ReactNode }> = [
  {
    id: "wardrobe",
    label: "Virtual wardrobe",
    topLabel: "Virtual wardrobe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <path d="M3 7h16l-1.5 11H4.5L3 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "style-me",
    label: "Style me now",
    topLabel: "Style me now",
    icon: (
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <path d="M11 2L2 7l9 5 9-5-9-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M2 12l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Fine-tune my profile",
    topLabel: "My style profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

interface AppShellProps {
  children: React.ReactNode;
  activeView: NavId;
  topLabel?: string;
  onNavClick: (id: NavId) => void;
}

export function AppShell({ children, activeView, topLabel, onNavClick }: AppShellProps) {
  const activeNav = NAV.find((n) => n.id === activeView)!;

  return (
    <div className="flex min-h-screen" style={{ background: "#F8F3EB" }}>
      {/* Left sidebar */}
      <aside
        className="flex flex-col shrink-0 sticky top-0 h-screen"
        style={{ width: 232, background: "#201B15", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Wordmark */}
        <div className="px-6 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              color: "#F8F3EB",
              fontSize: 14,
              letterSpacing: "0.06em",
              lineHeight: 1.4,
            }}
          >
            The Wardrobe<br />Collective
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
          {NAV.map((item) => {
            const isActive = item.id === activeView;
            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className="relative flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-colors"
                style={
                  isActive
                    ? { background: "rgba(214,64,43,0.18)", color: "#F8F3EB" }
                    : { color: "rgba(248,243,235,0.52)" }
                }
              >
                {isActive && (
                  <span
                    className="absolute left-0 inset-y-0 my-auto"
                    style={{ width: 3, height: 20, background: "#D6402B", borderRadius: "0 2px 2px 0" }}
                  />
                )}
                <span className="shrink-0">{item.icon}</span>
                <span className="text-sm font-medium leading-snug">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile at bottom */}
        <div
          className="px-4 py-4 flex items-center gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <ProfileMenu placement="top-right" />
          <span className="text-xs truncate" style={{ color: "rgba(248,243,235,0.45)" }}>Account</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center px-8 py-4 sticky top-0 z-10"
          style={{
            background: "rgba(248,243,235,0.92)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid rgba(32,27,21,0.07)",
          }}
        >
          <p className="text-xs font-semibold uppercase" style={{ letterSpacing: "0.16em", color: "#8C8375" }}>
            {topLabel ?? activeNav.topLabel}
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6">{children}</div>
      </main>
    </div>
  );
}

export { NAV };
export type { NavId };
