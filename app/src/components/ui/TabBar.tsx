"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function TabBar() {
  const pathname = usePathname();
  const tabs = [
    {
      href: "/wardrobe",
      label: "Wardrobe",
      active: pathname.startsWith("/wardrobe"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14l-1.2 9a1 1 0 0 1-1 .9H5.2a1 1 0 0 1-1-.9L3 5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M1 5h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M7.5 5V3.5A1.5 1.5 0 0 1 9 2h2a1.5 1.5 0 0 1 1.5 1.5V5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
    },
    {
      href: "/outfits",
      label: "Style",
      active: pathname.startsWith("/outfits"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l1.8 3.6L16 6.4l-3 2.9.7 4.1L10 11.5l-3.7 1.9.7-4.1L4 6.4l4.2-.8L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/profile",
      label: "Profile",
      active: pathname.startsWith("/profile"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white flex"
      style={{ borderTop: "1px solid #F5DCD3", height: 64 }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
          style={{ color: tab.active ? "#D6402B" : "#8C8375" }}
        >
          {tab.icon}
          <span className="text-xs font-medium">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
