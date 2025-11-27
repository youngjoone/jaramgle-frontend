"use client";

import { useState } from 'react';
import { Compass, Image as ImageIcon, Wand2, CreditCard, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LoginRequiredPopup } from '@/components/ui/alert-popup';
import { useAuthStore } from '@/store';

const navItems = [
  { id: 'library', href: '/library', icon: Compass, label: '도서관', requiresAuth: false },
  { id: 'create', href: '/create', icon: Wand2, label: '생성', requiresAuth: true },
  { id: 'my-books', href: '/my-books', icon: ImageIcon, label: '내 도서목록', requiresAuth: true },
];

const bottomItems = [
  { id: 'subscription', href: '/subscription', icon: CreditCard, label: '결제', requiresAuth: true },
  { id: 'settings', href: '/settings', icon: Settings, label: '설정', requiresAuth: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // 로그인 안 되어있으면 로그인 필요 버튼들 비활성화
  const needsLogin = !(isLoggedIn || user);

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (needsLogin && item.requiresAuth) {
      e.preventDefault();
      setShowLoginPopup(true);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 bottom-0 w-20 bg-gradient-to-b from-[#F1F8E9] via-[#E8F5E9] to-[#C8E6C9] z-50 hidden md:flex flex-col items-center py-6">
        {/* Logo */}
        <Link href="/library" className="mb-8">
          <div className="cursor-pointer transition-all duration-300 hover:scale-105">
            <span
              className="text-[#66BB6A] text-5xl leading-none"
              style={{
                fontFamily: "var(--font-handwriting), 'Just Another Hand', cursive",
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              J
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isDisabled = needsLogin && item.requiresAuth;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild={!isDisabled}
                    className={`w-14 h-14 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-[#F5F5F5] text-[#1A1A1A] shadow-sm'
                        : isDisabled
                        ? 'text-[#BDBDBD] hover:text-[#757575] hover:bg-[#F5F5F5]/50 cursor-pointer'
                        : 'text-[#757575] hover:text-[#1A1A1A] hover:bg-[#F5F5F5]'
                    }`}
                    onClick={isDisabled ? (e) => handleNavClick(e, item) : undefined}
                  >
                    {isDisabled ? (
                      <Icon className="w-5 h-5" />
                    ) : (
                      <Link href={item.href}>
                        <Icon className="w-5 h-5" />
                      </Link>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}{isDisabled && ' (로그인 필요)'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom Items */}
        <div className="flex flex-col gap-3">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isDisabled = needsLogin && item.requiresAuth;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild={!isDisabled}
                    className={`w-14 h-14 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-[#F5F5F5] text-[#1A1A1A] shadow-sm'
                        : isDisabled
                        ? 'text-[#BDBDBD] hover:text-[#757575] hover:bg-[#F5F5F5]/50 cursor-pointer'
                        : 'text-[#757575] hover:text-[#1A1A1A] hover:bg-[#F5F5F5]'
                    }`}
                    onClick={isDisabled ? (e) => handleNavClick(e, item) : undefined}
                  >
                    {isDisabled ? (
                      <Icon className="w-5 h-5" />
                    ) : (
                      <Link href={item.href}>
                        <Icon className="w-5 h-5" />
                      </Link>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}{isDisabled && ' (로그인 필요)'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </aside>

      {/* Login Required Popup */}
      <LoginRequiredPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLogin={handleLogin}
      />
    </TooltipProvider>
  );
}
