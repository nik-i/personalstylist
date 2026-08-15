"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell, NavId } from "@/components/layout/AppShell";
import { ClosetContent } from "@/components/wardrobe/ClosetContent";
import StyleMePage from "@/app/style-me/page";
import ShouldIBuyPage from "@/app/should-i-buy/page";
import MyLooksPage from "@/app/my-looks/page";
import ProfilePage from "@/app/profile/page";

const VALID_TABS: NavId[] = ["wardrobe", "style-me", "should-i-buy", "my-looks", "profile"];

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = searchParams.get("tab") ?? "wardrobe";
  const view: NavId = VALID_TABS.includes(raw as NavId) ? (raw as NavId) : "wardrobe";

  function handleNavClick(id: NavId) {
    if (id === "wardrobe") {
      router.push("/onboarding/landing");
    } else {
      router.push(`/onboarding/landing?tab=${id}`);
    }
  }

  return (
    <AppShell activeView={view} onNavClick={handleNavClick}>
      {view === "wardrobe" && <ClosetContent />}
      {view === "style-me" && <StyleMePage />}
      {view === "should-i-buy" && <ShouldIBuyPage />}
      {view === "my-looks" && <MyLooksPage />}
      {view === "profile" && <ProfilePage />}
    </AppShell>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  );
}
