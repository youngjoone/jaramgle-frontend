"use client";

import { LogOut, Mail, Calendar, BookOpen, Heart, Bookmark, Crown, Globe, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfilePageProps {
  onLogout: () => void;
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
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
                <span className="text-white font-bold text-xl md:text-2xl">U</span>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-[#4A3F47] font-bold mb-1 md:mb-2 text-base md:text-lg">사용자 이름</h2>
                <div className="flex items-center gap-2 text-[#7A6F76] font-normal mb-2 text-sm">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">user@example.com</span>
                </div>
                <div className="flex items-center gap-2 text-[#7A6F76] font-normal text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>2024년 10월 가입</span>
                </div>
              </div>
            </div>

            {/* Edit Profile Button - Below on mobile */}
            <Button
              variant="outline"
              className="w-full md:w-auto bg-white/60 border-[#B07BAC]/30 text-[#B07BAC] hover:bg-[#B07BAC]/10 hover:border-[#B07BAC]/50 rounded-xl font-semibold"
            >
              계정 수정
            </Button>
          </div>

          {/* Activity Stats */}
          <h4 className="text-[#4A3F47] font-semibold mb-3 text-sm">활동 통계</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-[#F1F8E9]/50 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-[#66BB6A]/20">
              <div className="flex items-center gap-2 text-[#66BB6A] mb-1 md:mb-2">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-[#4A3F47] mb-0.5 md:mb-1">12</p>
              <p className="text-xs text-[#7A6F76] font-medium">생성한 동화</p>
            </div>

            <div className="bg-[#FCE4EC]/50 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-[#F06292]/20">
              <div className="flex items-center gap-2 text-[#F06292] mb-1 md:mb-2">
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-[#4A3F47] mb-0.5 md:mb-1">248</p>
              <p className="text-xs text-[#7A6F76] font-medium">받은 좋아요</p>
            </div>

            <div className="bg-[#FFF8E1]/50 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-[#FFB74D]/20">
              <div className="flex items-center gap-2 text-[#FFB74D] mb-1 md:mb-2">
                <Bookmark className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-[#4A3F47] mb-0.5 md:mb-1">34</p>
              <p className="text-xs text-[#7A6F76] font-medium">북마크</p>
            </div>

            <div className="bg-[#F3E5F5]/50 backdrop-blur-xl rounded-2xl p-3 md:p-4 border border-[#B07BAC]/20">
              <div className="flex items-center gap-2 text-[#B07BAC] mb-1 md:mb-2">
                <Crown className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-[#4A3F47] mb-0.5 md:mb-1">프로</p>
              <p className="text-xs text-[#7A6F76] font-medium">현재 플랜</p>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-white/60 backdrop-blur-2xl border-white/60 shadow-[0_16px_48px_rgba(176,123,172,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] p-5 md:p-8 rounded-3xl mb-6">
          <h3 className="text-[#4A3F47] font-bold mb-4 md:mb-6">알림 설정</h3>

          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#4A3F47] font-semibold mb-1">이메일 알림</p>
                <p className="text-sm text-[#7A6F76] font-normal">동화책 업데이트 알림 받기</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator className="bg-[#B07BAC]/10" />

            {/* Share Stories Publicly */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#4A3F47] font-semibold mb-1">공개 프로필</p>
                <p className="text-sm text-[#7A6F76] font-normal">다른 사람들이 프로필을 볼 수 있도록 허용</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator className="bg-[#B07BAC]/10" />

            {/* Marketing Emails */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#4A3F47] font-semibold mb-1">마케팅 이메일</p>
                <p className="text-sm text-[#7A6F76] font-normal">팁과 영감 받기</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* App Settings */}
        <Card className="bg-white/60 backdrop-blur-2xl border-white/60 shadow-[0_16px_48px_rgba(176,123,172,0.12),inset_0_1px_0_rgba(255,255,255,0.8)] p-5 md:p-8 rounded-3xl mb-6">
          <h3 className="text-[#4A3F47] font-bold mb-4 md:mb-6">앱 설정</h3>

          <div className="space-y-5">
            {/* Language */}
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
              <Select defaultValue="ko">
                <SelectTrigger className="w-full md:w-[180px] bg-white/80 border-[#66BB6A]/30 rounded-xl h-11 text-[#4A3F47] font-medium hover:border-[#66BB6A]/50 focus:ring-2 focus:ring-[#66BB6A]/20 transition-all">
                  <SelectValue placeholder="언어 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-[#66BB6A]/20 rounded-xl shadow-lg">
                  <SelectItem value="en" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                    English
                  </SelectItem>
                  <SelectItem value="ko" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                    한국어
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

            <Separator className="bg-[#E0E0E0]/50" />

            {/* Default Story Style */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3E5F5] flex items-center justify-center">
                  <Palette className="w-5 h-5 text-[#B07BAC]" />
                </div>
                <div>
                  <p className="text-[#4A3F47] font-semibold">기본 스토리 스타일</p>
                  <p className="text-xs text-[#7A6F76]">새 동화책 생성 시 기본 스타일</p>
                </div>
              </div>
              <Select defaultValue="watercolor">
                <SelectTrigger className="w-full md:w-[180px] bg-white/80 border-[#66BB6A]/30 rounded-xl h-11 text-[#4A3F47] font-medium hover:border-[#66BB6A]/50 focus:ring-2 focus:ring-[#66BB6A]/20 transition-all">
                  <SelectValue placeholder="스타일 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-[#66BB6A]/20 rounded-xl shadow-lg">
                  <SelectItem value="watercolor" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                    수채화
                  </SelectItem>
                  <SelectItem value="digital" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                    디지털 아트
                  </SelectItem>
                  <SelectItem value="sketch" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                    스케치
                  </SelectItem>
                  <SelectItem value="3d" className="rounded-lg hover:bg-[#F1F8E9] focus:bg-[#F1F8E9] cursor-pointer">
                    3D 일러스트
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
