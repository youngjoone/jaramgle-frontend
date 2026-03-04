"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { listCurriculums, type CurriculumSummary } from '@/lib/curriculum';

function statusLabel(status: CurriculumSummary['status']) {
  switch (status) {
    case 'DRAFT':
      return '준비중';
    case 'COMPLETED':
      return '완료';
    default:
      return '진행중';
  }
}

export default function CurriculumsPage() {
  const [items, setItems] = useState<CurriculumSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCurriculums();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('커리큘럼 목록을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalProgress = useMemo(() => {
    if (items.length === 0) return 0;
    const totalWeeks = items.reduce((acc, item) => acc + item.weeks, 0);
    const doneWeeks = items.reduce((acc, item) => acc + item.completedWeeks, 0);
    if (totalWeeks === 0) return 0;
    return Math.round((doneWeeks / totalWeeks) * 100);
  }, [items]);

  return (
    <main className="min-h-screen bg-[#F9FBE7] px-4 py-6 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[#558B2F]">학습 시리즈</p>
            <h1 className="text-2xl font-bold text-[#1B5E20]">커리큘럼</h1>
            <p className="mt-1 text-sm text-[#4E6A3D]">전체 진행률 {totalProgress}%</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="rounded-xl border border-[#AED581] px-4 py-2 text-sm font-semibold text-[#33691E] hover:bg-[#F1F8E9]"
            >
              새로고침
            </button>
            <Link
              href="/curriculums/new"
              className="rounded-xl bg-[#66BB6A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#57A95A]"
            >
              커리큘럼 만들기
            </Link>
          </div>
        </header>

        {loading ? (
          <section className="rounded-2xl bg-white p-8 text-center text-[#4E6A3D] shadow-sm">불러오는 중...</section>
        ) : error ? (
          <section className="rounded-2xl bg-white p-8 text-center text-red-600 shadow-sm">{error}</section>
        ) : items.length === 0 ? (
          <section className="rounded-2xl bg-white p-8 text-center text-[#4E6A3D] shadow-sm">
            아직 커리큘럼이 없습니다. 첫 커리큘럼을 만들어 보세요.
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => {
              const progress = item.weeks > 0 ? Math.round((item.completedWeeks / item.weeks) * 100) : 0;
              return (
                <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1B5E20]">{item.title}</h2>
                      <p className="mt-1 text-xs text-[#5A6E49]">
                        {item.category}
                        {item.subTopic ? ` · ${item.subTopic}` : ''}
                        {item.ageRange ? ` · ${item.ageRange}` : ''}
                        {` · ${item.baseLanguage}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F1F8E9] px-2.5 py-1 text-xs font-semibold text-[#558B2F]">
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-[#607D3B]">
                      <span>{item.completedWeeks}/{item.weeks}주 완료</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E8F5E9]">
                      <div
                        className="h-2 rounded-full bg-[#66BB6A] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#6A8060]">
                      {item.nextWeekToGenerate ? `다음 생성: ${item.nextWeekToGenerate}주차` : '모든 주차 완료'}
                    </p>
                    <Link
                      href={`/curriculums/${item.id}`}
                      className="rounded-lg border border-[#A5D6A7] px-3 py-1.5 text-sm font-semibold text-[#2E7D32] hover:bg-[#F1F8E9]"
                    >
                      상세 보기
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
