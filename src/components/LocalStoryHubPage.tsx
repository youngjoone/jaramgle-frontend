"use client";

import { Landmark, Map, Sparkles, Waves } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LOCAL_REGION_LIST } from '@/lib/localStoryRegions';

const busanCard = {
  slug: 'busan',
  brandLabel: 'Jaramgle × Busan',
  regionName: '부산',
  title: '바다와 도시를 따라 걷는 부산 이야기',
  subtitle: '부기와 함께 사진이 있는 부산 명소를 동화로 바꿉니다.',
  colors: {
    page: 'linear-gradient(135deg, #E0F7FA, #E1F5FE)',
    primary: '#0288D1',
    primaryDark: '#01579B',
    border: '#81D4FA',
  },
};

export function LocalStoryHubPage() {
  const router = useRouter();
  const cards = [busanCard, ...LOCAL_REGION_LIST];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#F1F8E9_0%,#E0F2FE_38%,#FFF7ED_75%,#FFFFFF_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[38px] border border-[#C8E6C9] bg-white/82 p-8 shadow-[0_26px_54px_rgba(15,23,42,0.12)] backdrop-blur md:p-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#A7F3D0]/35 blur-3xl" />
          <div className="absolute -bottom-24 left-6 h-72 w-72 rounded-full bg-[#BAE6FD]/35 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-1 text-sm font-black text-[#047857]">
              <Sparkles className="h-4 w-4" /> 지역 공공데이터 AI 스토리맵
            </div>
            <h1 className="text-4xl font-black leading-tight text-[#064E3B] md:text-5xl" style={{ fontFamily: "'Jua', 'Do Hyeon', sans-serif" }}>
              지역을 고르면,
              <br />공공데이터가 이야기책이 됩니다
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#45695D] md:text-base">
              부산에서 검증한 구조를 대구와 충북으로 확장했습니다. 사진이 있는 장소 데이터, 지도 탐색, 지역별 이야기 방향을 결합해 공모전형 로컬 AI 콘텐츠로 만듭니다.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card) => {
            const isBusan = card.slug === 'busan';
            return (
              <button
                key={card.slug}
                type="button"
                onClick={() => router.push(`/${card.slug}`)}
                className="group overflow-hidden rounded-[32px] border bg-white/88 p-5 text-left shadow-[0_18px_36px_rgba(15,23,42,0.1)] transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.14)]"
                style={{ borderColor: card.colors.border }}
              >
                <div className="relative mb-5 h-44 overflow-hidden rounded-[26px]" style={{ background: card.colors.page }}>
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-lg" />
                  <div className="absolute bottom-4 left-4 rounded-2xl bg-white/82 px-4 py-3 shadow-sm">
                    <div className="mb-1 text-xs font-black" style={{ color: card.colors.primary }}>{card.brandLabel}</div>
                    <div className="text-3xl font-black" style={{ color: card.colors.primaryDark, fontFamily: "'Jua', 'Do Hyeon', sans-serif" }}>{card.regionName}</div>
                  </div>
                  <div className="absolute right-5 top-5 rounded-full bg-white/85 p-3 shadow-sm" style={{ color: card.colors.primary }}>
                    {isBusan ? <Waves className="h-7 w-7" /> : card.slug === 'daegu' ? <Map className="h-7 w-7" /> : <Landmark className="h-7 w-7" />}
                  </div>
                </div>
                <div className="text-xl font-black" style={{ color: card.colors.primaryDark }}>{card.title}</div>
                <p className="mt-2 min-h-[54px] text-sm leading-relaxed text-[#526170]">{card.subtitle}</p>
                <div className="mt-5 inline-flex rounded-full px-4 py-2 text-sm font-black text-white" style={{ background: `linear-gradient(135deg, ${card.colors.primary}, ${card.colors.primaryDark})` }}>
                  {card.regionName} 스토리맵 열기
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}
