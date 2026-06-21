export type LocalRegionSlug = 'daegu' | 'chungbuk';

export type LocalThemeKey = 'CITY_STORY' | 'HERITAGE' | 'NATURE_FRIENDSHIP';

export type LocalThemeConfig = {
  id: LocalThemeKey;
  title: string;
  description: string;
  topics: string[];
  objectives: string[];
  moral: string;
  promptDirectives: string[];
  requiredAnchors: string[];
};

export type LocalRegionConfig = {
  slug: LocalRegionSlug;
  apiRegion: string;
  regionCode: string;
  regionName: string;
  brandLabel: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  mascotName: string;
  mascotDescription: string;
  mascotBubble: string;
  mascotImagePath: string;
  mascotGenerationEnabled: boolean;
  mascotUsageNote: string;
  mascotSlugs: string[];
  mascotSearchNames: string[];
  visualMotif: string;
  mapCenter: { lat: number; lng: number };
  mapLevel: number;
  generationProfile: 'LOCAL_DAEGU' | 'LOCAL_CHUNGBUK';
  artStyle: string;
  searchExamples: string;
  placeholderExtra: string;
  emptyMessage: string;
  colors: {
    page: string;
    hero: string;
    panel: string;
    soft: string;
    softer: string;
    primary: string;
    primaryDark: string;
    accent: string;
    accentSoft: string;
    border: string;
    text: string;
    muted: string;
    pin: string;
    pinActive: string;
  };
  themes: Record<LocalThemeKey, LocalThemeConfig>;
};

const daeguThemes: Record<LocalThemeKey, LocalThemeConfig> = {
  CITY_STORY: {
    id: 'CITY_STORY',
    title: '대구 도시 이야기',
    description: '골목, 시장, 신천을 따라 대구의 오늘을 이야기로 만듭니다.',
    topics: ['대구 도시 소개', '골목과 시장 탐험'],
    objectives: ['대구의 도시 풍경을 친근하게 이해하기', '지역 명소를 일상 속 경험으로 연결하기'],
    moral: '도시는 함께 걷고 기억할 때 더 따뜻해져요.',
    promptDirectives: [
      '대구의 붉은 벽돌 골목, 시장의 활기, 신천의 물길 같은 도시 이미지를 장면으로 살린다.',
      '선택 장소를 단순 설명하지 말고 아이가 직접 발견하는 도시 탐험으로 구성한다.',
    ],
    requiredAnchors: ['대구', '도달쑤', '대구 공공데이터 장소'],
  },
  HERITAGE: {
    id: 'HERITAGE',
    title: '근대골목 시간여행',
    description: '대구의 역사·문화 장소를 과거와 현재가 만나는 모험으로 풀어냅니다.',
    topics: ['대구 문화유산', '근대골목 시간여행'],
    objectives: ['역사 장소의 의미를 어린이 눈높이로 이해하기', '과거와 현재를 연결해 생각하기'],
    moral: '오래된 이야기를 알면 오늘의 거리가 새롭게 보여요.',
    promptDirectives: [
      '제공된 공공데이터에 없는 연도, 인물, 사건은 지어내지 않는다.',
      '장소의 역사 정보는 설명문이 아니라 시간여행 장면과 대화 속에 녹인다.',
    ],
    requiredAnchors: ['대구 역사/문화 정보', '시간여행 장면'],
  },
  NATURE_FRIENDSHIP: {
    id: 'NATURE_FRIENDSHIP',
    title: '신천과 팔공산 친구들',
    description: '도시 속 자연과 친구들이 함께 문제를 해결하는 지역 이야기를 만듭니다.',
    topics: ['대구 자연 탐험', '친구와 협력'],
    objectives: ['도시와 자연이 함께 있는 지역 특성을 이해하기', '협력과 배려의 태도 배우기'],
    moral: '도시와 자연은 서로를 돌볼 때 함께 빛나요.',
    promptDirectives: [
      '도달쑤를 대구 신천을 좋아하는 밝은 수달 안내자로 등장시킨다.',
      '환경 보호를 훈계하지 말고 아이들이 자연스럽게 행동으로 배우는 장면을 넣는다.',
    ],
    requiredAnchors: ['도달쑤', '도시 속 자연', '친구와 협력'],
  },
};

const chungbukThemes: Record<LocalThemeKey, LocalThemeConfig> = {
  CITY_STORY: {
    id: 'CITY_STORY',
    title: '충북 마을 이야기',
    description: '내륙의 길, 마을, 호수를 따라 충북의 장소를 이야기로 엮습니다.',
    topics: ['충북 지역 소개', '내륙 여행 이야기'],
    objectives: ['충북의 지역성과 위치를 친근하게 이해하기', '장소가 가진 이야기를 발견하기'],
    moral: '조용한 길에도 오래 기억할 이야기가 숨어 있어요.',
    promptDirectives: [
      '충북의 내륙 풍경, 마을길, 물길, 산자락을 차분한 모험의 배경으로 살린다.',
      '선택 장소를 홍보문처럼 설명하지 말고 가족이 함께 발견하는 이야기로 만든다.',
    ],
    requiredAnchors: ['충북', '충북 공공데이터 장소'],
  },
  HERITAGE: {
    id: 'HERITAGE',
    title: '중원문화 탐험',
    description: '충북의 문화유산과 전통을 아이들이 따라가기 쉬운 탐험으로 바꿉니다.',
    topics: ['충북 문화유산', '중원문화 탐험'],
    objectives: ['문화유산의 배경과 가치를 이해하기', '지역의 역사성을 이야기로 기억하기'],
    moral: '옛사람의 마음을 알면 오늘의 길도 더 반듯하게 걸을 수 있어요.',
    promptDirectives: [
      '공공데이터에 없는 세부 역사 사실은 지어내지 않는다.',
      '충북 전래의 선비 정신과 올곧은 태도를 이야기의 행동과 선택으로 표현한다.',
    ],
    requiredAnchors: ['충북 문화유산 정보', '탐험 장면'],
  },
  NATURE_FRIENDSHIP: {
    id: 'NATURE_FRIENDSHIP',
    title: '청풍명월 자연 모험',
    description: '호수와 숲, 산길을 중심으로 맑은 자연 모험 이야기를 만듭니다.',
    topics: ['충북 자연 탐험', '호수와 숲'],
    objectives: ['자연과 지역 문화가 이어지는 방식을 이해하기', '서로 돕는 태도 배우기'],
    moral: '맑은 자연은 함께 지킬 때 오래 친구가 되어 줘요.',
    promptDirectives: [
      '청풍명월의 맑고 차분한 정서를 호수, 숲, 달빛, 산길 이미지로 표현한다.',
      '자연 보호 메시지는 직접 훈계보다 주인공의 선택과 행동으로 보여준다.',
    ],
    requiredAnchors: ['청풍명월', '호수와 숲', '친구와 협력'],
  },
};

export const LOCAL_STORY_REGIONS: Record<LocalRegionSlug, LocalRegionConfig> = {
  daegu: {
    slug: 'daegu',
    apiRegion: 'daegu',
    regionCode: 'DAEGU',
    regionName: '대구',
    brandLabel: 'Jaramgle × Daegu',
    navLabel: 'J×Daegu',
    eyebrow: '달구벌 로컬 스토리맵',
    title: '대구의 골목과 물길을 이야기로 걷다',
    subtitle: '사진이 있는 대구 공공데이터 장소를 고르고, 도달쑤와 함께 도시의 기억을 가족형 이야기책으로 바꿔보세요.',
    mascotName: '도달쑤',
    mascotDescription: '대구 도심 하천 신천에 사는 밝고 장난기 많은 수달 안내자',
    mascotBubble: '“신천 물길 따라 대구의 숨은 이야기를 찾아볼래?”',
    mascotImagePath: '/characters/daegu-dodalsu.png',
    mascotGenerationEnabled: true,
    mascotUsageNote: '대구광역시 공식 배포 이미지 · 공공누리 유형 2 기준 출처표시 및 비영리 공모전 용도로 사용',
    mascotSlugs: ['daegu-dodalsu', 'dodalsu', 'do-dal-ssu'],
    mascotSearchNames: ['도달쑤', '수달'],
    visualMotif: 'brick alley, warm sunset, sincheon otter trail',
    mapCenter: { lat: 35.8714, lng: 128.6014 },
    mapLevel: 8,
    generationProfile: 'LOCAL_DAEGU',
    artStyle: '2D 파스텔 동화책 삽화, 따뜻한 벽돌빛 골목, 신천 물길, 시장의 활기, no 3D',
    searchExamples: '예: 근대골목, 서문시장, 팔공산',
    placeholderExtra: '추가 요소를 입력하세요 (쉼표/줄바꿈 구분)\n예: 납작만두 냄새, 신천 산책길, 붉은 벽돌 골목',
    emptyMessage: '대구 사진 장소가 없습니다. 검색어를 바꾸거나 관리자에서 대구 공공데이터 동기화를 실행해 주세요.',
    colors: {
      page: 'radial-gradient(circle at 10% 0%, #FFF3E0 0%, #FFE0B2 32%, #FCE8D5 64%, #FFF8F1 100%)',
      hero: 'linear-gradient(135deg, rgba(255, 248, 240, 0.92), rgba(255, 236, 210, 0.86))',
      panel: '#FFF8F1',
      soft: '#FFE8CC',
      softer: '#FFF3E0',
      primary: '#D35400',
      primaryDark: '#7A2E0E',
      accent: '#F59E0B',
      accentSoft: '#FFF7D6',
      border: '#FDBA74',
      text: '#57220A',
      muted: '#7C4A25',
      pin: '#EA580C',
      pinActive: '#059669',
    },
    themes: daeguThemes,
  },
  chungbuk: {
    slug: 'chungbuk',
    apiRegion: 'chungbuk',
    regionCode: 'CHUNGBUK',
    regionName: '충북',
    brandLabel: 'Jaramgle × Chungbuk',
    navLabel: 'J×Chungbuk',
    eyebrow: '청풍명월 로컬 스토리맵',
    title: '호수와 숲 사이에서 충북 이야기를 만나다',
    subtitle: '충북 공식 마스코트 고드미·바르미를 만나보고, 사진이 있는 공공데이터 장소의 자연과 문화유산을 이야기책으로 엮어보세요.',
    mascotName: '고드미·바르미',
    mascotDescription: '올곧고 바른 마음으로 충북의 길을 안내하는 친근한 두 친구',
    mascotBubble: '충북의 올곧고 바른 마음을 상징하는 공식 마스코트입니다.',
    mascotImagePath: '/characters/chungbuk-godeumi-bareumi.jpg',
    mascotGenerationEnabled: false,
    mascotUsageNote: '충청북도 공식 원본 표시 전용 · 출처표시, 상업적 이용 금지, 변경 금지',
    mascotSlugs: ['chungbuk-godeumi-bareumi', 'godeumi-bareumi', 'godeumi', 'bareumi'],
    mascotSearchNames: ['고드미', '바르미'],
    visualMotif: 'moonlit lake, forest trail, calm inland heritage',
    mapCenter: { lat: 36.6357, lng: 127.4913 },
    mapLevel: 9,
    generationProfile: 'LOCAL_CHUNGBUK',
    artStyle: '2D 파스텔 동화책 삽화, 청풍명월의 호수와 숲, 차분한 달빛, 맑은 자연색, no 3D',
    searchExamples: '예: 청남대, 단양, 속리산',
    placeholderExtra: '추가 요소를 입력하세요 (쉼표/줄바꿈 구분)\n예: 호수 위 달빛, 숲길의 바람, 오래된 성문',
    emptyMessage: '충북 사진 장소가 없습니다. 검색어를 바꾸거나 관리자에서 충북 공공데이터 동기화를 실행해 주세요.',
    colors: {
      page: 'radial-gradient(circle at 80% 0%, #E0F2FE 0%, #D1FAE5 34%, #EEF8ED 68%, #F8FFF9 100%)',
      hero: 'linear-gradient(135deg, rgba(240, 253, 244, 0.92), rgba(224, 242, 254, 0.86))',
      panel: '#F8FFF9',
      soft: '#D1FAE5',
      softer: '#E0F2FE',
      primary: '#047857',
      primaryDark: '#064E3B',
      accent: '#0284C7',
      accentSoft: '#E0F2FE',
      border: '#86EFAC',
      text: '#063D2A',
      muted: '#376859',
      pin: '#059669',
      pinActive: '#0284C7',
    },
    themes: chungbukThemes,
  },
};

export const LOCAL_REGION_LIST = Object.values(LOCAL_STORY_REGIONS);

export function getLocalRegionConfig(slug: string | null | undefined): LocalRegionConfig | null {
  if (!slug) return null;
  const normalized = slug.toLowerCase().trim();
  if (normalized === 'daegu' || normalized === 'dg') return LOCAL_STORY_REGIONS.daegu;
  if (normalized === 'chungbuk' || normalized === 'cb' || normalized === 'chungcheongbuk') return LOCAL_STORY_REGIONS.chungbuk;
  return null;
}
