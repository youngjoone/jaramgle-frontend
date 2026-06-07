"use client";

import { type ComponentType, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Globe2, Landmark, Layers3, Loader2, MapPin, Sailboat, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { BACKEND_ORIGIN, apiFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';

type ThemeKey = 'CITY_INTRO' | 'HERITAGE' | 'MULTICULTURAL';

type ThemeCard = {
  id: ThemeKey;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const themeCards: ThemeCard[] = [
  {
    id: 'CITY_INTRO',
    title: '부산 도시 소개',
    description: '부기와 함께 부산의 매력을 동화로 탐험해요.',
    icon: Compass,
  },
  {
    id: 'HERITAGE',
    title: '문화유산 탐험',
    description: '명소의 역사·유래를 모험 스토리로 풀어내요.',
    icon: Landmark,
  },
  {
    id: 'MULTICULTURAL',
    title: '다문화 우정 이야기',
    description: '다양한 문화권 친구들과 협력하는 이야기를 만들어요.',
    icon: Globe2,
  },
];

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
  totalCount?: number | null;
  total_count?: number | null;
};

declare global {
  interface Window {
    kakao?: any;
  }
}

function parseApiError(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed && typeof parsed === 'object' && typeof (parsed as { message?: string }).message === 'string') {
        return (parsed as { message: string }).message;
      }
    } catch {
      return err.message;
    }
  }
  return '부산 명소를 불러오지 못했습니다.';
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function textValue(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

function getAttractionKey(place: BusanAttractionSource): string {
  const raw = (place.sourceId || place.title || '').trim();
  return raw.length > 0 ? raw : `${place.title}-${place.address}`;
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
      <circle cx="${pointerX}" cy="${circleY}" r="${Math.round(radius * 0.35)}" fill="${stroke}" opacity="0.9"/>
    </svg>
  `.trim();

  const encodedSvg = encodeURIComponent(svg);
  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodedSvg}`,
    new kakao.maps.Size(size, size),
    {
      offset: new kakao.maps.Point(Math.round(size / 2), size),
    },
  );
}

let kakaoSdkPromise: Promise<any> | null = null;
const MAP_PREVIEW_PIN_LIMIT = 8;

function loadKakaoMapsSdk(appKey: string): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not available'));
  }

  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao);
  }

  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('kakao-map-sdk') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        if (!window.kakao?.maps) {
          reject(new Error('카카오맵 SDK 로드에 실패했습니다.'));
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
        reject(new Error('카카오맵 SDK 로드에 실패했습니다.'));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao));
    };

    script.onerror = () => reject(new Error('카카오맵 SDK 스크립트 로드 실패'));
    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}

export function BusanMainPage() {
  const router = useRouter();

  const [theme, setTheme] = useState<ThemeKey>('CITY_INTRO');
  const [attractions, setAttractions] = useState<BusanAttractionSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAttractionKey, setSelectedAttractionKey] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('전체');
  const [showAllMapPins, setShowAllMapPins] = useState(false);
  const [attractionTotalCount, setAttractionTotalCount] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const markerListRef = useRef<Array<{ key: string; marker: any }>>([]);
  const markerMapRef = useRef<Record<string, any>>({});
  const markerStyleRef = useRef<{ defaultImage: any; hoverImage: any; activeImage: any } | null>(null);
  const selectedKeyRef = useRef<string | null>(null);

  const kakaoAppKey = (process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || '').trim();

  const selectedAttraction = useMemo(() => {
    return attractions.find((item) => getAttractionKey(item) === selectedAttractionKey) ?? null;
  }, [attractions, selectedAttractionKey]);

  const districtOptions = useMemo(() => {
    const counts = new Map<string, number>();
    attractions.forEach((item) => {
      const district = item.district || '기타';
      counts.set(district, (counts.get(district) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort(([left], [right]) => left.localeCompare(right, 'ko'));
  }, [attractions]);

  const filteredAttractions = useMemo(() => {
    if (selectedDistrict === '전체') {
      return attractions;
    }
    return attractions.filter((item) => (item.district || '기타') === selectedDistrict);
  }, [attractions, selectedDistrict]);

  const mappedAttractions = useMemo(() => {
    return filteredAttractions.filter((item) => item.lat !== null && item.lng !== null);
  }, [filteredAttractions]);

  const visibleMapAttractions = useMemo(() => {
    if (showAllMapPins || searchKeyword || selectedDistrict !== '전체') {
      return mappedAttractions;
    }

    const preview = mappedAttractions.slice(0, MAP_PREVIEW_PIN_LIMIT);
    if (
      selectedAttraction
      && selectedAttraction.lat !== null
      && selectedAttraction.lng !== null
      && !preview.some((item) => getAttractionKey(item) === getAttractionKey(selectedAttraction))
    ) {
      return [selectedAttraction, ...preview.slice(0, Math.max(0, MAP_PREVIEW_PIN_LIMIT - 1))];
    }
    return preview;
  }, [mappedAttractions, searchKeyword, selectedAttraction, selectedDistrict, showAllMapPins]);

  const loadAttractions = async (keyword = '') => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const query = new URLSearchParams({ page: '1', size: '24' });
      if (keyword.trim()) {
        query.set('q', keyword.trim());
      }
      const data = await apiFetch<BusanAttractionPageResponse>(`/public/busan/attractions?${query.toString()}`);
      const totalCountRaw = data?.totalCount ?? data?.total_count;
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
          lat: parseNumber(item.lat),
          lng: parseNumber(item.lng),
        }))
        .filter((item) => item.title.length > 0);

      setAttractions(normalized);
      setAttractionTotalCount(typeof totalCountRaw === 'number' ? totalCountRaw : null);
      setSelectedDistrict('전체');
      setShowAllMapPins(Boolean(keyword.trim()));
      setSelectedAttractionKey((prev) => {
        if (prev && normalized.some((item) => getAttractionKey(item) === prev)) {
          return prev;
        }
        return null;
      });
    } catch (error) {
      setLoadError(parseApiError(error));
      setAttractions([]);
      setAttractionTotalCount(null);
      setSelectedDistrict('전체');
      setShowAllMapPins(false);
      setSelectedAttractionKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    selectedKeyRef.current = selectedAttractionKey;
  }, [selectedAttractionKey]);

  useEffect(() => {
    void loadAttractions('');
  }, []);

  useEffect(() => {
    if (!kakaoAppKey || !mapContainerRef.current) {
      return;
    }

    let cancelled = false;

    void loadKakaoMapsSdk(kakaoAppKey)
      .then((kakao) => {
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
            center: new kakao.maps.LatLng(35.1796, 129.0756),
            level: 8,
          });
          infoWindowRef.current = new kakao.maps.InfoWindow({ zIndex: 3 });
        }

        if (!markerStyleRef.current) {
          markerStyleRef.current = {
            defaultImage: createPinMarkerImage(kakao, 34, '#0284c7', '#ffffff'),
            hoverImage: createPinMarkerImage(kakao, 40, '#0ea5e9', '#ffffff'),
            activeImage: createPinMarkerImage(kakao, 46, '#f97316', '#ffffff'),
          };
        }

        markerListRef.current.forEach(({ marker }) => marker.setMap(null));
        markerListRef.current = [];
        markerMapRef.current = {};

        const bounds = new kakao.maps.LatLngBounds();

        visibleMapAttractions.forEach((item) => {
          const key = getAttractionKey(item);
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
            const content = `<div style="padding:7px 10px;font-size:12px;color:#0c4a6e;white-space:nowrap;">${item.title}</div>`;
            infoWindowRef.current?.setContent(content);
            infoWindowRef.current?.open(mapRef.current, marker);
          });

          kakao.maps.event.addListener(marker, 'mouseout', () => {
            if (selectedKeyRef.current !== key) {
              marker.setImage(markerStyleRef.current?.defaultImage);
              marker.setZIndex(1);
            }
            infoWindowRef.current?.close();
          });

          kakao.maps.event.addListener(marker, 'click', () => {
            setSelectedAttractionKey(key);
          });
        });

        if (visibleMapAttractions.length === 0) {
          infoWindowRef.current?.close();
          return;
        }

        if (visibleMapAttractions.length === 1) {
          mapRef.current.setCenter(new kakao.maps.LatLng(visibleMapAttractions[0].lat, visibleMapAttractions[0].lng));
          mapRef.current.setLevel(5);
        } else if (!bounds.isEmpty()) {
          mapRef.current.setBounds(bounds);
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setLoadError('카카오맵을 불러오지 못했습니다. 키/도메인 설정을 확인해 주세요.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kakaoAppKey, visibleMapAttractions]);

  useEffect(() => {
    if (!markerStyleRef.current) {
      return;
    }

    markerListRef.current.forEach(({ key, marker }) => {
      if (key === selectedAttractionKey) {
        marker.setImage(markerStyleRef.current?.activeImage);
        marker.setZIndex(10);
      } else {
        marker.setImage(markerStyleRef.current?.defaultImage);
        marker.setZIndex(1);
      }
    });

    if (!selectedAttractionKey) {
      return;
    }
    const marker = markerMapRef.current[selectedAttractionKey];
    const selected = attractions.find((item) => getAttractionKey(item) === selectedAttractionKey);
    if (!marker || !selected || !mapRef.current || selected.lat === null || selected.lng === null) {
      return;
    }
    mapRef.current.panTo(marker.getPosition());
  }, [selectedAttractionKey, attractions]);

  const mapPreviewLimited = mappedAttractions.length > visibleMapAttractions.length;
  const currentCountText = attractionTotalCount !== null
    ? `전체 ${attractionTotalCount}개 중 현재 ${filteredAttractions.length}개`
    : `현재 ${filteredAttractions.length}개`;

  const changeDistrict = (district: string) => {
    setSelectedDistrict(district);
    setSelectedAttractionKey(null);
    setShowAllMapPins(false);
  };

  const goCreate = (targetTheme: ThemeKey) => {
    const query = new URLSearchParams({ theme: targetTheme });
    if (selectedAttraction?.sourceId) {
      query.set('sourceId', selectedAttraction.sourceId);
    }
    router.push(`/busan/create?${query.toString()}`);
  };

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
                사진이 있는 부산 공공데이터 명소를 고르고, 부기와 함께 바로 동화로 바꿔보세요.
                원하는 주제를 먼저 고르고 동화 생성으로 이어가세요.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  className="rounded-full bg-gradient-to-r from-[#039BE5] to-[#0288D1] px-8 py-6 text-white shadow-[0_10px_24px_rgba(2,136,209,0.35)] hover:from-[#0277BD] hover:to-[#01579B]"
                  onClick={() => goCreate(theme)}
                >
                  {selectedAttraction ? '선택 명소로 동화 생성' : '동화 생성 페이지로 가기'}
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

        <section className="mt-8 rounded-[28px] border border-[#B3E5FC] bg-white/85 p-5 shadow-[0_12px_28px_rgba(2,136,209,0.12)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {themeCards.map((card) => {
                const Icon = card.icon;
                const active = theme === card.id;
                return (
                  <Button
                    key={card.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`rounded-full px-4 ${active ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]' : 'border-[#CFD8DC] bg-white text-[#546E7A]'}`}
                    onClick={() => setTheme(card.id)}
                  >
                    <Icon className="mr-1 h-4 w-4" /> {card.title}
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
                    void loadAttractions(keyword);
                  }
                }}
                placeholder="명소 검색 (예: 해운대, 영도대교)"
                className="w-64 border-[#B3E5FC]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-[#B3E5FC] text-[#0277BD] hover:bg-[#E1F5FE]"
                onClick={() => {
                  const keyword = searchInput.trim();
                  setSearchKeyword(keyword);
                  void loadAttractions(keyword);
                }}
              >
                <Search className="mr-1 h-4 w-4" /> 검색
              </Button>
            </div>
          </div>

          {searchKeyword && (
            <div className="mb-4 text-sm text-[#4F6D79]">검색어: <b>{searchKeyword}</b></div>
          )}

          <div className="mb-4 rounded-2xl border border-[#B3E5FC] bg-[#F8FDFF] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-black text-[#01579B]">
                <MapPin className="h-4 w-4 text-[#0288D1]" />
                지역별로 먼저 좁혀보기
              </div>
              <div className="text-xs font-semibold text-[#4F6D79]">
                {currentCountText} · 지도 표시 {visibleMapAttractions.length}개
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`shrink-0 rounded-full px-4 ${selectedDistrict === '전체' ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]' : 'border-[#D6F2FF] bg-white text-[#4F6D79]'}`}
                onClick={() => changeDistrict('전체')}
              >
                전체 {attractions.length}
              </Button>
              {districtOptions.map(([district, count]) => (
                <Button
                  key={district}
                  type="button"
                  size="sm"
                  variant="outline"
                  className={`shrink-0 rounded-full px-4 ${selectedDistrict === district ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]' : 'border-[#D6F2FF] bg-white text-[#4F6D79]'}`}
                  onClick={() => changeDistrict(district)}
                >
                  {district} {count}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="relative overflow-hidden rounded-2xl border border-[#B3E5FC] bg-[#EAF8FF]">
              {!kakaoAppKey ? (
                <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm text-[#0f766e]">
                  NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 설정되지 않았습니다.
                </div>
              ) : (
                <>
                  <div ref={mapContainerRef} className="h-[520px] w-full" />
                  <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)]">
                    <div className="pointer-events-auto rounded-2xl border border-[#B3E5FC] bg-white/95 p-3 shadow-[0_12px_28px_rgba(2,136,209,0.18)] backdrop-blur">
                      <div className="inline-flex items-center gap-2 text-xs font-black text-[#01579B]">
                        <Layers3 className="h-4 w-4 text-[#0288D1]" />
                        지도 핀 {visibleMapAttractions.length}/{mappedAttractions.length}
                      </div>
                      <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-[#4F6D79]">
                        기본 지도는 복잡하지 않게 대표 명소만 보여줘요. 지역을 고르거나 검색하면 더 정확하게 좁혀집니다.
                      </p>
                      {mapPreviewLimited && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2 h-8 rounded-full bg-[#0288D1] px-3 text-xs text-white hover:bg-[#0277BD]"
                          onClick={() => setShowAllMapPins(true)}
                        >
                          전체 핀 보기
                        </Button>
                      )}
                      {showAllMapPins && !searchKeyword && selectedDistrict === '전체' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-2 h-8 rounded-full border-[#B3E5FC] px-3 text-xs text-[#0277BD] hover:bg-[#E1F5FE]"
                          onClick={() => setShowAllMapPins(false)}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          대표만 보기
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-[#B3E5FC] bg-white p-4">
              <div className="text-sm font-semibold text-[#01579B]">선택된 명소</div>
              {selectedAttraction ? (
                <>
                  <div className="mt-3 overflow-hidden rounded-xl bg-[#EDF8FF]">
                    <ImageWithFallback
                      src={selectedAttraction.thumbnailUrl || selectedAttraction.imageUrl}
                      alt={selectedAttraction.title}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 text-lg font-bold text-[#0C4A6E]">{selectedAttraction.title}</div>
                  <div className="mt-1 text-sm text-[#4F6D79]">{selectedAttraction.district || '부산'} · {selectedAttraction.address || '주소 정보 없음'}</div>
                  <div className="mt-2 inline-flex rounded-full bg-[#E1F5FE] px-2.5 py-1 text-[11px] font-semibold text-[#0277BD]">
                    {selectedAttraction.dataSources || '부산 공공데이터 기반'}
                  </div>
                  <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-[#334155]">
                    {selectedAttraction.feature || selectedAttraction.intro || selectedAttraction.storyContext || selectedAttraction.subtitle || '설명 정보가 없습니다.'}
                  </p>
                  {selectedAttraction.photoKeywords && (
                    <p className="mt-2 line-clamp-2 text-xs font-semibold text-[#0288D1]">
                      관광사진 키워드 · {selectedAttraction.photoKeywords}
                    </p>
                  )}

                  <div className="mt-4 grid gap-2">
                    <Button
                      className="rounded-full bg-gradient-to-r from-[#039BE5] to-[#0288D1] text-white"
                      onClick={() => goCreate(theme)}
                    >
                      이 조건으로 생성하기
                    </Button>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[#B3E5FC] bg-[#F4FBFF] p-4 text-sm text-[#4F6D79]">
                  지도 또는 목록에서 명소를 선택하거나, 생성 페이지로 이동한 뒤 명소를 골라도 됩니다.
                  <Button
                    className="mt-3 w-full rounded-full bg-gradient-to-r from-[#039BE5] to-[#0288D1] text-white"
                    onClick={() => goCreate(theme)}
                  >
                    생성 페이지에서 명소 고르기
                  </Button>
                </div>
              )}

              <div className="mt-4 border-t border-[#E0F2FE] pt-3">
                <div className="mb-1 text-sm font-semibold text-[#01579B]">현재 조건의 추천 명소</div>
                <div className="mb-2 text-xs text-[#64748B]">
                  사진이 있는 공공데이터 장소만 보여줘요. {selectedDistrict !== '전체' ? `${selectedDistrict} 기준 ` : ''}{filteredAttractions.length}개
                </div>
                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                  {filteredAttractions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#B3E5FC] bg-[#F8FDFF] p-4 text-sm text-[#4F6D79]">
                      현재 조건에 맞는 명소가 없습니다. 다른 지역을 선택하거나 검색어를 바꿔보세요.
                    </div>
                  )}
                  {filteredAttractions.map((item) => {
                    const key = getAttractionKey(item);
                    const active = key === selectedAttractionKey;
                    const thumbnail = item.thumbnailUrl || item.imageUrl;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedAttractionKey(key)}
                        className={`flex w-full gap-3 rounded-xl border p-2 text-left text-sm transition ${active ? 'border-[#0288D1] bg-[#E1F5FE] text-[#01579B]' : 'border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FBFF]'}`}
                      >
                        <div className="h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#E0F7FA]">
                          <ImageWithFallback
                            src={thumbnail}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-1 font-semibold">{item.title}</div>
                          <div className="line-clamp-1 text-xs text-[#64748B]">{item.district || item.address || '부산'}</div>
                          <div className="mt-1 inline-flex rounded-full bg-[#E1F5FE] px-2 py-0.5 text-[10px] font-bold text-[#0277BD]">
                            사진 데이터
                          </div>
                          {item.photoKeywords && (
                            <div className="mt-1 line-clamp-1 text-[11px] text-[#0288D1]">{item.photoKeywords}</div>
                          )}
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
              {isLoading && (
                <div className="inline-flex items-center gap-2 rounded-full bg-[#E0F2FE] px-3 py-1 text-sm text-[#0369A1]">
                  <Loader2 className="h-4 w-4 animate-spin" /> 명소 데이터를 불러오는 중...
                </div>
              )}
              {loadError && (
                <div className="mt-2 rounded-xl border border-[#FECACA] bg-[#FFF5F5] px-3 py-2 text-sm text-[#B91C1C]">
                  {loadError}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
