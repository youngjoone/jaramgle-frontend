"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Database, Languages, Loader2, MapPin, Sailboat, Search, Sparkles, Wand2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { BACKEND_ORIGIN, apiFetch } from '@/lib/api';
import { GenerationLoading } from '@/components/GenerationLoading';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

const themes = {
  CITY_INTRO: {
    label: '부산 도시 소개',
    topics: ['부산 도시 소개', '부산 명소 탐험'],
    objectives: ['부산의 상징 공간을 친근하게 이해하기', '도시의 매력을 긍정적으로 인식하기'],
    moral: '우리가 사는 도시를 아끼고 함께 즐기자.',
    promptDirectives: [
      '부산 공식 캐릭터 부기가 매 페이지의 핵심 행동에 참여한다.',
      '선택된 부산 명소를 배경으로 도시의 특징(바다, 다리, 시장, 골목)을 자연스럽게 소개한다.',
    ],
    requiredAnchors: ['부산 공식 캐릭터 부기'],
  },
  HERITAGE: {
    label: '부산 문화유산 탐험',
    topics: ['부산 문화유산', '역사 탐험'],
    objectives: ['문화유산의 배경을 쉽고 재미있게 이해하기', '과거와 현재를 연결해 생각하기'],
    moral: '역사를 알면 오늘의 도시를 더 소중히 볼 수 있어요.',
    promptDirectives: [
      '부산 공식 캐릭터 부기가 문화유산의 역사 배경을 어린이 눈높이로 설명한다.',
      '최소 1개 이상의 역사적 사실/유래를 서사에 녹여 사실 기반 학습이 되게 한다.',
    ],
    requiredAnchors: ['부산 공식 캐릭터 부기', '부산 역사/문화유산 정보'],
  },
  MULTICULTURAL: {
    label: '부산 다문화 우정',
    topics: ['다문화 존중', '우정과 협력'],
    objectives: ['다양한 문화 배경의 친구를 존중하기', '서로 다른 관점을 협력으로 연결하기'],
    moral: '다름은 벽이 아니라 함께 배우는 다리예요.',
    promptDirectives: [
      '부산 공식 캐릭터 부기와 함께 다양한 문화권의 어린이 2명 이상이 등장해 협력 문제 해결을 한다.',
      '고정관념 없이 서로의 언어/음식/놀이 문화를 존중하는 장면을 반드시 포함한다.',
    ],
    requiredAnchors: ['부산 공식 캐릭터 부기', '다양한 문화권 어린이'],
  },
} as const;

type ThemeKey = keyof typeof themes;

type BusanAttractionSource = {
  sourceId: string;
  title: string;
  district: string;
  subtitle: string;
  intro: string;
  feature: string;
  origin: string;
  storyContext: string;
  address: string;
  thumbnailUrl: string;
  imageUrl: string;
  photoTitle: string;
  photoLocation: string;
  photoKeywords: string;
  dataSources: string;
  lat: number | null;
  lng: number | null;
};

type BusanAttractionRaw = {
  source_id?: string | null;
  sourceId?: string | null;
  title?: string | null;
  district?: string | null;
  subtitle?: string | null;
  intro?: string | null;
  feature?: string | null;
  origin?: string | null;
  story_context?: string | null;
  storyContext?: string | null;
  address?: string | null;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  photo_title?: string | null;
  photoTitle?: string | null;
  photo_location?: string | null;
  photoLocation?: string | null;
  photo_keywords?: string | null;
  photoKeywords?: string | null;
  data_sources?: string | null;
  dataSources?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

type BusanAttractionPageResponse = {
  items?: BusanAttractionRaw[];
  page?: number;
  size?: number;
  totalCount?: number | null;
  total_count?: number | null;
  hasNext?: boolean;
  has_next?: boolean;
};

type PublicCharacterDto = {
  id: number;
  slug: string;
  name: string;
};

const ageGroups = ['0-3세', '4-6세', '7-9세', '10-12세'];
const lengths = ['10페이지', '15페이지', '20페이지'];
const languages = ['한국어', 'English', '日本語', 'Français', 'Español', 'Deutsch', '中文'];
const translationLanguages = ['선택 안 함', ...languages];
const voices = [
  { key: 'default', label: '기본' },
  { key: 'male', label: '남성' },
  { key: 'female', label: '여성' },
  { key: 'child', label: '어린이' },
  { key: 'grandpa', label: '할아버지' },
  { key: 'grandma', label: '할머니' },
];

function textValue(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

function parseApiError(err: unknown): { code?: string; message?: string } {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && typeof parsed === 'object') {
        const detail = (parsed as { detail?: { code?: string; message?: string } }).detail;
        if (detail && typeof detail === 'object') {
          return {
            code: detail.code,
            message: detail.message,
          };
        }
        return {
          code: (parsed as { code?: string }).code,
          message: (parsed as { message?: string }).message,
        };
      }
    } catch {
      return { message: err.message };
    }
  }
  return {};
}

function getAttractionKey(place: BusanAttractionSource): string {
  const raw = (place.sourceId || place.title || '').trim();
  return raw.length > 0 ? raw : `${place.title}-${place.address}`;
}

export function BusanCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const themeFromQuery = (searchParams.get('theme') || 'CITY_INTRO') as ThemeKey;
  const sourceIdFromQuery = (searchParams.get('sourceId') || '').trim();
  const [theme, setTheme] = useState<ThemeKey>(themeFromQuery in themes ? themeFromQuery : 'CITY_INTRO');
  const [age, setAge] = useState('7-9세');
  const [length, setLength] = useState('15페이지');
  const [language, setLanguage] = useState('한국어');
  const [translationLanguage, setTranslationLanguage] = useState('선택 안 함');
  const [voicePreset, setVoicePreset] = useState('default');

  const [attractions, setAttractions] = useState<BusanAttractionSource[]>([]);
  const [isAttractionsLoading, setIsAttractionsLoading] = useState(false);
  const [attractionsError, setAttractionsError] = useState<string | null>(null);
  const [selectedAttractionKey, setSelectedAttractionKey] = useState<string | null>(null);
  const [attractionPage, setAttractionPage] = useState(1);
  const [attractionHasNext, setAttractionHasNext] = useState(false);
  const [attractionTotalCount, setAttractionTotalCount] = useState<number | null>(null);
  const [attractionSearchInput, setAttractionSearchInput] = useState('');
  const [attractionSearchKeyword, setAttractionSearchKeyword] = useState('');
  const [boogiCharacterId, setBoogiCharacterId] = useState<number | null>(null);
  const [isBoogiLoading, setIsBoogiLoading] = useState(true);

  const [extraElementsText, setExtraElementsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const savedVoice = localStorage.getItem('voicePreset');
    if (savedVoice) {
      setVoicePreset(savedVoice);
    }
  }, []);

  useEffect(() => {
    if (themeFromQuery in themes) {
      setTheme(themeFromQuery as ThemeKey);
    }
  }, [themeFromQuery]);

  useEffect(() => {
    if (translationLanguage === language) {
      setTranslationLanguage('선택 안 함');
    }
  }, [language, translationLanguage]);

  const loadAttractions = async (page = 1, keyword = attractionSearchKeyword, sourceId?: string) => {
    setIsAttractionsLoading(true);
    setAttractionsError(null);

    try {
      const query = new URLSearchParams({
        page: String(page),
        size: '12',
      });
      if (sourceId && sourceId.trim().length > 0) {
        query.set('sourceId', sourceId.trim());
      }
      if (keyword.trim().length > 0) {
        query.set('q', keyword.trim());
      }
      const data = await apiFetch<BusanAttractionPageResponse>(`/public/busan/attractions?${query.toString()}`);
      const normalized = (Array.isArray(data?.items) ? data.items : [])
        .map((item) => ({
          sourceId: textValue(item.source_id, item.sourceId),
          title: textValue(item.title),
          district: textValue(item.district),
          subtitle: textValue(item.subtitle),
          intro: textValue(item.intro),
          feature: textValue(item.feature),
          origin: textValue(item.origin),
          storyContext: textValue(item.story_context, item.storyContext),
          address: textValue(item.address),
          thumbnailUrl: textValue(item.thumbnail_url, item.thumbnailUrl),
          imageUrl: textValue(item.image_url, item.imageUrl),
          photoTitle: textValue(item.photo_title, item.photoTitle),
          photoLocation: textValue(item.photo_location, item.photoLocation),
          photoKeywords: textValue(item.photo_keywords, item.photoKeywords),
          dataSources: textValue(item.data_sources, item.dataSources),
          lat: typeof item.lat === 'number' ? item.lat : (typeof item.lat === 'string' ? Number(item.lat) || null : null),
          lng: typeof item.lng === 'number' ? item.lng : (typeof item.lng === 'string' ? Number(item.lng) || null : null),
        }))
        .filter((item) => item.title.length > 0);

      setAttractions(normalized);
      setAttractionPage(data?.page ?? page);
      setAttractionHasNext(Boolean(data?.hasNext ?? data?.has_next));
      const totalCountRaw = data?.totalCount ?? data?.total_count;
      setAttractionTotalCount(typeof totalCountRaw === 'number' ? totalCountRaw : null);

      setSelectedAttractionKey((prev) => {
        if (sourceId && sourceId.trim().length > 0) {
          const matched = normalized.find((item) => item.sourceId === sourceId.trim());
          if (matched) {
            return getAttractionKey(matched);
          }
        }
        if (prev && normalized.some((item) => getAttractionKey(item) === prev)) {
          return prev;
        }
        return null;
      });
    } catch (error) {
      const parsed = parseApiError(error);
      setAttractions([]);
      setAttractionsError(parsed.message || '부산 공공데이터를 불러오지 못했습니다.');
    } finally {
      setIsAttractionsLoading(false);
    }
  };

  useEffect(() => {
    void loadAttractions(1, '', sourceIdFromQuery || undefined);
  }, [sourceIdFromQuery]);

  useEffect(() => {
    const loadBoogiCharacter = async () => {
      setIsBoogiLoading(true);
      try {
        const characters = await apiFetch<PublicCharacterDto[]>('/public/characters');
        const boogi = (characters || []).find(
          (character) =>
            character?.slug === 'busan-boogi' ||
            character?.slug === 'boogi' ||
            (character?.name || '').includes('부기'),
        );
        setBoogiCharacterId(boogi?.id ?? null);
      } catch {
        setBoogiCharacterId(null);
      } finally {
        setIsBoogiLoading(false);
      }
    };

    void loadBoogiCharacter();
  }, []);

  const headerTitle = useMemo(() => `Jaramgle × Busan · ${themes[theme].label}`, [theme]);

  const toggleAttraction = (key: string) => {
    setSelectedAttractionKey(key);
  };

  const parseRequiredElements = () => {
    const selectedTitles = attractions
      .filter((item) => selectedAttractionKey === getAttractionKey(item))
      .map((item) => item.title.trim())
      .filter((item) => item.length > 0);

    const extra = extraElementsText
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return Array.from(new Set(['부산', ...themes[theme].requiredAnchors, ...selectedTitles, ...extra]));
  };

  const selectedAttraction = attractions.find((item) => getAttractionKey(item) === selectedAttractionKey) || null;

  const handleGenerate = async () => {
    if (!selectedAttraction) {
      alert('공모전 동화에는 부산 공공데이터 명소가 필요합니다. 명소를 1개 선택해 주세요.');
      return;
    }
    if (!isBoogiLoading && !boogiCharacterId) {
      alert('부산 공식 캐릭터 부기 리소스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setIsGenerating(true);
    setProgress(7);

    const minPages = parseInt(length.replace(/[^0-9]/g, ''), 10) || 15;
    const languageMap: Record<string, string> = {
      한국어: 'KO',
      English: 'EN',
      日本語: 'JA',
      Français: 'FR',
      Español: 'ES',
      Deutsch: 'DE',
      中文: 'ZH',
    };

    const payload: Record<string, unknown> = {
      age_range: age,
      topics: themes[theme].topics,
      objectives: [...themes[theme].objectives, ...themes[theme].promptDirectives],
      min_pages: Math.min(20, Math.max(10, minPages)),
      language: languageMap[language] || 'KO',
      required_elements: parseRequiredElements(),
      moral: themes[theme].moral,
      art_style: '2D 파스텔 동화책 삽화, 깨끗한 선, 수채화 질감, no 3D',
      character_ids: boogiCharacterId ? [boogiCharacterId] : undefined,
      generation_profile: 'BUSAN_COMPETITION',
      busan_context: selectedAttraction
        ? {
            source_type: 'ATTRACTION',
            source_id: selectedAttraction.sourceId || undefined,
            title: selectedAttraction.title,
            district: selectedAttraction.district || undefined,
            subtitle: selectedAttraction.subtitle || undefined,
            introduction: selectedAttraction.intro || undefined,
            feature_summary: selectedAttraction.feature || undefined,
            origin_story: selectedAttraction.origin || undefined,
            description: selectedAttraction.storyContext || undefined,
            address: selectedAttraction.address || undefined,
            photo_title: selectedAttraction.photoTitle || undefined,
            photo_location: selectedAttraction.photoLocation || undefined,
            photo_keywords: selectedAttraction.photoKeywords || undefined,
            data_sources: selectedAttraction.dataSources || undefined,
          }
        : undefined,
    };

    if (translationLanguage !== '선택 안 함') {
      payload.translation_language = languageMap[translationLanguage] || undefined;
    }

    try {
      const story = await apiFetch<{ id: number }>('/stories', {
        method: 'POST',
        body: payload,
      });

      setProgress(52);

      await apiFetch(`/stories/${story.id}/storybook`, {
        method: 'POST',
        body: {
          voicePreset: voicePreset !== 'default' ? voicePreset : undefined,
        },
      });

      setProgress(100);
      localStorage.setItem('voicePreset', voicePreset);
      router.push('/my-books');
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.code === 'INSUFFICIENT_HEARTS' || (parsed.message ?? '').includes('하트')) {
        if (confirm(parsed.message || '하트가 부족합니다. 충전 페이지로 이동할까요?')) {
          router.push('/subscription');
        }
      } else if (parsed.code === 'AI_PROVIDER_CREDITS_DEPLETED' || parsed.code === 'AI_PROVIDER_QUOTA_OR_BILLING_ERROR') {
        alert(parsed.message || 'AI 제공자 권한/쿼터/결제 설정 문제로 부산 동화를 생성할 수 없습니다.');
      } else {
        alert(parsed.message || '부산 동화 생성에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return <GenerationLoading progress={progress} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,#E0F7FA_0%,#B3E5FC_38%,#E1F5FE_75%,#F6FCFF_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-5xl rounded-[36px] border border-[#81D4FA]/60 bg-white/80 p-6 shadow-[0_24px_48px_rgba(2,136,209,0.16)] backdrop-blur md:p-10">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E1F5FE] px-3 py-1 text-xs font-semibold text-[#0277BD]">
              <Sailboat className="h-4 w-4" />
              부산 공모전 전용 생성
            </div>
            <h1 className="mt-2 text-3xl font-black text-[#01579B]" style={{ fontFamily: "'Jua', 'Do Hyeon', sans-serif" }}>
              {headerTitle}
            </h1>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-[#81D4FA] text-[#0277BD] hover:bg-[#E1F5FE]"
            onClick={() => router.push('/busan')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> 부산 메인으로
          </Button>
        </div>

        <div className="space-y-7">
          <section>
            <label className="mb-3 block text-sm font-semibold text-[#01579B]">미션 주제</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(themes) as ThemeKey[]).map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-5 ${
                    key === theme
                      ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]'
                      : 'border-[#CFD8DC] bg-white text-[#546E7A] hover:bg-[#F1FBFF]'
                  }`}
                  onClick={() => setTheme(key)}
                >
                  {themes[key].label}
                </Button>
              ))}
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-semibold text-[#01579B]">연령대</label>
              <div className="flex flex-wrap gap-2">
                {ageGroups.map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    size="sm"
                    className={`rounded-full px-4 ${
                      age === item ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]' : 'border-[#CFD8DC] bg-white text-[#546E7A]'
                    }`}
                    onClick={() => setAge(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-[#01579B]">분량</label>
              <div className="flex flex-wrap gap-2">
                {lengths.map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    size="sm"
                    className={`rounded-full px-4 ${
                      length === item ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]' : 'border-[#CFD8DC] bg-white text-[#546E7A]'
                    }`}
                    onClick={() => setLength(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <label className="mb-3 block text-sm font-semibold text-[#01579B]">언어</label>
            <div className="flex flex-wrap gap-2">
              {languages.map((item) => (
                <Button
                  key={item}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-4 ${
                    language === item ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]' : 'border-[#CFD8DC] bg-white text-[#546E7A]'
                  }`}
                  onClick={() => setLanguage(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </section>

          <section>
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#01579B]">
              <Languages className="h-4 w-4" /> 번역 언어 (선택)
            </label>
            <div className="flex flex-wrap gap-2">
              {translationLanguages.map((item) => {
                const isSameAsSource = item !== '선택 안 함' && item === language;
                return (
                  <Button
                    key={item}
                    variant="outline"
                    size="sm"
                    disabled={isSameAsSource}
                    title={isSameAsSource ? '원본 언어와 같은 번역 언어는 선택할 수 없습니다.' : undefined}
                    className={`rounded-full px-4 ${
                      translationLanguage === item
                        ? 'border-[#00ACC1] bg-[#E0F7FA] text-[#006064]'
                        : isSameAsSource
                          ? 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] text-[#B0BEC5]'
                          : 'border-[#CFD8DC] bg-white text-[#546E7A]'
                    }`}
                    onClick={() => {
                      if (!isSameAsSource) {
                        setTranslationLanguage(item);
                      }
                    }}
                  >
                    {item}
                  </Button>
                );
              })}
            </div>
          </section>

          <section>
            <label className="mb-3 block text-sm font-semibold text-[#01579B]">음성</label>
            <div className="flex flex-wrap gap-2">
              {voices.map((voice) => (
                <Button
                  key={voice.key}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-4 ${
                    voicePreset === voice.key
                      ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]'
                      : 'border-[#CFD8DC] bg-white text-[#546E7A]'
                  }`}
                  onClick={() => setVoicePreset(voice.key)}
                >
                  {voice.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-[#80DEEA] bg-gradient-to-b from-white via-[#E0F7FA] to-[#B3E5FC] p-4 shadow-[0_18px_36px_rgba(0,150,200,0.16)]">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#FFF59D]/70 blur-sm" />
              <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[#4DD0E1]/30 blur-md" />
              <div className="relative">
                <div className="mb-3 inline-flex rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[#0277BD] shadow-sm">
                  부산 공식 캐릭터
                </div>
                <div className="rounded-[28px] bg-white/75 p-4">
                  <ImageWithFallback
                    src={`${BACKEND_ORIGIN}/characters/busan-boogi.png`}
                    alt="부산 공식 캐릭터 부기"
                    className="h-56 w-full object-contain drop-shadow-[0_12px_18px_rgba(2,119,189,0.18)]"
                  />
                </div>
                <div className="mt-3 rounded-2xl bg-white/90 px-4 py-3 text-sm font-bold leading-relaxed text-[#01579B] shadow-sm">
                  “안녕! 내가 부산 곳곳을 동화 속 모험으로 안내할게.”
                </div>
              </div>
            </div>

            <div
              className={`flex min-h-full flex-col justify-between gap-4 rounded-[28px] border px-5 py-5 ${
                isBoogiLoading
                  ? 'border-[#B3E5FC] bg-[#F3FBFF] text-[#0277BD]'
                  : boogiCharacterId
                    ? 'border-[#B2DFDB] bg-gradient-to-br from-[#E0F7FA] to-white text-[#006064]'
                    : 'border-[#FFCDD2] bg-[#FFF5F5] text-[#C62828]'
              }`}
            >
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  {isBoogiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : boogiCharacterId ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="font-black">부기 캐릭터 리소스</span>
                  <span className="font-semibold">
                    {isBoogiLoading ? '연결 확인 중' : boogiCharacterId ? '연결 완료' : '미연결'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#335766]">
                  {isBoogiLoading
                    ? '부기 캐릭터 참조 이미지를 확인하고 있습니다.'
                    : boogiCharacterId
                      ? '동화 이미지 생성 시 부기 캐릭터 참조가 함께 전달됩니다. 부산 전용 동화에서는 부기가 기본 주인공처럼 등장합니다.'
                      : '관리자 캐릭터 리소스 설정이 필요합니다. 부기 리소스가 없으면 부산 공모전 전용 동화를 생성하지 않습니다.'}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {themes[theme].requiredAnchors.map((anchor) => (
                  <div key={anchor} className="rounded-2xl bg-white/80 px-3 py-3 text-xs font-bold text-[#0277BD] shadow-sm">
                    {anchor}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#01579B]">
                <MapPin className="h-4 w-4" /> 사진이 있는 부산 명소 선택 (공공데이터, 1개)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-[#B3E5FC] text-[#0277BD] hover:bg-[#E1F5FE]"
                onClick={() => {
                  void loadAttractions(attractionPage, attractionSearchKeyword);
                }}
                disabled={isAttractionsLoading}
              >
                {isAttractionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '목록 새로고침'}
              </Button>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Input
                value={attractionSearchInput}
                onChange={(event) => setAttractionSearchInput(event.target.value)}
                placeholder="장소 검색 (예: 해운대, 감천, 흰여울)"
                className="max-w-sm border-[#B3E5FC] bg-white"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const keyword = attractionSearchInput.trim();
                    setAttractionSearchKeyword(keyword);
                    void loadAttractions(1, keyword);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-[#B3E5FC] text-[#0277BD] hover:bg-[#E1F5FE]"
                onClick={() => {
                  const keyword = attractionSearchInput.trim();
                  setAttractionSearchKeyword(keyword);
                  void loadAttractions(1, keyword);
                }}
              >
                <Search className="mr-1 h-4 w-4" /> 검색
              </Button>
              {attractionSearchKeyword && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[#CFD8DC] text-[#607D8B] hover:bg-[#ECEFF1]"
                  onClick={() => {
                    setAttractionSearchInput('');
                    setAttractionSearchKeyword('');
                    void loadAttractions(1, '');
                  }}
                >
                  검색 초기화
                </Button>
              )}
            </div>

            {isAttractionsLoading && attractions.length === 0 ? (
              <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-[#B3E5FC] bg-[#F3FBFF] text-[#4F6D79]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 부산 명소를 불러오는 중...
              </div>
            ) : (
              <>
                {attractionsError && (
                  <div className="mb-3 rounded-2xl border border-[#FFCDD2] bg-[#FFF5F5] px-3 py-2 text-sm text-[#C62828]">
                    {attractionsError}
                  </div>
                )}

                <div className="mb-3 rounded-2xl bg-[#E1F5FE]/70 px-4 py-3 text-sm leading-relaxed text-[#01579B]">
                  아이가 먼저 고르기 쉽도록 이미지가 있는 명소만 보여줍니다. 선택한 장소의 설명과 관광사진 키워드는 동화 프롬프트에 함께 반영됩니다.
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {attractions.map((place) => {
                    const key = getAttractionKey(place);
                    const selected = selectedAttractionKey === key;
                    const thumbnail = place.thumbnailUrl || place.imageUrl;

                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => toggleAttraction(key)}
                        className={`overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                          selected
                            ? 'border-[#0288D1] ring-2 ring-[#81D4FA]/70'
                            : 'border-[#CFD8DC] hover:-translate-y-0.5 hover:shadow-md'
                        }`}
                      >
                        <div className="relative h-28 w-full bg-[#E0F7FA]">
                          <ImageWithFallback
                            src={thumbnail}
                            alt={place.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-[#0277BD] shadow-sm">
                            사진 명소
                          </div>
                          {selected && (
                            <div className="absolute bottom-2 right-2 rounded-full bg-[#0288D1] px-2 py-1 text-[10px] font-black text-white shadow-sm">
                              선택됨
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 px-3 py-2">
                          <div className="line-clamp-1 text-sm font-bold text-[#01579B]">{place.title}</div>
                          <div className="line-clamp-1 text-xs text-[#546E7A]">{place.district || place.address || '부산'}</div>
                          <div className="line-clamp-2 text-[11px] text-[#607D8B]">
                            {place.feature || place.intro || place.subtitle || place.storyContext || '명소 소개 정보'}
                          </div>
                          {place.photoKeywords && (
                            <div className="line-clamp-1 text-[10px] font-semibold text-[#0288D1]">
                              동화 소재 · {place.photoKeywords}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#546E7A]">
                  <div>
                    페이지 {attractionPage}
                    {typeof attractionTotalCount === 'number' ? ` · 검색결과 ${attractionTotalCount}개` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#CFD8DC] bg-white"
                      disabled={isAttractionsLoading || attractionPage <= 1}
                      onClick={() => {
                        const prev = Math.max(1, attractionPage - 1);
                        void loadAttractions(prev, attractionSearchKeyword);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#CFD8DC] bg-white"
                      disabled={isAttractionsLoading || !attractionHasNext}
                      onClick={() => {
                        void loadAttractions(attractionPage + 1, attractionSearchKeyword);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {attractions.length === 0 && !isAttractionsLoading && !attractionsError && (
                  <div className="mt-3 rounded-2xl border border-dashed border-[#B3E5FC] bg-[#F3FBFF] px-3 py-2 text-sm text-[#546E7A]">
                    불러온 사진 명소가 없습니다. 검색어를 바꾸거나 관리자에서 부산 공공데이터 동기화를 실행해 주세요.
                  </div>
                )}
              </>
            )}

            {selectedAttraction && (
              <div className="mt-4 overflow-hidden rounded-[28px] border border-[#81D4FA] bg-gradient-to-br from-white to-[#E1F5FE] shadow-sm">
                <div className="flex flex-col gap-4 p-4 md:flex-row">
                  <div className="h-36 w-full overflow-hidden rounded-2xl bg-[#E0F7FA] md:w-48">
                    <ImageWithFallback
                      src={selectedAttraction.thumbnailUrl || selectedAttraction.imageUrl}
                      alt={selectedAttraction.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#0277BD]">
                      <Database className="h-3.5 w-3.5" />
                      {selectedAttraction.dataSources || '부산광역시 공공데이터포털 관광명소정보서비스 반영'}
                    </div>
                    <h3 className="text-xl font-black text-[#01579B]">{selectedAttraction.title}</h3>
                    <p className="mt-1 text-sm text-[#4F6D79]">
                      {selectedAttraction.district || '부산'} · {selectedAttraction.address || '주소 정보 없음'}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-[#334155] md:grid-cols-2">
                      <div className="rounded-2xl bg-white/75 p-3">
                        <div className="mb-1 font-bold text-[#0277BD]">소개</div>
                        <p className="line-clamp-3">{selectedAttraction.intro || selectedAttraction.subtitle || '소개 정보 없음'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 p-3">
                        <div className="mb-1 font-bold text-[#0277BD]">특징/유래</div>
                        <p className="line-clamp-3">
                          {selectedAttraction.feature || selectedAttraction.origin || selectedAttraction.storyContext || '특징 정보 없음'}
                        </p>
                      </div>
                    </div>
                    {(selectedAttraction.photoTitle || selectedAttraction.photoKeywords) && (
                      <div className="mt-3 rounded-2xl bg-white/75 p-3 text-sm text-[#334155]">
                        <div className="mb-1 font-bold text-[#0277BD]">관광사진 보강 정보</div>
                        <p className="line-clamp-2">
                          {[selectedAttraction.photoTitle, selectedAttraction.photoLocation, selectedAttraction.photoKeywords]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Textarea
              value={extraElementsText}
              onChange={(event) => setExtraElementsText(event.target.value)}
              placeholder="추가 요소를 입력하세요 (쉼표/줄바꿈 구분)\n예: 부산항대교 야경, 국제시장 골목"
              className="mt-4 min-h-[110px] border-[#B3E5FC] bg-[#F8FDFF] text-[#263238]"
            />
          </section>

          <Button
            className="w-full rounded-[24px] bg-gradient-to-r from-[#00ACC1] via-[#039BE5] to-[#0288D1] py-7 text-base font-bold text-white shadow-[0_12px_28px_rgba(2,136,209,0.35)] hover:from-[#00838F] hover:via-[#0277BD] hover:to-[#01579B]"
            onClick={handleGenerate}
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <Wand2 className="h-5 w-5" />
              부산 공모전 동화 생성하기
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
