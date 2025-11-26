"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    // 로그인 되어있으면 도서관으로, 아니면 로그인 페이지로
    if (isLoggedIn) {
      router.replace('/library');
    } else {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  // Loading state while redirecting
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
