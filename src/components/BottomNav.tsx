"use client";

import { useState } from 'react';
import { Compass, Wand2, Image, CreditCard, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LoginRequiredPopup } from '@/components/ui/alert-popup';
import { useAuthStore } from '@/store';

const navItems = [
  { id: 'library', href: '/library', icon: Compass, label: '도서관', requiresAuth: false },
  { id: 'create', href: '/create', icon: Wand2, label: '생성', requiresAuth: true },
  { id: 'my-books', href: '/my-books', icon: Image, label: '내 도서', requiresAuth: true },
  { id: 'subscription', href: '/subscription', icon: CreditCard, label: '결제', requiresAuth: true },
  { id: 'settings', href: '/settings', icon: Settings, label: '설정', requiresAuth: true },
];

export function BottomNav() {
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
    <>
      <nav className="bottom-nav md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isDisabled = needsLogin && item.requiresAuth;

          if (isDisabled) {
            return (
              <button
                key={item.id}
                onClick={(e) => handleNavClick(e, item)}
                className={`bottom-nav-item touch-target ${isActive ? 'active' : ''} opacity-50`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`bottom-nav-item touch-target ${isActive ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Login Required Popup */}
      <LoginRequiredPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLogin={handleLogin}
      />
    </>
  );
}
