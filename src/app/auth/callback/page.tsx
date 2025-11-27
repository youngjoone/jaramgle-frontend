"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store";
import { authApi } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    // 백엔드가 access/refresh 쿠키를 내려주므로 추가 처리 없이 홈으로 이동
    router.replace("/library");
  }, [router, searchParams, setUser]);

  return null;
}
