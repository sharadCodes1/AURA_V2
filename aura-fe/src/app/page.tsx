"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Client redirect (works in Tauri's static export, unlike server redirect()).
// The dashboard guard sends authenticated users onward from /login.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
