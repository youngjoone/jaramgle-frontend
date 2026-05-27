"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  cancelWeek,
  generateWeek,
  getCurriculum,
  regenerateWeek,
  retryWeek,
  updateWeekGoal,
  type CurriculumDetail,
  type CurriculumWeek,
  type WeekStatus,
} from '@/lib/curriculum';

const completedStatuses: WeekStatus[] = ['SUCCEEDED', 'PARTIAL_SUCCEEDED', 'SKIPPED'];

type EditState = {
  primaryGoal: string;
  subGoals: string[];
};

function statusLabel(status: WeekStatus) {
  switch (status) {
    case 'NOT_STARTED':
      return '대기';
    case 'PENDING':
      return '큐 대기';
    case 'RUNNING':
      return '생성 중';
    case 'SUCCEEDED':
      return '완료';
    case 'PARTIAL_SUCCEEDED':
      return '부분 완료';
    case 'FAILED':
      return '실패';
    case 'FAILED_TIMEOUT':
      return '타임아웃';
    case 'SKIPPED':
      return '건너뜀';
    default:
      return status;
  }
}

function canEdit(status: WeekStatus) {
  return status === 'NOT_STARTED' || status === 'PENDING';
}

function isPollTarget(status: WeekStatus) {
  return status === 'PENDING' || status === 'RUNNING';
}

function isUnlocked(weeks: CurriculumWeek[], weekNo: number) {
  if (weekNo <= 1) return true;
  const prev = weeks.find((week) => week.weekNo === weekNo - 1);
  return !!prev && completedStatuses.includes(prev.status);
}

function statusColor(status: WeekStatus) {
  if (status === 'SUCCEEDED' || status === 'PARTIAL_SUCCEEDED') return 'text-[#2E7D32] bg-[#E8F5E9]';
  if (status === 'FAILED' || status === 'FAILED_TIMEOUT') return 'text-red-700 bg-red-50';
  if (status === 'RUNNING' || status === 'PENDING') return 'text-[#8D6E63] bg-[#FBE9E7]';
  if (status === 'SKIPPED') return 'text-[#6D4C41] bg-[#EFEBE9]';
  return 'text-[#5A6E49] bg-[#F1F8E9]';
}

function parseApiError(err: unknown): { code?: string; message?: string } {
  if (err instanceof Error) {
    const raw = err.message;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          code: (parsed as { code?: string }).code,
          message: (parsed as { message?: string }).message,
        };
      }
    } catch {
      // ignore JSON parse failure
    }
    return { message: raw };
  }
  return {};
}

function findInsufficientHeartsMessage(detail: CurriculumDetail): string | null {
  const failedWeek = detail.weekItems.find((week) =>
    (week.status === 'FAILED' || week.status === 'FAILED_TIMEOUT') &&
    (
      week.latestJob?.errorCode === 'INSUFFICIENT_HEARTS'
      || (week.latestJob?.errorMessage ?? '').includes('하트')
    )
  );
  return failedWeek?.latestJob?.errorMessage ?? (failedWeek ? '하트가 부족합니다. 충전이 필요해요.' : null);
}

export default function CurriculumDetailPage() {
  const routeParams = useParams<{ id?: string | string[] }>();
  const router = useRouter();
  const routeId = Array.isArray(routeParams?.id) ? routeParams.id[0] : routeParams?.id;
  const curriculumId = Number(routeId);
  const [detail, setDetail] = useState<CurriculumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyWeek, setActionBusyWeek] = useState<number | null>(null);
  const [editStates, setEditStates] = useState<Record<number, EditState>>({});

  const load = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getCurriculum(curriculumId);
      const insufficientHeartsMessage = findInsufficientHeartsMessage(data);
      if (insufficientHeartsMessage) {
        setError(insufficientHeartsMessage);
        router.push('/subscription');
        return;
      }
      setDetail(data);
      setError(null);
      setEditStates((prev) => {
        const next = { ...prev };
        data.weekItems.forEach((week) => {
          if (!next[week.weekNo]) {
            next[week.weekNo] = {
              primaryGoal: week.primaryGoal,
              subGoals: [...(week.subGoals ?? [])],
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError('커리큘럼 상세를 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!routeId || !Number.isFinite(curriculumId)) {
      setError('잘못된 커리큘럼 ID입니다.');
      setLoading(false);
      return;
    }
    load(true);
  }, [curriculumId, routeId]);

  const shouldPoll = useMemo(() => {
    if (!detail) return false;
    return detail.weekItems.some((week) => isPollTarget(week.status));
  }, [detail]);

  useEffect(() => {
    if (!shouldPoll) return;
    let intervalId: number | null = null;

    const refresh = () => {
      void load(false);
    };

    const applyInterval = () => {
      const delay = document.visibilityState === 'visible' ? 5000 : 10000;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      intervalId = window.setInterval(refresh, delay);
    };

    applyInterval();
    const handleVisibilityChange = () => applyInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [shouldPoll, curriculumId]);

  const runWeekAction = async (weekNo: number, action: 'generate' | 'retry' | 'regenerate' | 'cancel') => {
    if (!detail) return;
    setActionBusyWeek(weekNo);
    setError(null);
    try {
      if (action === 'generate') await generateWeek(detail.id, weekNo);
      if (action === 'retry') await retryWeek(detail.id, weekNo);
      if (action === 'regenerate') await regenerateWeek(detail.id, weekNo);
      if (action === 'cancel') await cancelWeek(detail.id, weekNo);
      await load(false);
    } catch (err: unknown) {
      console.error(err);
      const parsed = parseApiError(err);
      if (parsed.code === 'INSUFFICIENT_HEARTS' || (parsed.message ?? '').includes('하트')) {
        setError(parsed.message || '하트가 부족합니다. 충전이 필요해요.');
        router.push('/subscription');
        return;
      }
      setError(parsed.message || '요청 처리에 실패했습니다.');
    } finally {
      setActionBusyWeek(null);
    }
  };

  const saveGoal = async (weekNo: number) => {
    if (!detail) return;
    const state = editStates[weekNo];
    if (!state) return;

    setActionBusyWeek(weekNo);
    setError(null);
    try {
      await updateWeekGoal(detail.id, weekNo, {
        primaryGoal: state.primaryGoal,
        subGoals: (state.subGoals ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 2),
      });
      await load(false);
    } catch (err) {
      console.error(err);
      setError('주차 목표 저장에 실패했습니다.');
    } finally {
      setActionBusyWeek(null);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#F9FBE7] p-6">불러오는 중...</main>;
  }

  if (error && !detail) {
    return (
      <main className="min-h-screen bg-[#F9FBE7] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-red-700 shadow-sm">{error}</div>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="min-h-screen bg-[#F9FBE7] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-[#4E6A3D] shadow-sm">커리큘럼을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const completedCount = detail.weekItems.filter((week) => completedStatuses.includes(week.status)).length;
  const progress = detail.weeks > 0 ? Math.round((completedCount / detail.weeks) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#F9FBE7] px-4 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#558B2F]">커리큘럼 상세</p>
              <h1 className="text-2xl font-bold text-[#1B5E20]">{detail.title}</h1>
              <p className="mt-1 text-sm text-[#5A6E49]">
                {detail.category}
                {detail.subTopic ? ` · ${detail.subTopic}` : ''}
                {detail.ageRange ? ` · ${detail.ageRange}` : ''}
                {` · ${detail.baseLanguage}`}
                {detail.translationLanguage ? ` → ${detail.translationLanguage}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/curriculums" className="rounded-lg border border-[#A5D6A7] px-3 py-1.5 text-sm font-semibold text-[#2E7D32] hover:bg-[#F1F8E9]">
                목록
              </Link>
              <button
                type="button"
                onClick={() => load(false)}
                className="rounded-lg border border-[#A5D6A7] px-3 py-1.5 text-sm font-semibold text-[#2E7D32] hover:bg-[#F1F8E9]"
              >
                새로고침
              </button>
            </div>
          </div>

          <div className="mb-1 flex items-center justify-between text-xs text-[#607D3B]">
            <span>{completedCount}/{detail.weeks}주 완료</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#E8F5E9]">
            <div className="h-2 rounded-full bg-[#66BB6A]" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="space-y-4">
          {detail.weekItems
            .slice()
            .sort((a, b) => a.weekNo - b.weekNo)
            .map((week) => {
              const unlocked = isUnlocked(detail.weekItems, week.weekNo);
              const isBusy = actionBusyWeek === week.weekNo;
              const editable = canEdit(week.status);
              const state = editStates[week.weekNo] ?? {
                primaryGoal: week.primaryGoal,
                subGoals: [...(week.subGoals ?? [])],
              };

              return (
                <article key={week.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-[#1B5E20]">Week {week.weekNo}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(week.status)}`}>
                      {statusLabel(week.status)}
                    </span>
                  </div>

                  {editable ? (
                    <div className="space-y-2">
                      <input
                        value={state.primaryGoal}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditStates((prev) => ({
                            ...prev,
                            [week.weekNo]: { ...state, primaryGoal: value },
                          }));
                        }}
                        className="w-full rounded-lg border border-[#C8E6C9] px-3 py-2 text-sm outline-none focus:border-[#66BB6A]"
                      />
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {[0, 1].map((idx) => (
                          <input
                            key={idx}
                            value={state.subGoals[idx] ?? ''}
                            onChange={(e) => {
                              const next = [...(state.subGoals ?? [])];
                              next[idx] = e.target.value;
                              setEditStates((prev) => ({
                                ...prev,
                                [week.weekNo]: { ...state, subGoals: next.slice(0, 2) },
                              }));
                            }}
                            placeholder={`subGoal ${idx + 1} (선택)`}
                            className="rounded-lg border border-[#C8E6C9] px-3 py-2 text-sm outline-none focus:border-[#66BB6A]"
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => saveGoal(week.weekNo)}
                        disabled={isBusy}
                        className="rounded-lg border border-[#A5D6A7] px-3 py-1.5 text-xs font-semibold text-[#2E7D32] hover:bg-[#F1F8E9] disabled:opacity-60"
                      >
                        목표 저장
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-[#33691E]">{week.primaryGoal}</p>
                      {(week.subGoals ?? []).length > 0 && (
                        <ul className="mt-1 list-disc pl-5 text-sm text-[#5A6E49]">
                          {week.subGoals.map((goal, idx) => (
                            <li key={idx}>{goal}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {week.continuityStale && (
                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      이전 주차가 변경되어 연속성 갱신이 필요합니다. 재생성을 권장합니다.
                    </p>
                  )}

                  {week.latestJob?.errorMessage && (week.status === 'FAILED' || week.status === 'FAILED_TIMEOUT') && (
                    <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {week.latestJob.errorMessage}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {week.status === 'NOT_STARTED' && unlocked && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => runWeekAction(week.weekNo, 'generate')}
                        className="rounded-lg bg-[#66BB6A] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#57A95A] disabled:opacity-60"
                      >
                        {isBusy ? '요청 중...' : '주차 생성'}
                      </button>
                    )}

                    {week.status === 'NOT_STARTED' && !unlocked && (
                      <span className="text-xs text-[#6A8060]">이전 주차 완료 후 생성 가능</span>
                    )}

                    {week.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => runWeekAction(week.weekNo, 'cancel')}
                        className="rounded-lg border border-[#B0BEC5] px-3 py-1.5 text-sm font-semibold text-[#455A64] hover:bg-[#ECEFF1] disabled:opacity-60"
                      >
                        {isBusy ? '처리 중...' : '대기 취소'}
                      </button>
                    )}

                    {(week.status === 'FAILED' || week.status === 'FAILED_TIMEOUT') && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => runWeekAction(week.weekNo, 'retry')}
                        className="rounded-lg bg-[#F57C00] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#E66E00] disabled:opacity-60"
                      >
                        {isBusy ? '요청 중...' : '재시도'}
                      </button>
                    )}

                    {(week.status === 'SUCCEEDED' || week.status === 'PARTIAL_SUCCEEDED') && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => runWeekAction(week.weekNo, 'regenerate')}
                        className="rounded-lg border border-[#66BB6A] px-3 py-1.5 text-sm font-semibold text-[#2E7D32] hover:bg-[#F1F8E9] disabled:opacity-60"
                      >
                        {isBusy ? '요청 중...' : '재생성(유료)'}
                      </button>
                    )}

                    {week.storyId ? (
                      <span className="text-xs text-[#6A8060]">Story #{week.storyId} 생성됨</span>
                    ) : null}
                  </div>
                </article>
              );
            })}
        </section>
      </div>
    </main>
  );
}
