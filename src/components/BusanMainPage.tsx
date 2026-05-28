"use client";

import { Compass, Globe2, Landmark, Sailboat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { BACKEND_ORIGIN } from '@/lib/api';

const missionCards = [
  {
    id: 'CITY_INTRO',
    title: '부산 도시 소개',
    description: '바다, 다리, 시장, 골목 등 부산의 매력을 아이 시선으로 소개해요.',
    icon: Compass,
    accent: 'from-[#00ACC1] to-[#0288D1]',
  },
  {
    id: 'HERITAGE',
    title: '문화유산 탐험',
    description: '부산의 역사와 장소 이야기를 모험 구조로 쉽게 풀어내요.',
    icon: Landmark,
    accent: 'from-[#26A69A] to-[#00897B]',
  },
  {
    id: 'MULTICULTURAL',
    title: '다문화 우정 이야기',
    description: '서로 다른 배경의 친구들이 부산에서 함께 배우고 즐기는 동화를 만들어요.',
    icon: Globe2,
    accent: 'from-[#4DB6AC] to-[#00ACC1]',
  },
] as const;

export function BusanMainPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#E1F5FE_0%,#B3E5FC_35%,#E0F7FA_70%,#F5FBFF_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[36px] border border-[#81D4FA]/70 bg-white/75 p-8 shadow-[0_25px_50px_rgba(2,136,209,0.16)] backdrop-blur md:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#4FC3F7]/25 blur-3xl" />
          <div className="absolute -bottom-24 left-6 h-72 w-72 rounded-full bg-[#80DEEA]/20 blur-3xl" />

          <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4FC3F7]/40 bg-[#E1F5FE] px-4 py-1 text-sm font-semibold text-[#0277BD]">
                <Sailboat className="h-4 w-4" />
                Jaramgle × Busan
              </div>
              <h1 className="text-4xl font-black leading-tight text-[#01579B] md:text-5xl" style={{ fontFamily: "'Jua', 'Do Hyeon', sans-serif" }}>
                부산 공모전
                <br />
                동화 스튜디오
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#336E7B] md:text-base">
                기존 동화 생성과 분리된 부산 전용 작업 공간입니다. 공모전 목적에 맞춰
                부산 소개, 문화유산, 다문화 주제를 집중적으로 생성할 수 있어요.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className="rounded-full bg-gradient-to-r from-[#039BE5] to-[#0288D1] px-8 py-6 text-white shadow-[0_10px_24px_rgba(2,136,209,0.35)] hover:from-[#0277BD] hover:to-[#01579B]"
                  onClick={() => router.push('/busan/create')}
                >
                  부산 동화책 생성 시작
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-[#4FC3F7] bg-white/70 px-7 py-6 text-[#0277BD] hover:bg-[#E1F5FE]"
                  onClick={() => router.push('/library')}
                >
                  기본 서비스로 돌아가기
                </Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mx-auto w-full max-w-[320px] rounded-[32px] border border-[#B3E5FC] bg-gradient-to-b from-white to-[#E1F5FE] p-5 shadow-lg"
            >
              <div className="mb-3 text-sm font-semibold text-[#0277BD]">부산 공식 캐릭터</div>
              <div className="rounded-3xl bg-[#E0F7FA] p-4">
                <ImageWithFallback
                  src={`${BACKEND_ORIGIN}/characters/busan-boogi.png`}
                  alt="부산 마스코트 부기"
                  className="h-64 w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {missionCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.button
                type="button"
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                onClick={() => router.push(`/busan/create?theme=${card.id}`)}
                className="group rounded-[28px] border border-[#B3E5FC] bg-white/80 p-6 text-left shadow-[0_10px_24px_rgba(2,136,209,0.12)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(2,136,209,0.2)]"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-xl font-bold text-[#01579B]" style={{ fontFamily: "'Jua', 'Do Hyeon', sans-serif" }}>
                  {card.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#336E7B]">{card.description}</p>
                <div className="mt-4 text-sm font-semibold text-[#0288D1] group-hover:text-[#01579B]">이 미션으로 만들기 →</div>
              </motion.button>
            );
          })}
        </section>
      </div>
    </div>
  );
}
