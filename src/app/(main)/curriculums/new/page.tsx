"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenText,
  Calculator,
  Check,
  FlaskConical,
  Globe2,
  HeartHandshake,
  Languages,
  Mic2,
  Palette,
  Sparkles,
  Star,
  WandSparkles,
} from 'lucide-react';
import { apiFetch, BACKEND_ORIGIN } from '@/lib/api';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { createCurriculum, draftGoals, type WeekGoalDraft } from '@/lib/curriculum';

type WeekCount = 2 | 4;

type CharacterCard = {
  id: number;
  name: string;
  category: string;
  imageUrl: string | null;
};

type CharacterDto = {
  id: number;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  image_url?: string | null;
  scope?: string | null;
};

const ageGroups = ['0-3세', '4-6세', '7-9세', '10-12세'];
const categoryOptions = ['과학', '도덕', '수학', '영어', '생활습관'];
const languages = ['한국어', 'English', '日本語', 'Français', 'Español', 'Deutsch', '中文'];
const translationLanguages = ['선택 안 함', ...languages];

const languageMap: Record<string, string> = {
  한국어: 'KO',
  English: 'EN',
  日本語: 'JA',
  Français: 'FR',
  Español: 'ES',
  Deutsch: 'DE',
  中文: 'ZH',
};

const artStylePresets = [
  { name: '수채화 꿈', color: 'from-blue-400 to-purple-400' },
  { name: '디지털 팝', color: 'from-pink-400 to-orange-400' },
  { name: '클래식 만화', color: 'from-yellow-400 to-red-400' },
  { name: '부드러운 파스텔', color: 'from-purple-300 to-pink-300' },
  { name: '대담하고 밝게', color: 'from-green-400 to-blue-400' },
  { name: '빈티지 동화책', color: 'from-amber-400 to-brown-400' },
  { name: '몽환적 구름', color: 'from-cyan-300 to-blue-300' },
  { name: '석양 빛', color: 'from-orange-300 to-pink-400' },
  { name: '사실적 일러스트', color: 'from-slate-400 to-gray-500' },
  { name: '미니멀 라인', color: 'from-gray-300 to-slate-400' },
];

const voiceOptions = [
  { key: 'default', label: '기본' },
  { key: 'male', label: '남성' },
  { key: 'female', label: '여성' },
  { key: 'child', label: '어린이' },
  { key: 'grandpa', label: '할아버지' },
  { key: 'grandma', label: '할머니' },
];

const categoryCardMeta: Record<string, { icon: typeof FlaskConical; color: string }> = {
  과학: { icon: FlaskConical, color: 'from-cyan-300 to-blue-300' },
  도덕: { icon: HeartHandshake, color: 'from-rose-300 to-orange-300' },
  수학: { icon: Calculator, color: 'from-violet-300 to-indigo-300' },
  영어: { icon: Languages, color: 'from-emerald-300 to-green-300' },
  생활습관: { icon: Star, color: 'from-amber-300 to-yellow-300' },
};

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
  const [selectedAge, setSelectedAge] = useState('4-6세');
  const [selectedLanguage, setSelectedLanguage] = useState('한국어');
  const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState('선택 안 함');
  const [weeks, setWeeks] = useState<WeekCount>(4);

  const [selectedArtStyle, setSelectedArtStyle] = useState<string | null>('수채화 꿈');
  const [voicePreset, setVoicePreset] = useState<string>('default');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>([]);
  const [globalCharacters, setGlobalCharacters] = useState<CharacterCard[]>([]);
  const [myCharacters, setMyCharacters] = useState<CharacterCard[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);

  const baseLanguageCode = useMemo(() => languageMap[selectedLanguage] || 'KO', [selectedLanguage]);
  const translationLanguageCode = useMemo(() => {
    if (selectedTranslationLanguage === '선택 안 함') {
      return undefined;
    }
    const mapped = languageMap[selectedTranslationLanguage];
    if (!mapped || mapped === baseLanguageCode) {
      return undefined;
    }
    return mapped;
  }, [selectedTranslationLanguage, baseLanguageCode]);

  const [goals, setGoals] = useState<WeekGoalDraft[]>(fallbackGoals(4, 'KO'));
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const normalizeImageUrl = (url?: string | null) => {
      if (!url) return null;
      if (/^https?:\/\//i.test(url)) return url;
      return `${BACKEND_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
    };

    const mapCharacter = (c: CharacterDto, fallbackCategory: string): CharacterCard => ({
      id: c.id,
      name: c.name,
      category: c.scope || fallbackCategory,
      imageUrl: normalizeImageUrl(c.imageUrl || c.image_url),
    });

    const loadCharacters = async () => {
      setIsLoadingCharacters(true);
      try {
        const globals = await apiFetch<CharacterDto[]>('/public/characters');
        if (mounted) {
          setGlobalCharacters((globals ?? []).slice(0, 10).map((c) => mapCharacter(c, '추천 캐릭터')));
        }
      } catch (err) {
        console.error('추천 캐릭터 불러오기 실패', err);
        if (mounted) {
          setGlobalCharacters([]);
        }
      }

      try {
        const mine = await apiFetch<CharacterDto[]>('/characters/me');
        if (mounted) {
          setMyCharacters((mine ?? []).slice(0, 10).map((c) => mapCharacter(c, '내 캐릭터')));
        }
      } catch (err) {
        console.error('내 캐릭터 불러오기 실패', err);
        if (mounted) {
          setMyCharacters([]);
        }
      } finally {
        if (mounted) {
          setIsLoadingCharacters(false);
        }
      }
    };

    loadCharacters();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleCharacter = (characterId: number) => {
    setSelectedCharacterIds((prev) => {
      if (prev.includes(characterId)) {
        return prev.filter((id) => id !== characterId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, characterId];
    });
  };

  const ensureGoalLength = (targetWeeks: WeekCount, languageCode: string) => {
    setGoals((prev) => {
      if (prev.length === targetWeeks) return prev;
      const fallback = fallbackGoals(targetWeeks, languageCode);
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
        ageRange: selectedAge,
        baseLanguage: baseLanguageCode,
        weeks,
        title,
      });
      if (!drafted || drafted.length === 0) {
        setGoals(fallbackGoals(weeks, baseLanguageCode));
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
      setGoals(fallbackGoals(weeks, baseLanguageCode));
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
        ageRange: selectedAge,
        baseLanguage: baseLanguageCode,
        translationLanguage: translationLanguageCode,
        weeks,
        generationMode: 'ON_DEMAND',
        defaultCharacterIds: selectedCharacterIds.slice(0, 2),
        defaultArtStyle: selectedArtStyle ?? undefined,
        defaultVoice: voicePreset !== 'default' ? voicePreset : undefined,
        weekGoals: payloadGoals,
      });

      router.push(`/curriculums/${created.id}`);
    } catch (err) {
      console.error(err);
      setError('커리큘럼 생성에 실패했습니다. 입력값을 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffef7_0%,_#f5fbff_42%,_#fff7ed_100%)] px-4 py-6 md:px-10 md:py-10">
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="pointer-events-none absolute -left-10 top-20 h-24 w-24 rounded-full bg-[#ffdf6f]/35 blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-8 h-28 w-28 rounded-full bg-[#9fe3ff]/45 blur-2xl" />

        <header className="mb-6 overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_45px_-25px_rgba(25,70,129,0.35)] backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#fff4cf] px-3 py-1 text-xs font-semibold text-[#875d02]">
                <WandSparkles className="h-4 w-4" />
                오늘의 미션
              </p>
              <h1 className="text-3xl font-black tracking-tight text-[#183b56]">내 동화 여행 만들기</h1>
              <p className="mt-2 text-sm text-[#4d6072]">
                카드만 눌러서 커리큘럼을 완성해요. 복잡한 입력 없이 바로 시작할 수 있어요.
              </p>
            </div>
            <div className="relative h-24 w-full max-w-[220px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#ffe79f] via-[#ffd7df] to-[#bce8ff] p-4">
              <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/35" />
              <BookOpenText className="h-7 w-7 text-[#27496c]" />
              <p className="mt-2 text-xs font-semibold text-[#27496c]">4주 모험 지도를 AI가 준비해줄게요</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#607286]">
            <span className="rounded-full bg-[#eef6ff] px-3 py-1">1. 테마 선택</span>
            <span className="rounded-full bg-[#eef6ff] px-3 py-1">2. 마법 계획 받기</span>
            <span className="rounded-full bg-[#eef6ff] px-3 py-1">3. 스타일 꾸미기</span>
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-7">
          <section className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_-22px_rgba(25,70,129,0.45)] md:p-6">
            <h2 className="mb-5 text-xl font-black text-[#16324f]">1. 어떤 여행을 만들까요?</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#2f4858]">
                커리큘럼 이름
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 별빛 과학 탐험대"
                  className="rounded-2xl border border-[#d9e4ef] bg-white px-4 py-3 font-medium outline-none transition focus:border-[#59a6ff]"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#2f4858]">
                세부 주제
                <input
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  placeholder="예: 물의 순환"
                  className="rounded-2xl border border-[#d9e4ef] bg-white px-4 py-3 font-medium outline-none transition focus:border-[#59a6ff]"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="mb-2.5 text-sm font-bold text-[#2f4858]">카테고리 선택</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {categoryOptions.map((option) => {
                  const meta = categoryCardMeta[option];
                  const Icon = meta.icon;
                  const selected = category === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCategory(option)}
                      className={`group rounded-2xl border p-3 text-left transition ${
                        selected
                          ? 'border-[#59a6ff] bg-[#edf6ff] shadow-[0_8px_20px_-16px_rgba(43,111,181,0.9)]'
                          : 'border-[#e4ecf4] bg-white hover:-translate-y-0.5 hover:border-[#b8d6f4]'
                      }`}
                    >
                      <div className={`mb-2 inline-flex rounded-xl bg-gradient-to-br ${meta.color} p-2 text-[#143147]`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-[#17324d]">{option}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2.5 text-sm font-bold text-[#2f4858]">연령대</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {ageGroups.map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setSelectedAge(age)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      selectedAge === age
                        ? 'border-[#59a6ff] bg-[#eef7ff] text-[#235586]'
                        : 'border-[#dfe8f0] bg-white text-[#355068] hover:border-[#bad5ef]'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2.5 text-sm font-bold text-[#2f4858]">생성 언어</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(language);
                        const nextLanguageCode = languageMap[language] || 'KO';
                        ensureGoalLength(weeks, nextLanguageCode);
                        if ((languageMap[selectedTranslationLanguage] || '') === nextLanguageCode) {
                          setSelectedTranslationLanguage('선택 안 함');
                        }
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selectedLanguage === language
                          ? 'border-[#5c8df6] bg-[#eef2ff] text-[#2340a0]'
                          : 'border-[#dfe7ef] bg-white text-[#37506a] hover:border-[#bad0e6]'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-sm font-bold text-[#2f4858]">번역 언어 (선택)</p>
                <div className="flex flex-wrap gap-2">
                  {translationLanguages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => setSelectedTranslationLanguage(language)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selectedTranslationLanguage === language
                          ? 'border-[#49b5dd] bg-[#e7f8ff] text-[#0d5f80]'
                          : 'border-[#dfe7ef] bg-white text-[#37506a] hover:border-[#bad0e6]'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2.5 text-sm font-bold text-[#2f4858]">기간 선택</p>
              <div className="grid max-w-lg grid-cols-2 gap-3">
                {[2, 4].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      const next = value as WeekCount;
                      setWeeks(next);
                      ensureGoalLength(next, baseLanguageCode);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      weeks === value
                        ? 'border-[#6b9cff] bg-[#eef4ff]'
                        : 'border-[#dfe8f0] bg-white hover:border-[#bbd3ea]'
                    }`}
                  >
                    <p className="text-base font-bold text-[#1f3f64]">{value}주 코스</p>
                    <p className="text-xs text-[#5d7287]">{value === 2 ? '짧고 빠른 집중 학습' : '차근차근 깊이 있는 학습'}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_-22px_rgba(25,70,129,0.45)] md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#16324f]">2. 주차별 목표 지도</h2>
                <p className="text-sm text-[#5a6e82]">버튼을 누르면 AI가 주차별 미션을 새롭게 추천해요.</p>
              </div>
              <button
                type="button"
                onClick={onClickDraft}
                disabled={loadingDraft}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffbd59] to-[#ff8f70] px-5 py-2.5 text-sm font-black text-[#3f2600] shadow-[0_14px_28px_-18px_rgba(240,133,64,0.8)] transition hover:brightness-105 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {loadingDraft ? '마법 계획 만드는 중...' : '마법 계획 받기'}
              </button>
            </div>

            <div className="space-y-3">
              {goals
                .slice(0, weeks)
                .sort((a, b) => a.weekNo - b.weekNo)
                .map((goal) => {
                  const subGoals = (goal.subGoals ?? []).slice(0, 2);
                  return (
                    <article
                      key={goal.weekNo}
                      className="group rounded-2xl border border-[#e2edf8] bg-[linear-gradient(180deg,#ffffff, #f8fbff)] p-4 transition hover:border-[#b6d4f4]"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f2ff] text-sm font-black text-[#25527b]">
                          {goal.weekNo}
                        </span>
                        <p className="text-sm font-black text-[#234665]">Week {goal.weekNo} 미션</p>
                      </div>
                      <input
                        value={goal.primaryGoal}
                        onChange={(e) => updateGoal(goal.weekNo, 'primaryGoal', e.target.value)}
                        placeholder="이번 주 핵심 목표"
                        className="mb-2 w-full rounded-xl border border-[#d7e4f0] bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-[#66a8e7]"
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
                            placeholder={`보조 목표 ${idx + 1} (선택)`}
                            className="rounded-xl border border-[#d7e4f0] bg-white px-3 py-2.5 text-sm font-medium outline-none transition focus:border-[#66a8e7]"
                          />
                        ))}
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_-22px_rgba(25,70,129,0.45)] md:p-6">
            <h2 className="mb-4 text-xl font-black text-[#16324f]">3. 캐릭터와 스타일 꾸미기</h2>

            <div className="mb-5">
              <p className="mb-2.5 inline-flex items-center gap-2 text-sm font-bold text-[#2f4858]">
                <Mic2 className="h-4 w-4" /> 음성 선택
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                {voiceOptions.map((voice) => (
                  <button
                    key={voice.key}
                    type="button"
                    onClick={() => setVoicePreset(voice.key)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      voicePreset === voice.key
                        ? 'border-[#6ca2ff] bg-[#eef4ff] text-[#244588]'
                        : 'border-[#dfe7ef] bg-white text-[#355068] hover:border-[#b8cfe7]'
                    }`}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-2.5 inline-flex items-center gap-2 text-sm font-bold text-[#2f4858]">
                <Palette className="h-4 w-4" /> 아트 스타일
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {artStylePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedArtStyle(preset.name)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selectedArtStyle === preset.name
                        ? 'border-[#6ca2ff] bg-[#f0f6ff] shadow-[0_12px_26px_-20px_rgba(56,120,212,0.9)]'
                        : 'border-[#e2ebf4] bg-white hover:border-[#bed2e8]'
                    }`}
                  >
                    <div className={`mb-2 h-14 rounded-xl bg-gradient-to-br ${preset.color}`} />
                    <p className="text-xs font-bold text-[#1e3e5e]">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-2 text-sm font-bold text-[#2f4858]">
                  <Globe2 className="h-4 w-4" /> 캐릭터 스티커 보드
                </p>
                <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#35577a]">
                  {selectedCharacterIds.length}/2 선택
                </span>
              </div>

              {isLoadingCharacters ? (
                <p className="rounded-xl border border-dashed border-[#cdddec] bg-[#f8fbff] px-4 py-3 text-sm text-[#62809d]">
                  캐릭터 불러오는 중...
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#637a91]">추천 캐릭터</p>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                      {globalCharacters.map((character) => {
                        const selected = selectedCharacterIds.includes(character.id);
                        return (
                          <button
                            key={`global-${character.id}`}
                            type="button"
                            onClick={() => toggleCharacter(character.id)}
                            className={`relative overflow-hidden rounded-2xl border text-left transition ${
                              selected
                                ? 'border-[#5d95ff] bg-[#eef4ff] shadow-[0_12px_26px_-20px_rgba(56,120,212,0.9)]'
                                : 'border-[#dfe8f0] bg-white hover:border-[#b8d0e7]'
                            }`}
                          >
                            {selected && (
                              <span className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2f72d2] text-white">
                                <Check className="h-4 w-4" />
                              </span>
                            )}
                            <div className="h-28 bg-[#eff5fb]">
                              <ImageWithFallback
                                src={character.imageUrl ?? undefined}
                                alt={character.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="p-2.5">
                              <p className="truncate text-xs font-bold text-[#1a3e61]">{character.name}</p>
                              <p className="truncate text-[11px] text-[#68839d]">{character.category}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#637a91]">내 캐릭터</p>
                    {myCharacters.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[#cdddec] bg-[#f8fbff] px-4 py-3 text-xs text-[#62809d]">
                        등록된 내 캐릭터가 없어요.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        {myCharacters.map((character) => {
                          const selected = selectedCharacterIds.includes(character.id);
                          return (
                            <button
                              key={`mine-${character.id}`}
                              type="button"
                              onClick={() => toggleCharacter(character.id)}
                              className={`relative overflow-hidden rounded-2xl border text-left transition ${
                                selected
                                  ? 'border-[#5d95ff] bg-[#eef4ff] shadow-[0_12px_26px_-20px_rgba(56,120,212,0.9)]'
                                  : 'border-[#dfe8f0] bg-white hover:border-[#b8d0e7]'
                              }`}
                            >
                              {selected && (
                                <span className="absolute right-2 top-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2f72d2] text-white">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                              <div className="h-28 bg-[#eff5fb]">
                                <ImageWithFallback
                                  src={character.imageUrl ?? undefined}
                                  alt={character.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="p-2.5">
                                <p className="truncate text-xs font-bold text-[#1a3e61]">{character.name}</p>
                                <p className="truncate text-[11px] text-[#68839d]">{character.category}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/curriculums"
              className="rounded-full border border-[#c9d9e9] bg-white px-5 py-2.5 text-sm font-semibold text-[#385471] hover:bg-[#f4f9ff]"
            >
              목록으로
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#5fa8ff] to-[#7b7dff] px-5 py-2.5 text-sm font-black text-white shadow-[0_16px_30px_-20px_rgba(66,103,210,0.9)] transition hover:brightness-110 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {submitting ? '출발 준비 중...' : '내 동화 여행 시작!'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
