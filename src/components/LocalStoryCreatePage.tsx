"use client";

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Database, Languages, Loader2, MapPin, Search, Sparkles, Wand2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GenerationLoading } from '@/components/GenerationLoading';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { BACKEND_ORIGIN, apiFetch } from '@/lib/api';
import { type LocalRegionConfig, type LocalThemeKey } from '@/lib/localStoryRegions';

type LocalStorySource = {
  regionCode: string;
  sourceId: string;
  contentTypeId: string;
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
  storySeed: string;
  dataSources: string;
  lat: number | null;
  lng: number | null;
};

type LocalStoryRaw = {
  region_code?: string | null;
  regionCode?: string | null;
  source_id?: string | null;
  sourceId?: string | null;
  content_type_id?: string | null;
  contentTypeId?: string | null;
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
  story_seed?: string | null;
  storySeed?: string | null;
  data_sources?: string | null;
  dataSources?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

type LocalStoryPageResponse = {
  items?: LocalStoryRaw[];
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
  imageUrl?: string | null;
  image_url?: string | null;
};

type GenerationErrorState = {
  kind: 'MISSING_PLACE' | 'INSUFFICIENT_HEARTS' | 'AI_PROVIDER' | 'GENERAL';
  title: string;
  message: string;
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
    if (trimmed) return trimmed;
  }
  return '';
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeSource(item: LocalStoryRaw): LocalStorySource {
  return {
    regionCode: textValue(item.region_code, item.regionCode),
    sourceId: textValue(item.source_id, item.sourceId),
    contentTypeId: textValue(item.content_type_id, item.contentTypeId),
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
    storySeed: textValue(item.story_seed, item.storySeed),
    dataSources: textValue(item.data_sources, item.dataSources),
    lat: parseNumber(item.lat),
    lng: parseNumber(item.lng),
  };
}

function getSourceKey(place: LocalStorySource): string {
  const raw = (place.sourceId || place.title || '').trim();
  return raw.length > 0 ? raw : `${place.title}-${place.address}`;
}

function displayArea(place: LocalStorySource, fallbackRegion: string): string {
  if (place.district && !/^\d+$/.test(place.district)) return place.district;
  const addressParts = place.address.split(/\s+/).filter(Boolean);
  const district = addressParts.find((part) => /[시군구]$/.test(part));
  return district || place.address || fallbackRegion;
}

function parseApiError(err: unknown): { code?: string; message?: string } {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      const detail = (parsed as { detail?: { code?: string; message?: string } }).detail;
      if (detail && typeof detail === 'object') return { code: detail.code, message: detail.message };
      return { code: (parsed as { code?: string }).code, message: (parsed as { message?: string }).message };
    } catch {
      return { message: err.message };
    }
  }
  return {};
}

function languageCode(label: string): string {
  const languageMap: Record<string, string> = {
    한국어: 'KO',
    English: 'EN',
    日本語: 'JA',
    Français: 'FR',
    Español: 'ES',
    Deutsch: 'DE',
    中文: 'ZH',
  };
  return languageMap[label] || 'KO';
}

export function LocalStoryCreatePage({ config }: { config: LocalRegionConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeFromQuery = (searchParams.get('theme') || 'CITY_STORY') as LocalThemeKey;
  const sourceIdFromQuery = (searchParams.get('sourceId') || '').trim();

  const [theme, setTheme] = useState<LocalThemeKey>(themeFromQuery in config.themes ? themeFromQuery : 'CITY_STORY');
  const [age, setAge] = useState('7-9세');
  const [length, setLength] = useState('15페이지');
  const [language, setLanguage] = useState('한국어');
  const [translationLanguage, setTranslationLanguage] = useState('선택 안 함');
  const [voicePreset, setVoicePreset] = useState('default');

  const [sources, setSources] = useState<LocalStorySource[]>([]);
  const [isSourcesLoading, setIsSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(null);
  const [sourcePage, setSourcePage] = useState(1);
  const [sourceHasNext, setSourceHasNext] = useState(false);
  const [sourceTotalCount, setSourceTotalCount] = useState<number | null>(null);
  const [sourceSearchInput, setSourceSearchInput] = useState('');
  const [sourceSearchKeyword, setSourceSearchKeyword] = useState('');

  const [mascotCharacterId, setMascotCharacterId] = useState<number | null>(null);
  const [mascotImageUrl, setMascotImageUrl] = useState<string | null>(null);
  const [isMascotLoading, setIsMascotLoading] = useState(true);

  const [extraElementsText, setExtraElementsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationError, setGenerationError] = useState<GenerationErrorState | null>(null);

  useEffect(() => {
    const savedVoice = localStorage.getItem('voicePreset');
    if (savedVoice) setVoicePreset(savedVoice);
  }, []);

  useEffect(() => {
    if (themeFromQuery in config.themes) setTheme(themeFromQuery as LocalThemeKey);
  }, [config.themes, themeFromQuery]);

  useEffect(() => {
    if (translationLanguage === language) setTranslationLanguage('선택 안 함');
  }, [language, translationLanguage]);

  const loadSources = async (page = 1, keyword = sourceSearchKeyword, sourceId?: string) => {
    setIsSourcesLoading(true);
    setSourcesError(null);
    try {
      const query = new URLSearchParams({ page: String(page), size: '12' });
      if (sourceId && sourceId.trim()) query.set('sourceId', sourceId.trim());
      if (keyword.trim()) query.set('q', keyword.trim());
      const data = await apiFetch<LocalStoryPageResponse>(`/public/local/${config.apiRegion}/sources?${query.toString()}`);
      const normalized = (Array.isArray(data?.items) ? data.items : [])
        .map(normalizeSource)
        .filter((item) => item.title.length > 0 && (item.thumbnailUrl || item.imageUrl));
      setSources(normalized);
      setSourcePage(data?.page ?? page);
      setSourceHasNext(Boolean(data?.hasNext ?? data?.has_next));
      const totalCountRaw = data?.totalCount ?? data?.total_count;
      setSourceTotalCount(typeof totalCountRaw === 'number' ? totalCountRaw : null);
      setSelectedSourceKey((prev) => {
        if (sourceId && sourceId.trim()) {
          const matched = normalized.find((item) => item.sourceId === sourceId.trim());
          if (matched) return getSourceKey(matched);
        }
        if (prev && normalized.some((item) => getSourceKey(item) === prev)) return prev;
        return null;
      });
    } catch (error) {
      const parsed = parseApiError(error);
      setSources([]);
      setSourcesError(parsed.message || `${config.regionName} 공공데이터를 불러오지 못했습니다.`);
    } finally {
      setIsSourcesLoading(false);
    }
  };

  useEffect(() => {
    void loadSources(1, '', sourceIdFromQuery || undefined);
  }, [config.apiRegion, sourceIdFromQuery]);

  useEffect(() => {
    const loadMascotCharacter = async () => {
      if (!config.mascotGenerationEnabled) {
        setMascotCharacterId(null);
        setMascotImageUrl(null);
        setIsMascotLoading(false);
        return;
      }
      setIsMascotLoading(true);
      try {
        const characters = await apiFetch<PublicCharacterDto[]>('/public/characters');
        const mascot = (characters || []).find((character) => {
          const slug = (character?.slug || '').toLowerCase();
          const name = character?.name || '';
          return config.mascotSlugs.includes(slug) || config.mascotSearchNames.some((keyword) => name.includes(keyword));
        });
        setMascotCharacterId(mascot?.id ?? null);
        setMascotImageUrl(textValue(mascot?.imageUrl, mascot?.image_url) || null);
      } catch {
        setMascotCharacterId(null);
        setMascotImageUrl(null);
      } finally {
        setIsMascotLoading(false);
      }
    };
    void loadMascotCharacter();
  }, [config.mascotGenerationEnabled, config.mascotSearchNames, config.mascotSlugs]);

  const selectedSource = sources.find((item) => getSourceKey(item) === selectedSourceKey) || null;
  const activeTheme = config.themes[theme];
  const headerTitle = useMemo(() => `${config.brandLabel} · ${activeTheme.title}`, [activeTheme.title, config.brandLabel]);
  const displayMascotImageUrl = mascotImageUrl
    ? (mascotImageUrl.startsWith('http') ? mascotImageUrl : `${BACKEND_ORIGIN}${mascotImageUrl}`)
    : `${BACKEND_ORIGIN}${config.mascotImagePath}`;

  const parseRequiredElements = () => {
    const selectedTitles = selectedSource ? [selectedSource.title.trim()].filter(Boolean) : [];
    const extra = extraElementsText.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    const mascotElements = config.mascotGenerationEnabled ? [config.mascotName] : [];
    return Array.from(new Set([config.regionName, ...mascotElements, ...activeTheme.requiredAnchors, ...selectedTitles, ...extra]));
  };

  const handleGenerate = async () => {
    setGenerationError(null);
    if (!selectedSource) {
      setGenerationError({
        kind: 'MISSING_PLACE',
        title: `${config.regionName} 장소를 먼저 선택해 주세요`,
        message: `지역 공공데이터 기반 이야기는 사진이 있는 ${config.regionName} 장소 1개를 중심으로 생성합니다.`,
      });
      return;
    }

    setIsGenerating(true);
    setProgress(7);
    const minPages = parseInt(length.replace(/[^0-9]/g, ''), 10) || 15;
    const payload: Record<string, unknown> = {
      age_range: age,
      topics: activeTheme.topics,
      objectives: [...activeTheme.objectives, ...activeTheme.promptDirectives],
      min_pages: Math.min(20, Math.max(10, minPages)),
      language: languageCode(language),
      required_elements: parseRequiredElements(),
      moral: activeTheme.moral,
      art_style: config.artStyle,
      character_ids: mascotCharacterId ? [mascotCharacterId] : undefined,
      generation_profile: config.generationProfile,
      local_context: {
        region_code: config.regionCode,
        region_name: config.regionName,
        source_type: 'ATTRACTION',
        source_id: selectedSource.sourceId || undefined,
        title: selectedSource.title,
        district: displayArea(selectedSource, config.regionName),
        subtitle: selectedSource.subtitle || undefined,
        introduction: selectedSource.intro || undefined,
        feature_summary: selectedSource.feature || undefined,
        origin_story: selectedSource.origin || undefined,
        description: selectedSource.storyContext || undefined,
        address: selectedSource.address || undefined,
        photo_title: selectedSource.photoTitle || undefined,
        photo_location: selectedSource.photoLocation || undefined,
        photo_keywords: selectedSource.photoKeywords || undefined,
        story_seed: selectedSource.storySeed || undefined,
        data_sources: selectedSource.dataSources || undefined,
      },
    };
    if (translationLanguage !== '선택 안 함') payload.translation_language = languageCode(translationLanguage);

    try {
      const story = await apiFetch<{ id: number }>('/stories', { method: 'POST', body: payload });
      setProgress(52);
      await apiFetch(`/stories/${story.id}/storybook`, {
        method: 'POST',
        body: { voicePreset: voicePreset !== 'default' ? voicePreset : undefined },
      });
      setProgress(100);
      localStorage.setItem('voicePreset', voicePreset);
      router.push('/my-books');
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed.code === 'INSUFFICIENT_HEARTS' || (parsed.message ?? '').includes('하트')) {
        setGenerationError({
          kind: 'INSUFFICIENT_HEARTS',
          title: '하트가 부족합니다',
          message: parsed.message || '이야기 생성을 시작하려면 하트 충전이 필요합니다.',
        });
        router.push('/subscription');
      } else if (parsed.code === 'AI_PROVIDER_CREDITS_DEPLETED' || parsed.code === 'AI_PROVIDER_QUOTA_OR_BILLING_ERROR') {
        setGenerationError({
          kind: 'AI_PROVIDER',
          title: 'AI 생성 서버 설정을 확인해야 합니다',
          message: parsed.message || `AI 제공자 권한, 쿼터, 결제 설정 문제로 ${config.regionName} 이야기를 생성할 수 없습니다.`,
        });
      } else {
        setGenerationError({
          kind: 'GENERAL',
          title: `${config.regionName} 이야기 생성에 실패했습니다`,
          message: parsed.message || '일시적인 오류일 수 있습니다. 선택한 장소와 옵션을 유지한 상태로 다시 시도할 수 있습니다.',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) return <GenerationLoading progress={progress} />;

  return (
    <div className="min-h-screen px-6 py-10 md:px-10" style={{ background: config.colors.page }}>
      <div className="mx-auto max-w-5xl rounded-[38px] border bg-white/82 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.13)] backdrop-blur md:p-10" style={{ borderColor: config.colors.border }}>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1 text-xs font-black" style={{ borderColor: config.colors.border, color: config.colors.primary }}>
              <Sparkles className="h-4 w-4" /> {config.eyebrow}
            </div>
            <h1 className="mt-2 text-3xl font-black" style={{ color: config.colors.primaryDark, fontFamily: "'Jua', 'Do Hyeon', sans-serif" }}>
              {headerTitle}
            </h1>
          </div>
          <Button variant="outline" className="rounded-full bg-white/75" style={{ borderColor: config.colors.border, color: config.colors.primary }} onClick={() => router.push(`/${config.slug}`)}>
            <ChevronLeft className="mr-1 h-4 w-4" /> {config.regionName} 메인으로
          </Button>
        </div>

        <div className="space-y-7">
          <section>
            <label className="mb-3 block text-sm font-black" style={{ color: config.colors.primaryDark }}>이야기 방향</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(config.themes) as LocalThemeKey[]).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-5"
                  style={{
                    borderColor: key === theme ? config.colors.primary : '#CBD5E1',
                    backgroundColor: key === theme ? config.colors.softer : '#FFFFFF',
                    color: key === theme ? config.colors.primaryDark : '#526170',
                  }}
                  onClick={() => setTheme(key)}
                >
                  {config.themes[key].title}
                </Button>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border p-4" style={{ borderColor: config.colors.border, backgroundColor: config.colors.panel }}>
              <div className="mb-2 text-sm font-black" style={{ color: config.colors.primaryDark }}>{activeTheme.title} 생성 방향</div>
              <p className="text-sm leading-relaxed" style={{ color: config.colors.muted }}>{activeTheme.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeTheme.requiredAnchors.map((anchor) => (
                  <span key={anchor} className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold" style={{ color: config.colors.primary }}>{anchor}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[28px] border p-4 shadow-[0_14px_30px_rgba(15,23,42,0.09)] sm:flex-row sm:items-stretch" style={{ borderColor: config.colors.border, background: `linear-gradient(135deg, ${config.colors.panel}, #ffffff)` }}>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/55 blur-sm" />
            <div className="relative flex h-36 w-full shrink-0 items-center justify-center rounded-[22px] bg-white/75 p-3 sm:w-44">
              <ImageWithFallback
                src={displayMascotImageUrl}
                alt={`${config.regionName} 공식 캐릭터 ${config.mascotName}`}
                className="h-full w-full object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.14)]"
              />
            </div>
            <div className="relative flex min-w-0 flex-1 flex-col justify-center">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black shadow-sm" style={{ color: config.colors.primary }}>
                  {config.regionName} 안내 캐릭터
                </span>
                <span className="text-base font-black" style={{ color: config.colors.primaryDark }}>{config.mascotName}</span>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: config.colors.softer, color: config.colors.primary }}>
                  {isMascotLoading
                    ? '캐릭터 확인 중'
                    : config.mascotGenerationEnabled && mascotCharacterId
                      ? '동화 그림에 함께 등장'
                      : '공식 이미지'}
                </span>
              </div>
              <p className="text-sm font-bold leading-relaxed" style={{ color: config.colors.primaryDark }}>
                {config.mascotBubble}
              </p>
              <p className="mt-2 text-[10px] leading-relaxed" style={{ color: config.colors.muted }}>
                {config.mascotUsageNote}
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-black" style={{ color: config.colors.primaryDark }}>연령대</label>
              <div className="flex flex-wrap gap-2">
                {ageGroups.map((item) => <Button key={item} variant="outline" size="sm" className="rounded-full px-4" style={{ borderColor: age === item ? config.colors.primary : '#CBD5E1', backgroundColor: age === item ? config.colors.softer : '#FFFFFF', color: age === item ? config.colors.primaryDark : '#526170' }} onClick={() => setAge(item)}>{item}</Button>)}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-black" style={{ color: config.colors.primaryDark }}>분량</label>
              <div className="flex flex-wrap gap-2">
                {lengths.map((item) => <Button key={item} variant="outline" size="sm" className="rounded-full px-4" style={{ borderColor: length === item ? config.colors.primary : '#CBD5E1', backgroundColor: length === item ? config.colors.softer : '#FFFFFF', color: length === item ? config.colors.primaryDark : '#526170' }} onClick={() => setLength(item)}>{item}</Button>)}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-black" style={{ color: config.colors.primaryDark }}>음성</label>
              <div className="flex flex-wrap gap-2">
                {voices.map((voice) => <Button key={voice.key} variant="outline" size="sm" className="rounded-full px-4" style={{ borderColor: voicePreset === voice.key ? config.colors.primary : '#CBD5E1', backgroundColor: voicePreset === voice.key ? config.colors.softer : '#FFFFFF', color: voicePreset === voice.key ? config.colors.primaryDark : '#526170' }} onClick={() => setVoicePreset(voice.key)}>{voice.label}</Button>)}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-black" style={{ color: config.colors.primaryDark }}><Languages className="h-4 w-4" /> 생성 언어</label>
              <div className="flex flex-wrap gap-2">
                {languages.map((item) => <Button key={item} variant="outline" size="sm" className="rounded-full px-4" style={{ borderColor: language === item ? config.colors.primary : '#CBD5E1', backgroundColor: language === item ? config.colors.softer : '#FFFFFF', color: language === item ? config.colors.primaryDark : '#526170' }} onClick={() => setLanguage(item)}>{item}</Button>)}
              </div>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-black" style={{ color: config.colors.primaryDark }}><Languages className="h-4 w-4" /> 번역본 언어</label>
              <div className="flex flex-wrap gap-2">
                {translationLanguages.map((item) => {
                  const same = item !== '선택 안 함' && item === language;
                  return <Button key={item} variant="outline" size="sm" disabled={same} title={same ? '원본 언어와 같은 번역 언어는 선택할 수 없습니다.' : undefined} className="rounded-full px-4" style={{ borderColor: translationLanguage === item ? config.colors.primary : '#CBD5E1', backgroundColor: translationLanguage === item ? config.colors.softer : '#FFFFFF', color: same ? '#A8B2BE' : translationLanguage === item ? config.colors.primaryDark : '#526170' }} onClick={() => { if (!same) setTranslationLanguage(item); }}>{item}</Button>;
                })}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm font-black" style={{ color: config.colors.primaryDark }}><MapPin className="h-4 w-4" /> 사진이 있는 {config.regionName} 장소 선택 (공공데이터, 1개)</label>
              <Button type="button" variant="outline" size="sm" className="rounded-full" style={{ borderColor: config.colors.border, color: config.colors.primary }} onClick={() => void loadSources(sourcePage, sourceSearchKeyword)} disabled={isSourcesLoading}>
                {isSourcesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '목록 새로고침'}
              </Button>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Input value={sourceSearchInput} onChange={(event) => setSourceSearchInput(event.target.value)} placeholder={config.searchExamples} className="max-w-sm bg-white" style={{ borderColor: config.colors.border }} onKeyDown={(event) => { if (event.key === 'Enter') { const keyword = sourceSearchInput.trim(); setSourceSearchKeyword(keyword); void loadSources(1, keyword); } }} />
              <Button type="button" variant="outline" size="sm" className="rounded-full" style={{ borderColor: config.colors.border, color: config.colors.primary }} onClick={() => { const keyword = sourceSearchInput.trim(); setSourceSearchKeyword(keyword); void loadSources(1, keyword); }}>
                <Search className="mr-1 h-4 w-4" /> 검색
              </Button>
              {sourceSearchKeyword && <Button type="button" variant="outline" size="sm" className="rounded-full border-[#CBD5E1] text-[#64748B]" onClick={() => { setSourceSearchInput(''); setSourceSearchKeyword(''); void loadSources(1, ''); }}>검색 초기화</Button>}
            </div>

            {isSourcesLoading && sources.length === 0 ? (
              <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed text-sm" style={{ borderColor: config.colors.border, backgroundColor: config.colors.panel, color: config.colors.muted }}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {config.regionName} 장소를 불러오는 중...
              </div>
            ) : (
              <>
                {sourcesError && <div className="mb-3 rounded-2xl border border-[#FECACA] bg-[#FFF5F5] px-3 py-2 text-sm text-[#B91C1C]">{sourcesError}</div>}
                <div className="mb-3 rounded-2xl px-4 py-3 text-sm leading-relaxed" style={{ backgroundColor: config.colors.softer, color: config.colors.primaryDark }}>
                  이미지가 있는 공공데이터 장소만 보여줍니다. 선택한 장소의 소개, 특징, 관광사진 키워드는 AI 프롬프트에 함께 전달됩니다.
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {sources.map((place) => {
                    const key = getSourceKey(place);
                    const selected = selectedSourceKey === key;
                    return (
                      <button key={key} type="button" onClick={() => setSelectedSourceKey(key)} className="overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: selected ? config.colors.primary : '#CBD5E1', boxShadow: selected ? `0 0 0 2px ${config.colors.border}` : undefined }}>
                        <div className="relative h-28 w-full" style={{ backgroundColor: config.colors.softer }}>
                          <ImageWithFallback src={place.thumbnailUrl || place.imageUrl} alt={place.title} className="h-full w-full object-cover" />
                          <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black shadow-sm" style={{ color: config.colors.primary }}>사진 장소</div>
                          {selected && <div className="absolute bottom-2 right-2 rounded-full px-2 py-1 text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: config.colors.primary }}>선택됨</div>}
                        </div>
                        <div className="space-y-1 px-3 py-2">
                          <div className="line-clamp-1 text-sm font-black" style={{ color: config.colors.primaryDark }}>{place.title}</div>
                          <div className="line-clamp-1 text-xs text-[#64748B]">{displayArea(place, config.regionName)}</div>
                          <div className="line-clamp-2 text-[11px] text-[#607D8B]">{place.storySeed || place.feature || place.intro || place.subtitle || place.storyContext || '장소 소개 정보'}</div>
                          {place.photoKeywords && <div className="line-clamp-1 text-[10px] font-bold" style={{ color: config.colors.primary }}>소재 · {place.photoKeywords}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-sm" style={{ color: config.colors.muted }}>
                  <div>페이지 {sourcePage}{typeof sourceTotalCount === 'number' ? ` · 검색결과 ${sourceTotalCount}개` : ''}</div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-full border-[#CBD5E1] bg-white" disabled={isSourcesLoading || sourcePage <= 1} onClick={() => void loadSources(Math.max(1, sourcePage - 1), sourceSearchKeyword)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-full border-[#CBD5E1] bg-white" disabled={isSourcesLoading || !sourceHasNext} onClick={() => void loadSources(sourcePage + 1, sourceSearchKeyword)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
                {sources.length === 0 && !isSourcesLoading && !sourcesError && <div className="mt-3 rounded-2xl border border-dashed px-3 py-2 text-sm" style={{ borderColor: config.colors.border, backgroundColor: config.colors.panel, color: config.colors.muted }}>{config.emptyMessage}</div>}
              </>
            )}

            {selectedSource && (
              <div className="mt-4 overflow-hidden rounded-[28px] border shadow-sm" style={{ borderColor: config.colors.border, background: `linear-gradient(135deg, #ffffff, ${config.colors.softer})` }}>
                <div className="flex flex-col gap-4 p-4 md:flex-row">
                  <div className="h-36 w-full overflow-hidden rounded-2xl md:w-48" style={{ backgroundColor: config.colors.softer }}>
                    <ImageWithFallback src={selectedSource.thumbnailUrl || selectedSource.imageUrl} alt={selectedSource.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold" style={{ color: config.colors.primary }}><Database className="h-3.5 w-3.5" />{selectedSource.dataSources || `${config.regionName} 공공데이터 반영`}</div>
                    <h3 className="text-xl font-black" style={{ color: config.colors.primaryDark }}>{selectedSource.title}</h3>
                    <p className="mt-1 text-sm" style={{ color: config.colors.muted }}>{displayArea(selectedSource, config.regionName)} · {selectedSource.address || '주소 정보 없음'}</p>
                    <div className="mt-3 grid gap-2 text-sm text-[#334155] md:grid-cols-2">
                      <div className="rounded-2xl bg-white/75 p-3"><div className="mb-1 font-bold" style={{ color: config.colors.primary }}>소개</div><p className="line-clamp-3">{selectedSource.intro || selectedSource.subtitle || '소개 정보 없음'}</p></div>
                      <div className="rounded-2xl bg-white/75 p-3"><div className="mb-1 font-bold" style={{ color: config.colors.primary }}>이야기 소재</div><p className="line-clamp-3">{selectedSource.storySeed || selectedSource.feature || selectedSource.origin || selectedSource.storyContext || '이야기 소재 정보 없음'}</p></div>
                    </div>
                    {(selectedSource.photoTitle || selectedSource.photoKeywords) && <div className="mt-3 rounded-2xl bg-white/75 p-3 text-sm text-[#334155]"><div className="mb-1 font-bold" style={{ color: config.colors.primary }}>관광사진 보강 정보</div><p className="line-clamp-2">{[selectedSource.photoTitle, selectedSource.photoLocation, selectedSource.photoKeywords].filter(Boolean).join(' · ')}</p></div>}
                  </div>
                </div>
              </div>
            )}
            <Textarea value={extraElementsText} onChange={(event) => setExtraElementsText(event.target.value)} placeholder={config.placeholderExtra} className="mt-4 min-h-[110px] bg-white text-[#263238]" style={{ borderColor: config.colors.border }} />
          </section>

          {generationError && (
            <div className={`rounded-[24px] border px-4 py-4 ${generationError.kind === 'INSUFFICIENT_HEARTS' ? 'border-[#FED7AA] bg-[#FFF7ED] text-[#9A3412]' : generationError.kind === 'AI_PROVIDER' ? 'border-[#FECACA] bg-[#FFF5F5] text-[#B91C1C]' : 'text-[#334155]'}`} style={generationError.kind === 'GENERAL' || generationError.kind === 'MISSING_PLACE' ? { borderColor: config.colors.border, backgroundColor: config.colors.panel, color: config.colors.primaryDark } : undefined}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div><div className="mb-1 flex items-center gap-2 text-sm font-black"><AlertCircle className="h-4 w-4" />{generationError.title}</div><p className="text-sm leading-relaxed">{generationError.message}</p></div>
                {generationError.kind === 'INSUFFICIENT_HEARTS' && <Button type="button" className="shrink-0 rounded-full bg-[#EA580C] px-5 text-white hover:bg-[#C2410C]" onClick={() => router.push('/subscription')}>하트 충전소로 이동</Button>}
                {generationError.kind === 'GENERAL' && <Button type="button" variant="outline" className="shrink-0 rounded-full bg-white" style={{ borderColor: config.colors.border, color: config.colors.primary }} onClick={handleGenerate}>다시 시도</Button>}
              </div>
            </div>
          )}

          <Button className="w-full rounded-[24px] py-7 text-base font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]" style={{ background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})` }} onClick={handleGenerate} disabled={isGenerating || !selectedSource}>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-5 w-5" /><Wand2 className="h-5 w-5" />{!selectedSource ? `${config.regionName} 장소를 선택해 주세요` : `${config.regionName} 로컬 이야기 생성하기`}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
