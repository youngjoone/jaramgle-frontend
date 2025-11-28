"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';
import { getOAuthUrl } from '@/lib/api';

interface Star {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
}

interface Cloud {
  id: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

interface Sparkle {
  id: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
}

export function LoginPage() {
  const router = useRouter();
  const { enterGuestMode, exitGuestMode } = useAuthStore();

  const redirectToOAuth = (provider: "google" | "kakao" | "naver") => {
    exitGuestMode();
    const url = getOAuthUrl(provider);
    window.location.href = url;
  };

  const handleExplore = () => {
    enterGuestMode();
    router.push('/library');
  };
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Generate random positions only on client side to avoid hydration mismatch
  useEffect(() => {
    setStars(Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      size: 2 + Math.random() * 3,
    })));

    setClouds(Array.from({ length: 8 }, (_, i) => ({
      id: i,
      top: 10 + Math.random() * 60,
      delay: Math.random() * 10,
      duration: 30 + Math.random() * 20,
      size: 100 + Math.random() * 150,
      opacity: 0.3 + Math.random() * 0.4,
    })));

    setSparkles(Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 4 + Math.random() * 3,
      delay: Math.random() * 5,
    })));
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]">
      {/* Animated Background Elements */}

      {/* Stars */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Clouds */}
      {clouds.map((cloud) => (
        <motion.div
          key={`cloud-${cloud.id}`}
          className="absolute rounded-full bg-white/30 backdrop-blur-sm"
          style={{
            top: `${cloud.top}%`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.6}px`,
            opacity: cloud.opacity,
          }}
          animate={{
            x: ['-100%', '100vw'],
          }}
          transition={{
            duration: cloud.duration,
            delay: cloud.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Floating Sparkles */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={`sparkle-${sparkle.id}`}
          className="absolute w-1 h-1 bg-white/60 rounded-full"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        {/* Logo and Title */}
        <motion.div
          className="text-center mb-auto mt-auto"
          style={{ transform: 'translateY(-10%)' }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="inline-flex items-center justify-center mb-8">
            <span
              className="text-[#66BB6A] text-9xl leading-none"
              style={{
                fontFamily: "'Just Another Hand', cursive",
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 8px 40px rgba(0, 0, 0, 0.05)'
              }}
            >
              Jaramgle
            </span>
          </div>
          <div className="font-normal text-3xl text-white" style={{ textShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 8px 40px rgba(0, 0, 0, 0.2)' }}>
            AI로 마법같은 동화책을 만들어보세요.
          </div>
        </motion.div>

        {/* Action Buttons - Fixed at bottom */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-6 mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          {/* 회원가입 - Primary CTA */}
          <Button
            variant="ghost"
            onClick={() => setShowSignUpModal(true)}
            className="flex-1 bg-yellow-light hover:bg-yellow text-[#5D4037] border-0 shadow-[0_8px_32px_rgba(255,245,157,0.6)] hover:shadow-[0_12px_40px_rgba(255,238,88,0.7)] rounded-2xl h-14 font-bold transition-all duration-[var(--duration-normal)] hover:scale-105 touch-target"
          >
            회원가입
          </Button>
          {/* 로그인 - Secondary CTA */}
          <Button
            variant="ghost"
            onClick={() => setShowLoginModal(true)}
            className="flex-1 bg-white hover:bg-gray-50 text-[#2E7D32] border-2 border-white shadow-[0_8px_32px_rgba(255,255,255,0.5)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.7)] rounded-2xl h-14 font-bold transition-all duration-[var(--duration-normal)] hover:scale-105 touch-target"
          >
            로그인
          </Button>
          {/* 둘러보기 - Tertiary */}
          <Button
            variant="ghost"
            onClick={handleExplore}
            className="flex-1 bg-[#81C784] hover:bg-[#66BB6A] text-white border-2 border-white/30 rounded-2xl h-14 font-bold transition-all duration-[var(--duration-normal)] hover:scale-105 shadow-[0_8px_32px_rgba(129,199,132,0.4)] hover:shadow-[0_12px_40px_rgba(102,187,106,0.5)] touch-target"
          >
            둘러보기
          </Button>
        </motion.div>
      </div>

      {/* Sign Up Modal */}
      <Dialog open={showSignUpModal} onOpenChange={setShowSignUpModal}>
        <DialogContent className="bg-white/90 backdrop-blur-2xl border-2 border-white/60 rounded-3xl shadow-[0_32px_64px_rgba(102,187,106,0.2)] max-w-md">
          <div className="text-center p-6">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-6">
              <span className="text-[var(--primary)] text-6xl leading-none" style={{ fontFamily: "'Just Another Hand', cursive" }}>
                Jaramgle
              </span>
            </div>

            {/* Title */}
            <DialogTitle className="text-[var(--text-primary)] font-bold mb-3 text-2xl">
              계정 만들기
            </DialogTitle>

            {/* Subtitle */}
            <DialogDescription className="text-[var(--text-tertiary)] font-normal mb-8">
              수천 명의 창작자와 함께 마법같은 이야기를 만들어보세요
            </DialogDescription>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Google Sign Up Button */}
              <Button
                onClick={() => {
                  setShowSignUpModal(false);
                  redirectToOAuth("google");
                }}
                className="w-full bg-white hover:bg-white/90 text-[var(--text-primary)] border border-[var(--primary)]/20 shadow-[0_4px_16px_rgba(102,187,106,0.1)] hover:shadow-[0_8px_24px_rgba(102,187,106,0.2)] rounded-2xl h-14 font-semibold transition-all duration-[var(--duration-normal)] touch-target"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 회원가입
              </Button>

              {/* Kakao Sign Up Button */}
              <Button
                onClick={() => {
                  setShowSignUpModal(false);
                  redirectToOAuth("kakao");
                }}
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] border-0 shadow-[0_4px_16px_rgba(254,229,0,0.3)] hover:shadow-[0_8px_24px_rgba(254,229,0,0.4)] rounded-2xl h-14 font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.48 2 10.85c0 2.8 1.87 5.25 4.64 6.67-.2.73-.65 2.37-.74 2.75-.1.47.17.46.37.33.15-.09 2.5-1.68 3.48-2.37.62.09 1.27.14 1.94.14 5.52 0 10-3.48 10-7.85S17.52 3 12 3z"/>
                </svg>
                카카오로 회원가입
              </Button>

              {/* Naver Sign Up Button */}
              <Button
                onClick={() => {
                  setShowSignUpModal(false);
                  redirectToOAuth("naver");
                }}
                className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white border-0 shadow-[0_4px_16px_rgba(3,199,90,0.3)] hover:shadow-[0_8px_24px_rgba(3,199,90,0.4)] rounded-2xl h-14 font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                네이버로 회원가입
              </Button>
            </div>

            {/* Terms */}
            <p className="text-xs text-[var(--text-tertiary)] font-normal mt-6">
              계속 진행하면{' '}
              <button className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium underline">
                서비스 약관
              </button>{' '}
              및{' '}
              <button className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium underline">
                개인정보 처리방침
              </button>
              에 동의하는 것으로 간주됩니다
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log In Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="bg-white/90 backdrop-blur-2xl border-2 border-white/60 rounded-3xl shadow-[0_32px_64px_rgba(102,187,106,0.2)] max-w-md">
          <div className="text-center p-6">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-6">
              <span className="text-[var(--primary)] text-6xl leading-none" style={{ fontFamily: "'Just Another Hand', cursive" }}>
                Jaramgle
              </span>
            </div>

            {/* Title */}
            <DialogTitle className="text-[var(--text-primary)] font-bold mb-3 text-2xl">
              다시 오신 것을 환영합니다
            </DialogTitle>

            {/* Subtitle */}
            <DialogDescription className="text-[var(--text-tertiary)] font-normal mb-8">
              로그인하고 계속해서 마법같은 이야기를 만들어보세요
            </DialogDescription>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Google Login Button */}
              <Button
                onClick={() => {
                  setShowLoginModal(false);
                  redirectToOAuth("google");
                }}
                className="w-full bg-white hover:bg-white/90 text-[var(--text-primary)] border border-[var(--primary)]/20 shadow-[0_4px_16px_rgba(102,187,106,0.1)] hover:shadow-[0_8px_24px_rgba(102,187,106,0.2)] rounded-2xl h-14 font-semibold transition-all duration-[var(--duration-normal)] touch-target"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 로그인
              </Button>

              {/* Kakao Login Button */}
              <Button
                onClick={() => {
                  setShowLoginModal(false);
                  redirectToOAuth("kakao");
                }}
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] border-0 shadow-[0_4px_16px_rgba(254,229,0,0.3)] hover:shadow-[0_8px_24px_rgba(254,229,0,0.4)] rounded-2xl h-14 font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.48 2 10.85c0 2.8 1.87 5.25 4.64 6.67-.2.73-.65 2.37-.74 2.75-.1.47.17.46.37.33.15-.09 2.5-1.68 3.48-2.37.62.09 1.27.14 1.94.14 5.52 0 10-3.48 10-7.85S17.52 3 12 3z"/>
                </svg>
                카카오로 로그인
              </Button>

              {/* Naver Login Button */}
              <Button
                onClick={() => {
                  setShowLoginModal(false);
                  redirectToOAuth("naver");
                }}
                className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white border-0 shadow-[0_4px_16px_rgba(3,199,90,0.3)] hover:shadow-[0_8px_24px_rgba(3,199,90,0.4)] rounded-2xl h-14 font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                네이버로 로그인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
