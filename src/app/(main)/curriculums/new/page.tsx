"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCurriculum, draftGoals, type WeekGoalDraft } from '@/lib/curriculum';

type WeekCount = 2 | 4;

const categoryOptions = ['과학', '도덕', '수학', '영어', '생활습관'];
const languageOptions = ['KO', 'EN', 'JA', 'FR', 'ES', 'DE', 'ZH'];

function fallbackGoals(weeks: WeekCount, baseLanguage: string): WeekGoalDraft[] {
  const ko = baseLanguage.toUpperCase() === 'KO';
  return Array.from({ length: weeks }).map((_, index) => {
    const weekNo = index + 1;
    return {
      weekNo,
      primaryGoal: ko ? `${weekNo}주차 목표` : `Week ${weekNo} Goal`,
      subGoals: [],
    };
  });
}

export default function NewCurriculumPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('과학');
  const [subTopic, setSubTopic] = useState('');
  const [ageRange, setAgeRange] = useState('5-7');
  const [baseLanguage, setBaseLanguage] = useState('KO');
  const [weeks, setWeeks] = useState<WeekCount>(4);

  const [defaultArtStyle, setDefaultArtStyle] = useState('');
  const [defaultVoice, setDefaultVoice] = useState('');
  const [characterIdsInput, setCharacterIdsInput] = useState('');

  const [goals, setGoals] = useState<WeekGoalDraft[]>(fallbackGoals(4, 'KO'));
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedCharacterIds = useMemo(() => {
    return characterIdsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number(item))
      .filter((value) => Number.isFinite(value));
  }, [characterIdsInput]);

  const ensureGoalLength = (targetWeeks: WeekCount, language: string) => {
    setGoals((prev) => {
      if (prev.length === targetWeeks) return prev;
      const fallback = fallbackGoals(targetWeeks, language);
      const byWeek = new Map(prev.map((goal) => [goal.weekNo, goal]));
      return fallback.map((goal) => byWeek.get(goal.weekNo) ?? goal);
    });
  };

  const onClickDraft = async () => {
    setLoadingDraft(true);
    setError(null);
    try {
      const drafted = await draftGoals({
        category,
        subTopic,
        ageRange,
        baseLanguage,
        weeks,
        title,
      });
      if (!drafted || drafted.length === 0) {
        setGoals(fallbackGoals(weeks, baseLanguage));
      } else {
        const normalized = drafted
          .map((goal) => ({
            weekNo: Number(goal.weekNo),
            primaryGoal: goal.primaryGoal || '',
            subGoals: (goal.subGoals ?? []).slice(0, 2),
          }))
          .sort((a, b) => a.weekNo - b.weekNo);
        setGoals(normalized);
      }
    } catch (err) {
      console.error(err);
      setGoals(fallbackGoals(weeks, baseLanguage));
      setError('AI 초안 생성에 실패해 기본 템플릿으로 채웠습니다.');
    } finally {
      setLoadingDraft(false);
    }
  };

  const updateGoal = (weekNo: number, key: 'primaryGoal' | 'subGoals', value: string | string[]) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.weekNo !== weekNo) return goal;
        if (key === 'primaryGoal') {
          return { ...goal, primaryGoal: String(value) };
        }
        return { ...goal, subGoals: value as string[] };
      })
    );
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payloadGoals = goals
        .slice(0, weeks)
        .sort((a, b) => a.weekNo - b.weekNo)
        .map((goal) => ({
          weekNo: goal.weekNo,
          primaryGoal: goal.primaryGoal.trim(),
          subGoals: (goal.subGoals ?? []).map((sub) => sub.trim()).filter(Boolean).slice(0, 2),
        }));

      const created = await createCurriculum({
        title: title.trim() || `${weeks}주 ${subTopic || category}`,
        category,
        subTopic: subTopic.trim() || undefined,
        ageRange: ageRange.trim() || undefined,
        baseLanguage,
        weeks,
        generationMode: 'ON_DEMAND',
        defaultCharacterIds: parsedCharacterIds.slice(0, 2),
        defaultArtStyle: defaultArtStyle.trim() || undefined,
        defaultVoice: defaultVoice.trim() || undefined,
        weekGoals: payloadGoals,
      });

      router.push(`/curriculums/${created.id}`);
    } catch (err: any) {
      console.error(err);
      setError('커리큘럼 생성에 실패했습니다. 입력값을 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F9FBE7] px-4 py-6 md:px-10 md:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B5E20]">커리큘럼 만들기</h1>
          <Link href="/curriculums" className="text-sm font-semibold text-[#2E7D32] hover:underline">
            목록으로
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-[#2E7D32]">1. 기본 정보</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                제목
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 4주 기본 과학"
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                카테고리
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                세부 주제
                <input
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  placeholder="예: 물의 순환"
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                연령대
                <input
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  placeholder="예: 5-7"
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                언어
                <select
                  value={baseLanguage}
                  onChange={(e) => {
                    const next = e.target.value;
                    setBaseLanguage(next);
                    ensureGoalLength(weeks, next);
                  }}
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                >
                  {languageOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                기간
                <select
                  value={weeks}
                  onChange={(e) => {
                    const next = Number(e.target.value) as WeekCount;
                    setWeeks(next);
                    ensureGoalLength(next, baseLanguage);
                  }}
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                >
                  <option value={2}>2주</option>
                  <option value={4}>4주</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2E7D32]">2. 주차별 목표</h2>
              <button
                type="button"
                onClick={onClickDraft}
                disabled={loadingDraft}
                className="rounded-lg border border-[#A5D6A7] px-3 py-1.5 text-sm font-semibold text-[#2E7D32] hover:bg-[#F1F8E9] disabled:opacity-60"
              >
                {loadingDraft ? '초안 생성중...' : '주차 목표 자동 생성'}
              </button>
            </div>

            <div className="space-y-3">
              {goals
                .slice(0, weeks)
                .sort((a, b) => a.weekNo - b.weekNo)
                .map((goal) => {
                  const subGoals = (goal.subGoals ?? []).slice(0, 2);
                  return (
                    <article key={goal.weekNo} className="rounded-xl border border-[#E8F5E9] bg-[#FAFFF5] p-3">
                      <p className="mb-2 text-sm font-semibold text-[#33691E]">Week {goal.weekNo}</p>
                      <input
                        value={goal.primaryGoal}
                        onChange={(e) => updateGoal(goal.weekNo, 'primaryGoal', e.target.value)}
                        placeholder="주차 핵심 목표"
                        className="mb-2 w-full rounded-lg border border-[#C8E6C9] px-3 py-2 text-sm outline-none focus:border-[#66BB6A]"
                      />

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {[0, 1].map((idx) => (
                          <input
                            key={idx}
                            value={subGoals[idx] ?? ''}
                            onChange={(e) => {
                              const next = [...subGoals];
                              next[idx] = e.target.value;
                              updateGoal(goal.weekNo, 'subGoals', next.map((item) => item ?? '').slice(0, 2));
                            }}
                            placeholder={`subGoal ${idx + 1} (선택)`}
                            className="w-full rounded-lg border border-[#C8E6C9] px-3 py-2 text-sm outline-none focus:border-[#66BB6A]"
                          />
                        ))}
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-[#2E7D32]">3. 기본 스타일(선택)</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                기본 아트스타일
                <input
                  value={defaultArtStyle}
                  onChange={(e) => setDefaultArtStyle(e.target.value)}
                  placeholder="예: watercolor"
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#4E6A3D]">
                기본 음성
                <input
                  value={defaultVoice}
                  onChange={(e) => setDefaultVoice(e.target.value)}
                  placeholder="예: warm_female"
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-1 text-sm text-[#4E6A3D]">
                기본 캐릭터 ID (쉼표 구분, 최대 2개)
                <input
                  value={characterIdsInput}
                  onChange={(e) => setCharacterIdsInput(e.target.value)}
                  placeholder="예: 12, 34"
                  className="rounded-lg border border-[#C8E6C9] px-3 py-2 outline-none focus:border-[#66BB6A]"
                />
              </label>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Link href="/curriculums" className="rounded-xl border border-[#A5D6A7] px-4 py-2 text-sm font-semibold text-[#2E7D32] hover:bg-[#F1F8E9]">
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#66BB6A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#57A95A] disabled:opacity-60"
            >
              {submitting ? '생성 중...' : '커리큘럼 생성'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
