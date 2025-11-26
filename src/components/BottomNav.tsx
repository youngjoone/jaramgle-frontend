"use client";

import { Compass, Wand2, Image, CreditCard, Settings } from 'lucide-react';

interface BottomNavProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

const navItems = [
  { id: 'explore', icon: Compass, label: '도서관' },
  { id: 'create', icon: Wand2, label: '생성' },
  { id: 'gallery', icon: Image, label: '내 도서' },
  { id: 'subscription', icon: CreditCard, label: '구독' },
  { id: 'profile', icon: Settings, label: '설정' },
];

export function BottomNav({ activeNav, onNavChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeNav === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`bottom-nav-item touch-target ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
