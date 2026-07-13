"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionToken } from "../lib/auth-store";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getSessionToken() ? "/feed" : "/login");
  }, [router]);

  return null;
}
