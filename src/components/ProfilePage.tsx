"use client";

import { useEffect, useMemo, useState } from 'react';
import { LogOut, Mail, Calendar, BookOpen, Heart, Bookmark, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfilePageProps {
  onLogout: () => void;
}

type Profile = {
  id: number;
  email: string;
  nickname: string;
  provider: string;
  role: string;
  createdAt?: string | null;
};

type Wallet = {
  balance: number;
};

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    stories: 0,
    likes: 0,
    bookmarks: 0,
    hearts: 0,
  });
  const [selectedLanguage, setSelectedLanguage] = useState('ko');

  const initialLetter = useMemo(() => {
    const src = profile?.nickname || profile?.email || 'U';
    return src.trim().charAt(0).toUpperCase();
  }, [profile]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const me = await apiFetch<Profile>('/me');
        const stories = await apiFetch<Array<{ id: number }>>('/stories');
        const wallet = await apiFetch<Wallet>('/wallets/me');
        if (!mounted) return;
        setProfile(me);
        setStats({
          stories: stories.length,
          likes: 0, // TODO: 실제 좋아요 수 API 연동 시 교체
          bookmarks: 0, // TODO: 북마크 개발 후 연동
          hearts: wallet.balance ?? 0,
        });
      } catch (err) {
        console.error('프로필 로드 실패', err);
        if (mounted) setError('프로필 정보를 불러오지 못했습니다.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="p-6 text-sm text-[#7A6F76]">프로필을 불러오는 중...</div>;
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-sm text-[#B00020]">
        {error || '프로필 정보를 불러오지 못했습니다.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-[#4A3F47] font-bold mb-1 md:mb-2">설정</h1>
          <p className="text-[#7A6F76] font-normal text-sm md:text-base">계정 및 앱 환경설정을 관리하세요</p>
        </div>

        {/* Account Section */}
        <Card className="bg-white/60 backdrop-blur-2xl border-white/60 shadow-[0_16px_48px_rgba(176,123,172,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] p-5 md:p-8 rounded-3xl mb-6">
          <h3 className="text-[#4A3F47] font-bold mb-4 md:mb-6">내 계정</h3>
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="flex items-start gap-4 md:gap-6 flex-1">
              {/* Avatar */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#C4D4C0] to-[#B0C5AC] flex items-center justify-center shadow-[0_12px_32px_rgba(196,212,192,0.35),inset_0_2px_0_rgba(255,255,255,0.3)] border border-white/30 flex-shrink-0">
                <span className="text-white font-bold text-xl md:text-2xl">{initialLetter}</span>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-[#4A3F47] font-bold mb-1 md:mb-2 text-base md:text-lg">
                  {profile.nickname || '닉네임 없음'}
                </h2>
                <div className="flex items-center gap-2 text-[#7A6F76] font-normal mb-2 text-sm">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#7A6F76] font-normal text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{profile.createdAt ? profile.createdAt : '가입일 정보 없음'}</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              className="w-full md:w-auto bg-white/60 border-[#B07BAC]/30 text-[#B07BAC] hover:bg-[#B07BAC]/10 hover:border-[#B07BAC]/50 rounded-xl font-semibold"
              onClick={onLogout}
            >
              로그아웃
            </Button>
          </div>

          {/* Activity Stats */}
          <h4 className="text-[#4A3F47] font-semibold mb-3 text-sm">활동 통계</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard label="생성한 동화" value={stats.stories} icon={BookOpen} colorClass="from-[#66BB6A]" />
            <StatCard label="받은 좋아요" value={stats.likes} icon={Heart} colorClass="from-[#F06292]" />
            <StatCard label="북마크" value={stats.bookmarks} icon={Bookmark} colorClass="from-[#FFB74D]" />
            <StatCard label="보유 하트" value={stats.hearts} icon={Heart} colorClass="from-[#8E24AA]" />
          </div>
        </Card>

        {/* App Settings - Language */}
        <Card className="bg-white/60 backdrop-blur-2xl border-white/60 shadow-[0_16px_48px_rgba(176,123,172,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] p-5 md:p-8 rounded-3xl mb-6">
          <h3 className="text-[#4A3F47] font-bold mb-4 md:mb-6">앱 설정</h3>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#42A5F5]" />
              </div>
              <div>
                <p className="text-[#4A3F47] font-semibold">언어</p>
                <p className="text-xs text-[#7A6F76]">앱 표시 언어 설정</p>
              </div>
            </div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full md:w-[180px] bg-white/80 border-[#66BB6A]/30 rounded-xl h-11 text-[#4A3F47] font-medium hover:border-[#66BB6A]/50 focus:ring-2 focus:ring-[#66BB6A]/20 transition-all">
                <SelectValue placeholder="언어 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl border-[#66BB6A]/20 rounded-xl shadow-lg">
                <SelectItem value="ko" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                  한국어
                </SelectItem>
                <SelectItem value="en" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                  English
                </SelectItem>
                <SelectItem value="ja" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                  日本語
                </SelectItem>
                <SelectItem value="zh" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                  中文
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-white/60 backdrop-blur-2xl border-red-200/60 shadow-[0_16px_48px_rgba(239,68,68,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] p-5 md:p-8 rounded-3xl">
          <h3 className="text-red-600 font-bold mb-4 md:mb-6">주의 영역</h3>

          <div className="space-y-4">
            {/* Logout */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 p-4 bg-red-50/50 backdrop-blur-xl rounded-2xl border border-red-100/40">
              <div>
                <p className="text-[#4A3F47] font-semibold mb-1">로그아웃</p>
                <p className="text-sm text-[#7A6F76] font-normal">계정에서 로그아웃</p>
              </div>
              <Button
                onClick={onLogout}
                className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-[0_8px_24px_rgba(239,68,68,0.25)] hover:shadow-[0_12px_32px_rgba(239,68,68,0.35)] transition-all duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 p-4 bg-red-50/50 backdrop-blur-xl rounded-2xl border border-red-100/40">
              <div>
                <p className="text-[#4A3F47] font-semibold mb-1">계정 삭제</p>
                <p className="text-sm text-[#7A6F76] font-normal">계정과 모든 데이터를 영구적으로 삭제</p>
              </div>
              <Button
                variant="outline"
                className="w-full md:w-auto border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-semibold"
              >
                삭제
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

function StatCard({ label, value, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-[#E0E0E0]/60 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-1 md:mb-2">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colorClass} to-transparent flex items-center justify-center text-white`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl md:text-2xl font-bold text-[#4A3F47] mb-0.5 md:mb-1">{value}</p>
      <p className="text-xs text-[#7A6F76] font-medium">{label}</p>
    </div>
  );
}
