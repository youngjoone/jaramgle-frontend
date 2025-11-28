"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store";
import { authApi } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, exitGuestMode } = useAuthStore();

  useEffect(() => {
    exitGuestMode(); // 소셜 로그인 진입 시 게스트 모드 해제

    const finalizeLogin = async () => {
      try {
        const profile = await authApi.bootstrapSession();
        if (profile) {
          setUser(profile);
          router.replace("/library");
          return;
        }
      } catch (err) {
        console.error("Failed to bootstrap session after OAuth callback", err);
      }
      router.replace("/login");
    };

    finalizeLogin();
  }, [router, searchParams, setUser, exitGuestMode]);

  return null;
}
