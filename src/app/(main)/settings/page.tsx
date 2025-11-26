"use client";

import { useRouter } from 'next/navigation';
import { ProfilePage } from '@/components/ProfilePage';
import { useAuthStore } from '@/store';

export default function Settings() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return <ProfilePage onLogout={handleLogout} />;
}
