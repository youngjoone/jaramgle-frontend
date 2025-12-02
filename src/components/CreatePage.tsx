"use client";

import { useEffect, useRef, useState } from 'react';
import { Wand2, Sparkles, ChevronLeft, ChevronRight, User, Star, Plus, Lightbulb, PenLine, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { apiFetch, BACKEND_ORIGIN } from '@/lib/api';
import { useRouter } from 'next/navigation';

const ageGroups = ["0-3세", "4-6세", "7-9세", "10-12세"];
const genres = ["판타지", "모험", "교육", "자장가", "SF", "동화"];
const lengths = ["10페이지", "15페이지", "20페이지"];
const languages = ["한국어", "English"];
const learningGoals = ["과학", "수학", "영어", "한글", "역사", "자연", "예술", "생활습관"];

const elementPresets = [
  "마법 열쇠",
  "구름 위 성",
  "반짝이는 지도",
  "시간을 알려주는 별시계",
  "무지개 다리",
  "빛나는 지팡이",
  "친구 로봇",
  "용감한 고양이",
  "숨겨진 비밀 문",
  "노래하는 꽃"
];

// 아트 스타일 프리셋 (통합)
const artStylePresets = [
  { name: "수채화 꿈", color: "from-blue-400 to-purple-400", style: "수채화" },
  { name: "디지털 팝", color: "from-pink-400 to-orange-400", style: "디지털" },
  { name: "클래식 만화", color: "from-yellow-400 to-red-400", style: "만화" },
  { name: "부드러운 파스텔", color: "from-purple-300 to-pink-300", style: "파스텔" },
  { name: "대담하고 밝게", color: "from-green-400 to-blue-400", style: "밝은" },
  { name: "빈티지 동화책", color: "from-amber-400 to-brown-400", style: "빈티지" },
  { name: "몽환적 구름", color: "from-cyan-300 to-blue-300", style: "몽환적" },
  { name: "석양 빛", color: "from-orange-300 to-pink-400", style: "따뜻한" },
  { name: "사실적 일러스트", color: "from-slate-400 to-gray-500", style: "사실적" },
  { name: "미니멀 라인", color: "from-gray-300 to-slate-400", style: "미니멀" }
];

// 동화책 교훈 프리셋
const moralPresets = [
  "용기를 내면 무엇이든 할 수 있어요",
  "친구와 함께하면 더 즐거워요",
  "정직은 가장 소중한 가치예요",
  "다름을 인정하고 존중해요",
  "실패해도 다시 도전하는 게 중요해요",
  "작은 친절이 큰 변화를 만들어요",
  "가족의 사랑은 언제나 함께해요",
  "꿈을 향해 노력하면 이루어져요",
  "자연을 사랑하고 보호해요",
  "나눔의 기쁨을 알아가요"
];

const characterPresets = [
  {
    name: "작은 여우",
    category: "동물",
    imageUrl: "https://images.unsplash.com/photo-1610308700652-d931026f7eec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZm94JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc2MjE1NjMxMXww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    name: "귀여운 토끼",
    category: "동물",
    imageUrl: "https://images.unsplash.com/photo-1759664809407-6ac782fbae97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "테디베어",
    category: "동물",
    imageUrl: "https://images.unsplash.com/photo-1675622988617-793a6dac8778?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "작은 소녀",
    category: "사람",
    imageUrl: "https://images.unsplash.com/photo-1673047233994-78df05226bfc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "작은 소년",
    category: "사람",
    imageUrl: "https://images.unsplash.com/photo-1606072640087-14e6ec05ec2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "공주님",
    category: "사람",
    imageUrl: "https://images.unsplash.com/photo-1743964451700-c10e1d6e647d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "용",
    category: "판타지",
    imageUrl: "https://images.unsplash.com/photo-1610926597998-fc7f2c1b89b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "유니콘",
    category: "판타지",
    imageUrl: "https://images.unsplash.com/photo-1615884900442-deedf8e593f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "로봇",
    category: "SF",
    imageUrl: "https://images.unsplash.com/photo-1603356033288-acfcb54801e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    name: "외계인 친구",
    category: "SF",
    imageUrl: "https://images.unsplash.com/photo-1568918745743-40b4aa95d8e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  }
];

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
  persona?: string | null;
  catchphrase?: string | null;
  promptKeywords?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  visualDescription?: string | null;
  descriptionPrompt?: string | null;
  modelingStatus?: string | null;
  scope?: string | null;
  artStyle?: string | null;
};

export function CreatePage() {
  const router = useRouter();
  const [selectedAge, setSelectedAge] = useState('4-6세');
  const [selectedGenre, setSelectedGenre] = useState('판타지');
  const [selectedLength, setSelectedLength] = useState('15페이지');
  const [selectedLanguage, setSelectedLanguage] = useState('한국어');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>([]);
  const [selectedArtStyle, setSelectedArtStyle] = useState<string | null>("수채화 꿈");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [requiredElementsText, setRequiredElementsText] = useState('');
  const [globalCharacters, setGlobalCharacters] = useState<CharacterCard[]>([]);
  const [myCharacters, setMyCharacters] = useState<CharacterCard[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);

  // 교훈 관련 상태
  const [selectedMoral, setSelectedMoral] = useState<string | null>(null);
  const [isCustomMoral, setIsCustomMoral] = useState(false);
  const [customMoralText, setCustomMoralText] = useState('');

  const styleScrollRef = useRef<HTMLDivElement>(null);
  const characterScrollRef = useRef<HTMLDivElement>(null);
  const myCharacterScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const normalizeImageUrl = (url?: string | null) => {
      if (!url) return null;
      if (/^https?:\/\//i.test(url)) return url;
      return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
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
        const globals = await apiFetch<CharacterDto[]>("/public/characters");
        if (mounted) {
          setGlobalCharacters(globals.slice(0, 10).map((c) => mapCharacter(c, "추천 캐릭터")));
        }
      } catch (err) {
        console.error("추천 캐릭터 불러오기 실패", err);
        if (mounted) {
          setGlobalCharacters(characterPresets.map((c, idx) => ({
            id: -(idx + 1),
            name: c.name,
            category: c.category,
            imageUrl: c.imageUrl,
          })));
        }
      }

      try {
        const mine = await apiFetch<CharacterDto[]>("/characters/me");
        if (mounted) {
          setMyCharacters(mine.slice(0, 10).map((c) => mapCharacter(c, "내 캐릭터")));
        }
      } catch (err) {
        console.error("내 캐릭터 불러오기 실패", err);
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

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleMoralSelect = (moral: string) => {
    setSelectedMoral(moral);
    setIsCustomMoral(false);
    setCustomMoralText('');
  };

  const handleCustomMoralClick = () => {
    setIsCustomMoral(true);
    setSelectedMoral(null);
  };

  const handleNoMoralClick = () => {
    setSelectedMoral(null);
    setIsCustomMoral(false);
    setCustomMoralText('');
  };

  const scrollMyCharacters = (direction: 'left' | 'right') => {
    if (myCharacterScrollRef.current) {
      const scrollAmount = 300;
      myCharacterScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const parseRequiredElements = () => {
    return requiredElementsText
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(5);

    const minPages = parseInt(selectedLength.replace(/[^0-9]/g, ""), 10) || 10;
    const characterIds = selectedCharacterIds.filter((id) => id > 0).slice(0, 2);
    const languageCode = selectedLanguage === "한국어" ? "KO" : "EN";
    const moralText = isCustomMoral ? customMoralText.trim() : (selectedMoral || "").trim();
    const requiredElements = parseRequiredElements();

    const payload: Record<string, unknown> = {
      age_range: selectedAge,
      topics: [selectedGenre],
      objectives: selectedGoals, // 빈 배열 허용
      min_pages: Math.min(20, Math.max(10, minPages)),
      language: languageCode,
      character_ids: characterIds,
    };

    if (selectedArtStyle) {
      payload.art_style = selectedArtStyle;
    }
    if (moralText) {
      payload.moral = moralText;
    }
    if (requiredElements.length > 0) {
      payload.required_elements = requiredElements;
    }

    try {
      // 1) 글 생성
      const story = await apiFetch<{ id: number }>("/stories", {
        method: "POST",
        body: payload,
      });
      setProgress(50);

      // 2) 이미지/스토리북 생성
      await apiFetch(`/stories/${story.id}/storybook`, {
        method: "POST",
      });
      setProgress(100);
      router.push("/my-books");
    } catch (err: any) {
      console.error("동화 생성/스토리북 생성 실패", err);
      alert("동화 또는 이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const scrollStylePresets = (direction: 'left' | 'right') => {
    if (styleScrollRef.current) {
      const scrollAmount = 300;
      styleScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollCharacters = (direction: 'left' | 'right') => {
    if (characterScrollRef.current) {
      const scrollAmount = 300;
      characterScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#FFFFFF]">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#66BB6A] flex items-center justify-center shadow-sm">
              <Wand2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-[#1A1A1A] font-bold">동화책 생성</h1>
          </div>
          <p className="text-[#757575] font-normal">
            이야기를 설명하고 생생하게 살아나는 것을 지켜보세요
          </p>
        </div>

        {/* Parameters */}
        <div className="space-y-6 mb-10">
          {/* Language Selection */}
          <div>
            <label className="text-sm text-[#1A1A1A] font-semibold mb-3 block">언어</label>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <Button
                  key={language}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-6 transition-all duration-300 ${
                    selectedLanguage === language
                      ? 'bg-[#66BB6A]/10 text-[#388E3C] border-[#66BB6A]/30'
                      : 'bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#66BB6A]/30'
                  }`}
                  onClick={() => setSelectedLanguage(language)}
                >
                  {language}
                </Button>
              ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <label className="text-sm text-[#1A1A1A] font-semibold mb-3 block">학습 목표 (복수 선택 가능)</label>
            <div className="flex flex-wrap gap-2">
              {learningGoals.map((goal) => (
                <Button
                  key={goal}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-6 transition-all duration-300 ${
                    selectedGoals.includes(goal)
                      ? 'bg-[#66BB6A]/10 text-[#388E3C] border-[#66BB6A]/30'
                      : 'bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#66BB6A]/30'
                  }`}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </Button>
              ))}
            </div>
          </div>

          {/* Age Group */}
          <div>
            <label className="text-sm text-[#1A1A1A] font-semibold mb-3 block">연령대</label>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map((age) => (
                <Button
                  key={age}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-6 transition-all duration-300 ${
                    selectedAge === age
                      ? 'bg-[#66BB6A]/10 text-[#388E3C] border-[#66BB6A]/30'
                      : 'bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#66BB6A]/30'
                  }`}
                  onClick={() => setSelectedAge(age)}
                >
                  {age}
                </Button>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="text-sm text-[#1A1A1A] font-semibold mb-3 block">장르</label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-6 transition-all duration-300 ${
                    selectedGenre === genre
                      ? 'bg-[#66BB6A]/10 text-[#388E3C] border-[#66BB6A]/30'
                      : 'bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#66BB6A]/30'
                  }`}
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div>
            <label className="text-sm text-[#1A1A1A] font-semibold mb-3 block">동화 길이</label>
            <div className="flex flex-wrap gap-2">
              {lengths.map((length) => (
                <Button
                  key={length}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-6 transition-all duration-300 ${
                    selectedLength === length
                      ? 'bg-[#66BB6A]/10 text-[#388E3C] border-[#66BB6A]/30'
                      : 'bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#66BB6A]/30'
                  }`}
                  onClick={() => setSelectedLength(length)}
                >
                  {length}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Required Elements */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#66BB6A]" />
            <h3 className="text-[#424242] font-semibold">꼭 등장했으면 하는 요소 (선택)</h3>
          </div>
          <Textarea
            placeholder="예: 무지개 다리, 노래하는 꽃, 반짝이는 지도"
            value={requiredElementsText}
            onChange={(e) => setRequiredElementsText(e.target.value)}
            className="w-full min-h-[100px] bg-white border border-[#E0E0E0] text-[#1A1A1A] placeholder:text-[#757575] rounded-3xl px-6 py-4 text-lg focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:border-[#1A1A1A] transition-all"
          />
          <p className="text-xs text-[#757575] mt-2">쉼표 또는 줄바꿈으로 여러 개를 입력할 수 있어요.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {elementPresets.map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="cursor-pointer transition-all px-4 py-2 rounded-full font-medium bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#66BB6A]/30"
                onClick={() => setRequiredElementsText((prev) => prev ? `${prev}\n${item}` : item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Moral/Lesson Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-[#FFA726]" />
            <h3 className="text-[#424242] font-semibold">동화책 교훈</h3>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full px-5 transition-all duration-300 ${
                !selectedMoral && !isCustomMoral
                  ? 'bg-[#FFA726]/10 text-[#F57C00] border-[#FFA726]/30'
                  : 'bg-white border border-[#E0E0E0] text-[#757575] hover:bg-[#FFF3E0] hover:border-[#FFA726]/30'
              }`}
              onClick={handleNoMoralClick}
            >
              <X className="w-4 h-4 mr-1" />
              선택 안함
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`rounded-full px-5 transition-all duration-300 ${
                isCustomMoral
                  ? 'bg-[#FFA726]/10 text-[#F57C00] border-[#FFA726]/30'
                  : 'bg-white border border-[#E0E0E0] text-[#757575] hover:bg-[#FFF3E0] hover:border-[#FFA726]/30'
              }`}
              onClick={handleCustomMoralClick}
            >
              <PenLine className="w-4 h-4 mr-1" />
              직접 입력
            </Button>
          </div>

          {/* Custom Input Field */}
          <AnimatePresence>
            {isCustomMoral && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <Textarea
                  placeholder="동화책에 담고 싶은 교훈을 직접 입력해주세요..."
                  value={customMoralText}
                  onChange={(e) => setCustomMoralText(e.target.value)}
                  className="w-full min-h-[80px] bg-[#FFF3E0]/30 border border-[#FFA726]/30 text-[#1A1A1A] placeholder:text-[#757575] rounded-2xl px-4 py-3 focus-visible:ring-2 focus-visible:ring-[#FFA726] focus-visible:border-[#FFA726] transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Moral Presets */}
          {!isCustomMoral && (
            <div className="flex flex-wrap gap-2">
              {moralPresets.map((moral, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`cursor-pointer transition-all px-4 py-2 rounded-full font-medium ${
                    selectedMoral === moral
                      ? 'bg-[#FFA726]/10 text-[#F57C00] border-[#FFA726]/50'
                      : 'bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#FFF3E0] hover:border-[#FFA726]/30'
                  }`}
                  onClick={() => handleMoralSelect(moral)}
                >
                  {moral}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Art Style Presets */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#424242] font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#66BB6A]" />
              아트 스타일
            </h3>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => scrollStylePresets('left')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#F1F8E9] border border-[#E0E0E0] shadow-md transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-[#66BB6A]" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => scrollStylePresets('right')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#F1F8E9] border border-[#E0E0E0] shadow-md transition-all"
              >
                <ChevronRight className="w-5 h-5 text-[#66BB6A]" />
              </Button>
            </div>
          </div>
          <div
            ref={styleScrollRef}
            className="flex gap-4 pt-4 pb-6 px-3 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {artStylePresets.map((preset, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => setSelectedArtStyle(preset.name)}
                className={`flex-shrink-0 w-48 h-36 rounded-3xl bg-gradient-to-br cursor-pointer shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${
                  selectedArtStyle === preset.name
                    ? 'ring-4 ring-[#66BB6A] ring-offset-2'
                    : 'border-2 border-[#E0E0E0]'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${preset.color} opacity-90`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#424242]/40 to-transparent flex items-end p-4">
                  <div>
                    <p className="text-white font-semibold drop-shadow-lg">{preset.name}</p>
                    <p className="text-white/80 text-xs drop-shadow-lg">{preset.style}</p>
                  </div>
                </div>
                {selectedArtStyle === preset.name && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-5 h-5 text-[#66BB6A]" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Character Selection Slider */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#424242] font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-[#66BB6A]" />
              캐릭터 선택
            </h3>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => scrollCharacters('left')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#F1F8E9] border border-[#E0E0E0] shadow-md transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-[#66BB6A]" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => scrollCharacters('right')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#F1F8E9] border border-[#E0E0E0] shadow-md transition-all"
              >
                <ChevronRight className="w-5 h-5 text-[#66BB6A]" />
              </Button>
            </div>
          </div>
          <div
            ref={characterScrollRef}
            className="flex gap-4 pt-4 pb-6 px-3 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoadingCharacters && (
              <div className="text-sm text-[#757575] px-3">캐릭터를 불러오는 중입니다...</div>
            )}
            {!isLoadingCharacters && globalCharacters.map((character) => (
              <motion.div
                key={character.id}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => {
                  if (character.id > 0) {
                    setSelectedCharacterIds((prev) => {
                      if (prev.includes(character.id)) {
                        return prev.filter((id) => id !== character.id);
                      }
                      if (prev.length >= 2) return prev; // 최대 2개
                      return [...prev, character.id];
                    });
                  }
                }}
                className={`flex-shrink-0 w-40 h-52 rounded-3xl cursor-pointer shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${
                  selectedCharacterIds.includes(character.id)
                    ? 'ring-4 ring-[#66BB6A] ring-offset-2'
                    : 'border-2 border-[#E0E0E0]'
                }`}
              >
                {character.imageUrl ? (
                  <ImageWithFallback
                    src={character.imageUrl}
                    alt={character.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm text-gray-600">
                    이미지 준비중
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#424242]/70 via-[#424242]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="text-white font-semibold drop-shadow-lg mb-1">{character.name}</p>
                  <Badge className="bg-white/80 text-[#66BB6A] border-0 text-xs">
                    {character.category}
                  </Badge>
                </div>
                {selectedCharacterIds.includes(character.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-5 h-5 text-[#66BB6A]" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* My Characters Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#424242] font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FFA726]" />
              내 캐릭터
            </h3>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => scrollMyCharacters('left')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#FFF3E0] border border-[#E0E0E0] shadow-md transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-[#FFA726]" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => scrollMyCharacters('right')}
                className="w-10 h-10 rounded-full bg-white hover:bg-[#FFF3E0] border border-[#E0E0E0] shadow-md transition-all"
              >
                <ChevronRight className="w-5 h-5 text-[#FFA726]" />
              </Button>
            </div>
          </div>
          <div
            ref={myCharacterScrollRef}
            className="flex gap-4 pt-4 pb-6 px-3 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Add New Character Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              className="flex-shrink-0 w-40 h-52 rounded-3xl cursor-pointer shadow-lg hover:shadow-xl transition-all relative overflow-hidden border-2 border-dashed border-[#FFA726]/50 bg-[#FFF3E0]/30 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-[#FFA726]/20 flex items-center justify-center">
                <Plus className="w-7 h-7 text-[#FFA726]" />
              </div>
              <p className="text-[#FFA726] font-semibold text-sm">캐릭터 추가</p>
            </motion.div>

            {myCharacters.map((character) => (
              <motion.div
                key={character.id}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => {
                  if (character.id > 0) {
                    setSelectedCharacterIds((prev) => {
                      if (prev.includes(character.id)) {
                        return prev.filter((id) => id !== character.id);
                      }
                      if (prev.length >= 2) return prev; // 최대 2개
                      return [...prev, character.id];
                    });
                  }
                }}
                className={`flex-shrink-0 w-40 h-52 rounded-3xl cursor-pointer shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${
                  selectedCharacterIds.includes(character.id)
                    ? 'ring-4 ring-[#FFA726] ring-offset-2'
                    : 'border-2 border-[#E0E0E0]'
                }`}
              >
                {character.imageUrl ? (
                  <ImageWithFallback
                    src={character.imageUrl}
                    alt={character.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm text-gray-600">
                    이미지 준비중
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#424242]/70 via-[#424242]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="text-white font-semibold drop-shadow-lg mb-1">{character.name}</p>
                  <Badge className="bg-[#FFA726]/80 text-white border-0 text-xs">
                    {character.category}
                  </Badge>
                </div>
                {selectedCharacterIds.includes(character.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg"
                  >
                    <Star className="w-5 h-5 text-[#FFA726]" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-10">
          <Button
            className="w-full bg-gradient-to-r from-[#66BB6A] via-[#81C784] to-[#388E3C] hover:from-[#388E3C] hover:via-[#2E7D32] hover:to-[#1B5E20] text-white py-7 rounded-3xl shadow-[0_8px_32px_rgba(102,187,106,0.4)] hover:shadow-[0_12px_40px_rgba(102,187,106,0.5)] hover:scale-[1.02] transition-all duration-300 border-0"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2 justify-center font-semibold">
                <Sparkles className="w-6 h-6 animate-spin" />
                동화책 생성 중...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center font-semibold">
                <Wand2 className="w-6 h-6" />
                동화책 생성하기
              </span>
            )}
          </Button>

          {/* Progress Bar */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4"
              >
                <Progress value={progress} className="h-3 bg-[#E0E0E0]" />
                <p className="text-sm text-[#757575] font-medium mt-2 text-center">
                  {progress < 30 && "이야기를 만들고 있어요..."}
                  {progress >= 30 && progress < 60 && "일러스트를 그리고 있어요..."}
                  {progress >= 60 && progress < 90 && "마법을 뿌리고 있어요..."}
                  {progress >= 90 && "거의 완성되었어요!"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
