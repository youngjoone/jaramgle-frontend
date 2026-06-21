"use client";

import { type ComponentType, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Landmark, Layers3, Leaf, Loader2, MapPin, Search, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { BACKEND_ORIGIN, apiFetch } from '@/lib/api';
import { type LocalRegionConfig, type LocalThemeKey } from '@/lib/localStoryRegions';

type ThemeCard = {
  id: LocalThemeKey;
  icon: ComponentType<{ className?: string }>;
};

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
  page?: number | null;
  totalCount?: number | null;
  total_count?: number | null;
  hasNext?: boolean | null;
  has_next?: boolean | null;
};

declare global {
  interface Window {
    kakao?: any;
  }
}

let kakaoSdkPromise: Promise<any> | null = null;
const MAP_PREVIEW_PIN_LIMIT = 10;
const themeIcons: Record<LocalThemeKey, ComponentType<{ className?: string }>> = {
  CITY_STORY: Compass,
  HERITAGE: Landmark,
  NATURE_FRIENDSHIP: Leaf,
};

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

function parseApiError(err: unknown, regionName: string): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      const detail = (parsed as { detail?: { message?: string }; message?: string }).detail;
      if (detail?.message) return detail.message;
      if ((parsed as { message?: string }).message) return (parsed as { message?: string }).message || '';
    } catch {
      return err.message;
    }
  }
  return `${regionName} 장소 데이터를 불러오지 못했습니다.`;
}

function getSourceKey(place: LocalStorySource): string {
  const raw = (place.sourceId || place.title || '').trim();
  return raw.length > 0 ? raw : `${place.title}-${place.address}`;
}

function mergeSources(current: LocalStorySource[], incoming: LocalStorySource[]): LocalStorySource[] {
  const seen = new Set(current.map(getSourceKey));
  const merged = [...current];
  incoming.forEach((item) => {
    const key = getSourceKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });
  return merged;
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

function displayArea(place: LocalStorySource, fallbackRegion: string): string {
  if (place.district && !/^\d+$/.test(place.district)) return place.district;
  const addressParts = place.address.split(/\s+/).filter(Boolean);
  const district = addressParts.find((part) => /[시군구]$/.test(part));
  return district || place.address || fallbackRegion;
}

function createPinMarkerImage(kakao: any, size: number, fill: string, stroke: string) {
  const strokeWidth = Math.max(2, Math.round(size * 0.08));
  const circleY = Math.round(size * 0.36);
  const radius = Math.round(size * 0.24);
  const pointerX = Math.round(size * 0.5);
  const pointerTop = Math.round(size * 0.52);
  const pointerBottom = Math.round(size * 0.9);
  const pointerLeft = Math.round(size * 0.36);
  const pointerRight = Math.round(size * 0.64);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <path d="M ${pointerX} ${pointerBottom} L ${pointerLeft} ${pointerTop} L ${pointerRight} ${pointerTop} Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
      <circle cx="${pointerX}" cy="${circleY}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
      <circle cx="${pointerX}" cy="${circleY}" r="${Math.round(radius * 0.35)}" fill="${stroke}" opacity="0.95"/>
    </svg>
  `.trim();

  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    new kakao.maps.Size(size, size),
    { offset: new kakao.maps.Point(Math.round(size / 2), size) },
  );
}

function loadKakaoMapsSdk(appKey: string): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window is not available'));
  if (window.kakao?.maps) return Promise.resolve(window.kakao);
  if (kakaoSdkPromise) return kakaoSdkPromise;

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('kakao-map-sdk') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        if (!window.kakao?.maps) {
          reject(new Error('카카오맵 SDK 로드 실패'));
          return;
        }
        window.kakao.maps.load(() => resolve(window.kakao));
      });
      existing.addEventListener('error', () => reject(new Error('카카오맵 SDK 스크립트 로드 실패')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error('카카오맵 SDK 로드 실패'));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = () => reject(new Error('카카오맵 SDK 스크립트 로드 실패'));
    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}

export function LocalStoryRegionPage({ config }: { config: LocalRegionConfig }) {
  const router = useRouter();
  const [theme, setTheme] = useState<LocalThemeKey>('CITY_STORY');
  const [sources, setSources] = useState<LocalStorySource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedArea, setSelectedArea] = useState('전체');
  const [showAllMapPins, setShowAllMapPins] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const markerListRef = useRef<Array<{ key: string; marker: any }>>([]);
  const markerMapRef = useRef<Record<string, any>>({});
  const markerStyleRef = useRef<{ defaultImage: any; hoverImage: any; activeImage: any } | null>(null);
  const selectedKeyRef = useRef<string | null>(null);
  const kakaoAppKey = (process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '').trim();

  const themeCards: ThemeCard[] = useMemo(
    () => (Object.keys(config.themes) as LocalThemeKey[]).map((id) => ({ id, icon: themeIcons[id] })),
    [config.themes],
  );

  const selectedSource = useMemo(
    () => sources.find((item) => getSourceKey(item) === selectedSourceKey) ?? null,
    [sources, selectedSourceKey],
  );

  const areaOptions = useMemo(() => {
    const counts = new Map<string, number>();
    sources.forEach((item) => {
      const area = displayArea(item, config.regionName);
      counts.set(area, (counts.get(area) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right, 'ko'));
  }, [config.regionName, sources]);

  const filteredSources = useMemo(() => {
    if (selectedArea === '전체') return sources;
    return sources.filter((item) => displayArea(item, config.regionName) === selectedArea);
  }, [config.regionName, selectedArea, sources]);

  const mappedSources = useMemo(
    () => filteredSources.filter((item) => item.lat !== null && item.lng !== null),
    [filteredSources],
  );

  const visibleMapSources = useMemo(() => {
    if (showAllMapPins || searchKeyword || selectedArea !== '전체') return mappedSources;
    const preview = mappedSources.slice(0, MAP_PREVIEW_PIN_LIMIT);
    if (
      selectedSource &&
      selectedSource.lat !== null &&
      selectedSource.lng !== null &&
      !preview.some((item) => getSourceKey(item) === getSourceKey(selectedSource))
    ) {
      return [selectedSource, ...preview.slice(0, Math.max(0, MAP_PREVIEW_PIN_LIMIT - 1))];
    }
    return preview;
  }, [mappedSources, searchKeyword, selectedArea, selectedSource, showAllMapPins]);

  const loadSources = async (keyword = '', targetPage = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setLoadError(null);

    try {
      const query = new URLSearchParams({ page: String(targetPage), size: '24' });
      if (keyword.trim()) query.set('q', keyword.trim());
      const data = await apiFetch<LocalStoryPageResponse>(`/public/local/${config.apiRegion}/sources?${query.toString()}`);
      const normalized = (Array.isArray(data?.items) ? data.items : [])
        .map(normalizeSource)
        .filter((item) => item.title.length > 0 && (item.thumbnailUrl || item.imageUrl));
      const nextSources = append ? mergeSources(sources, normalized) : normalized;
      const totalCountRaw = data?.totalCount ?? data?.total_count;
      setSources(nextSources);
      setPage(data?.page ?? targetPage);
      setHasNext(Boolean(data?.hasNext ?? data?.has_next));
      setTotalCount(typeof totalCountRaw === 'number' ? totalCountRaw : null);
      if (!append) {
        setSelectedArea('전체');
        setShowAllMapPins(Boolean(keyword.trim()));
      }
      setSelectedSourceKey((prev) => {
        if (prev && nextSources.some((item) => getSourceKey(item) === prev)) return prev;
        return null;
      });
    } catch (error) {
      setLoadError(parseApiError(error, config.regionName));
      if (!append) {
        setSources([]);
        setPage(1);
        setHasNext(false);
        setTotalCount(null);
        setSelectedArea('전체');
        setSelectedSourceKey(null);
        setShowAllMapPins(false);
      }
    } finally {
      if (append) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  };

  useEffect(() => {
    selectedKeyRef.current = selectedSourceKey;
  }, [selectedSourceKey]);

  useEffect(() => {
    void loadSources('', 1, false);
  }, [config.apiRegion]);

  useEffect(() => {
    if (!kakaoAppKey || !mapContainerRef.current) return;
    let cancelled = false;

    void loadKakaoMapsSdk(kakaoAppKey)
      .then((kakao) => {
        if (cancelled || !mapContainerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
            center: new kakao.maps.LatLng(config.mapCenter.lat, config.mapCenter.lng),
            level: config.mapLevel,
          });
          infoWindowRef.current = new kakao.maps.InfoWindow({ zIndex: 3 });
        }

        if (!markerStyleRef.current) {
          markerStyleRef.current = {
            defaultImage: createPinMarkerImage(kakao, 34, config.colors.pin, '#ffffff'),
            hoverImage: createPinMarkerImage(kakao, 40, config.colors.accent, '#ffffff'),
            activeImage: createPinMarkerImage(kakao, 46, config.colors.pinActive, '#ffffff'),
          };
        }

        markerListRef.current.forEach(({ marker }) => marker.setMap(null));
        markerListRef.current = [];
        markerMapRef.current = {};
        const bounds = new kakao.maps.LatLngBounds();

        visibleMapSources.forEach((item) => {
          if (item.lat === null || item.lng === null) return;
          const key = getSourceKey(item);
          const marker = new kakao.maps.Marker({
            map: mapRef.current,
            position: new kakao.maps.LatLng(item.lat, item.lng),
            title: item.title,
            image: markerStyleRef.current?.defaultImage,
            zIndex: 1,
          });
          markerListRef.current.push({ key, marker });
          markerMapRef.current[key] = marker;
          bounds.extend(new kakao.maps.LatLng(item.lat, item.lng));

          kakao.maps.event.addListener(marker, 'mouseover', () => {
            if (selectedKeyRef.current !== key) {
              marker.setImage(markerStyleRef.current?.hoverImage);
              marker.setZIndex(6);
            }
            infoWindowRef.current?.setContent(`<div style="padding:7px 10px;font-size:12px;color:${config.colors.primaryDark};white-space:nowrap;">${item.title}</div>`);
            infoWindowRef.current?.open(mapRef.current, marker);
          });
          kakao.maps.event.addListener(marker, 'mouseout', () => {
            if (selectedKeyRef.current !== key) {
              marker.setImage(markerStyleRef.current?.defaultImage);
              marker.setZIndex(1);
            }
            infoWindowRef.current?.close();
          });
          kakao.maps.event.addListener(marker, 'click', () => setSelectedSourceKey(key));
        });

        if (visibleMapSources.length === 0) {
          infoWindowRef.current?.close();
          mapRef.current.setCenter(new kakao.maps.LatLng(config.mapCenter.lat, config.mapCenter.lng));
          mapRef.current.setLevel(config.mapLevel);
          return;
        }
        if (visibleMapSources.length === 1) {
          const only = visibleMapSources[0];
          if (only.lat !== null && only.lng !== null) {
            mapRef.current.setCenter(new kakao.maps.LatLng(only.lat, only.lng));
            mapRef.current.setLevel(5);
          }
        } else if (!bounds.isEmpty()) {
          mapRef.current.setBounds(bounds);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('카카오맵을 불러오지 못했습니다. 키/도메인 설정을 확인해 주세요.');
      });

    return () => {
      cancelled = true;
    };
  }, [config, kakaoAppKey, visibleMapSources]);

  useEffect(() => {
    if (!markerStyleRef.current) return;
    markerListRef.current.forEach(({ key, marker }) => {
      if (key === selectedSourceKey) {
        marker.setImage(markerStyleRef.current?.activeImage);
        marker.setZIndex(10);
      } else {
        marker.setImage(markerStyleRef.current?.defaultImage);
        marker.setZIndex(1);
      }
    });
    if (!selectedSourceKey) return;
    const marker = markerMapRef.current[selectedSourceKey];
    if (marker && mapRef.current) mapRef.current.panTo(marker.getPosition());
  }, [selectedSourceKey, sources]);

  const mapPreviewLimited = mappedSources.length > visibleMapSources.length;
  const currentCountText = totalCount !== null
    ? `전체 ${totalCount}개 중 ${sources.length}개 불러옴 · 현재 조건 ${filteredSources.length}개`
    : `현재 ${filteredSources.length}개`;

  const goCreate = (targetTheme: LocalThemeKey) => {
    const query = new URLSearchParams({ theme: targetTheme });
    if (selectedSource?.sourceId) query.set('sourceId', selectedSource.sourceId);
    router.push(`/${config.slug}/create?${query.toString()}`);
  };

  return (
    <div className="min-h-screen px-6 py-10 md:px-10" style={{ background: config.colors.page }}>
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[38px] border p-8 shadow-[0_26px_54px_rgba(15,23,42,0.12)] backdrop-blur md:p-12" style={{ background: config.colors.hero, borderColor: config.colors.border }}>
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${config.colors.accent}33` }} />
          <div className="absolute -bottom-24 left-8 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${config.colors.primary}24` }} />
          <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-1 text-sm font-black" style={{ borderColor: config.colors.border, color: config.colors.primary }}>
                <Sparkles className="h-4 w-4" />
                {config.brandLabel}
              </div>
              <h1 className="text-4xl font-black leading-tight md:text-5xl" style={{ color: config.colors.primaryDark, fontFamily: "'Jua', 'Do Hyeon', sans-serif" }}>
                {config.title}
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed md:text-base" style={{ color: config.colors.muted }}>
                {config.subtitle}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className="rounded-full px-8 py-6 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                  style={{ background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})` }}
                  onClick={() => goCreate(theme)}
                >
                  {selectedSource ? '선택 장소로 이야기 생성' : '생성 페이지로 가기'}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full bg-white/70 px-7 py-6"
                  style={{ borderColor: config.colors.border, color: config.colors.primary }}
                  onClick={() => router.push('/local')}
                >
                  지역 콜라보 보기
                </Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mx-auto w-full max-w-[340px] rounded-[34px] border bg-white/80 p-5 shadow-lg"
              style={{ borderColor: config.colors.border }}
            >
              <div className="mb-3 text-sm font-black" style={{ color: config.colors.primary }}>{config.eyebrow}</div>
              <div className="relative overflow-hidden rounded-3xl p-5" style={{ background: `linear-gradient(145deg, ${config.colors.softer}, ${config.colors.soft})` }}>
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/50 blur-xl" />
                <div className="relative flex h-52 items-center justify-center">
                  <ImageWithFallback
                    src={`${BACKEND_ORIGIN}${config.mascotImagePath}`}
                    alt={`${config.regionName} 공식 캐릭터 ${config.mascotName}`}
                    className="h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(15,23,42,0.14)]"
                  />
                </div>
              </div>
              <div className="mt-3 text-center text-xs font-black" style={{ color: config.colors.primary }}>
                {config.mascotName} · {config.mascotDescription}
              </div>
              <div className="mt-3 rounded-2xl bg-white/90 px-4 py-3 text-sm font-bold leading-relaxed" style={{ color: config.colors.primaryDark }}>
                {config.mascotBubble}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed" style={{ color: config.colors.muted }}>
                {config.mascotUsageNote}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border bg-white/86 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.1)] md:p-6" style={{ borderColor: config.colors.border }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {themeCards.map((card) => {
                const Icon = card.icon;
                const active = theme === card.id;
                const item = config.themes[card.id];
                return (
                  <Button
                    key={card.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                    style={{
                      borderColor: active ? config.colors.primary : '#CBD5E1',
                      backgroundColor: active ? config.colors.softer : '#FFFFFF',
                      color: active ? config.colors.primaryDark : '#526170',
                    }}
                    onClick={() => setTheme(card.id)}
                  >
                    <Icon className="mr-1 h-4 w-4" /> {item.title}
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const keyword = searchInput.trim();
                    setSearchKeyword(keyword);
                    void loadSources(keyword, 1, false);
                  }
                }}
                placeholder={config.searchExamples}
                className="w-64 bg-white"
                style={{ borderColor: config.colors.border }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                style={{ borderColor: config.colors.border, color: config.colors.primary }}
                onClick={() => {
                  const keyword = searchInput.trim();
                  setSearchKeyword(keyword);
                  void loadSources(keyword, 1, false);
                }}
              >
                <Search className="mr-1 h-4 w-4" /> 검색
              </Button>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: config.colors.panel, borderColor: config.colors.border }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-black" style={{ color: config.colors.primaryDark }}>
                <MapPin className="h-4 w-4" style={{ color: config.colors.primary }} />
                장소를 좁혀서 고르기
              </div>
              <div className="text-xs font-semibold" style={{ color: config.colors.muted }}>
                {currentCountText} · 지도 표시 {visibleMapSources.length}개
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 rounded-full px-4"
                style={{
                  borderColor: selectedArea === '전체' ? config.colors.primary : config.colors.border,
                  backgroundColor: selectedArea === '전체' ? config.colors.softer : '#FFFFFF',
                  color: selectedArea === '전체' ? config.colors.primaryDark : config.colors.muted,
                }}
                onClick={() => {
                  setSelectedArea('전체');
                  setSelectedSourceKey(null);
                  setShowAllMapPins(false);
                }}
              >
                전체 {sources.length}
              </Button>
              {areaOptions.map(([area, count]) => (
                <Button
                  key={area}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-full px-4"
                  style={{
                    borderColor: selectedArea === area ? config.colors.primary : config.colors.border,
                    backgroundColor: selectedArea === area ? config.colors.softer : '#FFFFFF',
                    color: selectedArea === area ? config.colors.primaryDark : config.colors.muted,
                  }}
                  onClick={() => {
                    setSelectedArea(area);
                    setSelectedSourceKey(null);
                    setShowAllMapPins(false);
                  }}
                >
                  {area} {count}
                </Button>
              ))}
            </div>
            {hasNext && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3">
                <div className="text-xs font-semibold leading-relaxed" style={{ color: config.colors.muted }}>
                  아직 더 많은 {config.regionName} 장소가 있습니다. 다음 데이터를 불러오면 지도와 목록에 이어서 추가됩니다.
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full px-4"
                  disabled={isLoadingMore}
                  style={{ borderColor: config.colors.primary, backgroundColor: config.colors.softer, color: config.colors.primaryDark }}
                  onClick={() => loadSources(searchKeyword, page + 1, true)}
                >
                  {isLoadingMore ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />불러오는 중</> : '다음 24개 불러오기'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.42fr_0.58fr]">
            <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: config.colors.border, backgroundColor: config.colors.softer }}>
              {!kakaoAppKey ? (
                <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm" style={{ color: config.colors.primaryDark }}>
                  NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.
                </div>
              ) : (
                <>
                  <div ref={mapContainerRef} className="h-[520px] w-full" />
                  <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)]">
                    <div className="pointer-events-auto rounded-2xl border bg-white/95 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.16)] backdrop-blur" style={{ borderColor: config.colors.border }}>
                      <div className="inline-flex items-center gap-2 text-xs font-black" style={{ color: config.colors.primaryDark }}>
                        <Layers3 className="h-4 w-4" style={{ color: config.colors.primary }} />
                        지도 핀 {visibleMapSources.length}/{mappedSources.length}
                      </div>
                      <p className="mt-1 max-w-[270px] text-[11px] leading-relaxed" style={{ color: config.colors.muted }}>
                        대표 핀만 먼저 보여주고, 검색·지역 필터로 더 정확하게 탐색합니다.
                      </p>
                      {mapPreviewLimited && (
                        <Button type="button" size="sm" className="mt-2 h-8 rounded-full px-3 text-xs text-white" style={{ backgroundColor: config.colors.primary }} onClick={() => setShowAllMapPins(true)}>
                          전체 핀 보기
                        </Button>
                      )}
                      {showAllMapPins && !searchKeyword && selectedArea === '전체' && (
                        <Button type="button" size="sm" variant="outline" className="mt-2 h-8 rounded-full px-3 text-xs" style={{ borderColor: config.colors.border, color: config.colors.primary }} onClick={() => setShowAllMapPins(false)}>
                          <X className="mr-1 h-3.5 w-3.5" /> 대표만 보기
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-4" style={{ borderColor: config.colors.border }}>
              <div className="text-sm font-black" style={{ color: config.colors.primaryDark }}>선택된 장소</div>
              {selectedSource ? (
                <>
                  <div className="mt-3 overflow-hidden rounded-xl" style={{ backgroundColor: config.colors.softer }}>
                    <ImageWithFallback src={selectedSource.thumbnailUrl || selectedSource.imageUrl} alt={selectedSource.title} className="h-40 w-full object-cover" />
                  </div>
                  <div className="mt-3 text-lg font-black" style={{ color: config.colors.primaryDark }}>{selectedSource.title}</div>
                  <div className="mt-1 text-sm" style={{ color: config.colors.muted }}>{displayArea(selectedSource, config.regionName)} · {selectedSource.address || '주소 정보 없음'}</div>
                  <div className="mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: config.colors.softer, color: config.colors.primary }}>
                    {selectedSource.dataSources || `${config.regionName} 공공데이터 기반`}
                  </div>
                  <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-[#334155]">
                    {selectedSource.storySeed || selectedSource.feature || selectedSource.intro || selectedSource.storyContext || selectedSource.subtitle || '설명 정보가 없습니다.'}
                  </p>
                  {selectedSource.photoKeywords && <p className="mt-2 line-clamp-2 text-xs font-bold" style={{ color: config.colors.primary }}>사진 키워드 · {selectedSource.photoKeywords}</p>}
                  <Button className="mt-4 w-full rounded-full text-white" style={{ background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})` }} onClick={() => goCreate(theme)}>
                    이 조건으로 생성하기
                  </Button>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: config.colors.border, backgroundColor: config.colors.panel, color: config.colors.muted }}>
                  지도 또는 목록에서 장소를 선택하거나, 생성 페이지로 이동한 뒤 장소를 골라도 됩니다.
                  <Button className="mt-3 w-full rounded-full text-white" style={{ background: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.accent})` }} onClick={() => goCreate(theme)}>
                    생성 페이지에서 장소 고르기
                  </Button>
                </div>
              )}

              <div className="mt-4 border-t pt-3" style={{ borderColor: config.colors.border }}>
                <div className="mb-1 text-sm font-black" style={{ color: config.colors.primaryDark }}>추천 장소</div>
                <div className="mb-2 text-xs" style={{ color: config.colors.muted }}>사진이 있는 공공데이터 장소만 보여줍니다. {filteredSources.length}개</div>
                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                  {filteredSources.length === 0 && (
                    <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: config.colors.border, backgroundColor: config.colors.panel, color: config.colors.muted }}>
                      현재 조건에 맞는 장소가 없습니다. 다른 지역을 선택하거나 검색어를 바꿔보세요.
                    </div>
                  )}
                  {filteredSources.map((item) => {
                    const key = getSourceKey(item);
                    const active = key === selectedSourceKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedSourceKey(key)}
                        className="flex w-full gap-3 rounded-xl border p-2 text-left text-sm transition hover:-translate-y-0.5"
                        style={{
                          borderColor: active ? config.colors.primary : '#E2E8F0',
                          backgroundColor: active ? config.colors.softer : '#FFFFFF',
                          color: active ? config.colors.primaryDark : '#334155',
                        }}
                      >
                        <div className="h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: config.colors.softer }}>
                          <ImageWithFallback src={item.thumbnailUrl || item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-1 font-bold">{item.title}</div>
                          <div className="line-clamp-1 text-xs text-[#64748B]">{displayArea(item, config.regionName)}</div>
                          <div className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black" style={{ backgroundColor: config.colors.softer, color: config.colors.primary }}>
                            사진 데이터
                          </div>
                          <div className="mt-1 line-clamp-1 text-[11px]" style={{ color: config.colors.primary }}>{item.photoKeywords || item.storySeed}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {(isLoading || loadError) && (
            <div className="mt-4">
              {isLoading && <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm" style={{ backgroundColor: config.colors.softer, color: config.colors.primaryDark }}><Loader2 className="h-4 w-4 animate-spin" /> 장소 데이터를 불러오는 중...</div>}
              {loadError && <div className="mt-2 rounded-xl border border-[#FECACA] bg-[#FFF5F5] px-3 py-2 text-sm text-[#B91C1C]">{loadError}</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
