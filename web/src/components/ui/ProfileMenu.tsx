"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef } from "react";
import Image from "next/image";

export function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  }

  function hide() {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  }

  const image = session?.user?.image;
  const name = session?.user?.name ?? session?.user?.email ?? "";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ background: "#F5DCD3", color: "#D6402B" }}
        aria-label="Account menu"
      >
        {image ? (
          <Image src={image} alt={name} width={36} height={36} className="w-full h-full object-cover" />
        ) : (
          initials || (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3.5" stroke="#D6402B" strokeWidth="1.4" />
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#D6402B" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          )
        )}
      </button>

      {open && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute right-0 top-10 z-50 min-w-[140px] rounded-xl py-1 shadow-lg"
          style={{ background: "#fff", border: "1px solid rgba(32,27,21,0.1)" }}
        >
          {name && (
            <p className="px-4 py-2 text-xs text-frock-muted truncate max-w-[180px]">{name}</p>
          )}
          <div style={{ height: 1, background: "rgba(32,27,21,0.06)" }} />
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="w-full text-left px-4 py-2.5 text-sm text-frock-ink hover:bg-frock-cream transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
