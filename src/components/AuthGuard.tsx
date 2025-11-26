"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isGuestMode } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip auth check for guest mode on library page (둘러보기 allowed)
    const isGuestAllowedPage = pathname === '/library';

    if (!isLoggedIn && !isGuestMode) {
      router.replace('/login');
    } else if (isGuestMode && !isGuestAllowedPage) {
      // Guest mode only allows access to library
      router.replace('/login');
    } else {
      setIsChecking(false);
    }
  }, [isLoggedIn, isGuestMode, pathname, router]);

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
