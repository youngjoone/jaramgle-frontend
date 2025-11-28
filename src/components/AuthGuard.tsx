"use client";

import { useEffect, useState, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isGuestMode, setUser, user, exitGuestMode } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const isGuestAllowedPage = pathname === '/library';

    // 이미 로그인/프로필이 있으면 통과
    if (user) {
      setIsChecking(false);
      return;
    }

    // 세션 부팅 시도 (게스트 모드라도 토큰이 있으면 로그인 전환)
    (async () => {
      try {
        const profile = await authApi.bootstrapSession();
        if (profile) {
          exitGuestMode();
          setUser(profile);
          setIsChecking(false);
          return;
        }
      } catch (err) {
        console.error('Session bootstrap failed', err);
      }

      // 부팅 실패 시 게스트 허용 페이지는 통과, 아니면 로그인으로 이동
      if (isGuestMode && isGuestAllowedPage) {
        setIsChecking(false);
      } else {
        router.replace('/login');
      }
    })();
  }, [isLoggedIn, isGuestMode, pathname, router, setUser, user, exitGuestMode]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]">
        <div className="text-center">
          <span
            className="text-[#66BB6A] text-6xl leading-none animate-pulse"
            style={{
              fontFamily: "var(--font-handwriting), 'Just Another Hand', cursive",
            }}
          >
            Jaramgle
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
