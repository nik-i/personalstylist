"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WardrobePreviewRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/onboarding/closet"); }, [router]);
  return null;
}
