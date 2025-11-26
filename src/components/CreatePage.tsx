"use client";

import { useState, useRef } from 'react';
import { Wand2, Sparkles, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

const examplePrompts = [
  "하늘을 나는 법을 배우는 용감한 작은 용",
  "말하는 동물들이 사는 마법의 숲",
  "친절한 외계인과 함께하는 우주 모험",
  "인어공주의 바다 왕국",
  "시간 여행을 하는 테디베어",
  "과학을 사랑하는 공주님"
];

const ageGroups = ["0-3세", "4-6세", "7-9세", "10-12세"];
const genres = ["판타지", "모험", "교육", "자장가", "SF", "동화"];
const styles = ["수채화", "디지털", "만화", "사실적", "미니멀", "빈티지"];
const lengths = ["짧게 (8페이지)", "보통 (16페이지)", "길게 (24페이지)"];

const stylePresets = [
  { name: "수채화 꿈", color: "from-blue-400 to-purple-400" },
  { name: "디지털 팝", color: "from-pink-400 to-orange-400" },
  { name: "클래식 만화", color: "from-yellow-400 to-red-400" },
  { name: "부드러운 파스텔", color: "from-purple-300 to-pink-300" },
  { name: "대담하고 밝게", color: "from-green-400 to-blue-400" },
  { name: "빈티지 동화책", color: "from-amber-400 to-brown-400" },
  { name: "몽환적 구름", color: "from-cyan-300 to-blue-300" },
  { name: "석양 빛", color: "from-orange-300 to-pink-400" }
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

export function CreatePage() {
  const [prompt, setPrompt] = useState('');
  const [selectedAge, setSelectedAge] = useState('4-6세');
  const [selectedGenre, setSelectedGenre] = useState('판타지');
  const [selectedStyle, setSelectedStyle] = useState('수채화');
  const [selectedLength, setSelectedLength] = useState('보통 (16페이지)');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedStylePreset, setSelectedStylePreset] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const styleScrollRef = useRef<HTMLDivElement>(null);
  const characterScrollRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsGenerating(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 400);
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

        {/* Prompt Input */}
        <div className="mb-8">
          <div className="relative">
            <Textarea
              placeholder="동화책 아이디어를 설명해주세요... (예: 마법의 정원을 발견하는 호기심 많은 작은 여우)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[140px] bg-white border border-[#E0E0E0] text-[#1A1A1A] placeholder:text-[#757575] rounded-3xl px-6 py-4 text-lg focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:border-[#1A1A1A] transition-all"
            />
            <div className="absolute bottom-4 right-4">
              <Sparkles className="w-5 h-5 text-[#757575]" />
            </div>
          </div>
        </div>

        {/* Example Prompts */}
        <div className="mb-10">
          <p className="text-sm text-[#757575] font-medium mb-3">예시를 참고해보세요:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#1A1A1A] cursor-pointer transition-all px-4 py-2 rounded-full font-medium"
                onClick={() => setPrompt(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-6 mb-10">
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

          {/* Style */}
          <div>
            <label className="text-sm text-[#1A1A1A] font-semibold mb-3 block">아트 스타일</label>
            <div className="flex flex-wrap gap-2">
              {styles.map((style) => (
                <Button
                  key={style}
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-6 transition-all duration-300 ${
                    selectedStyle === style
                      ? 'bg-[#66BB6A]/10 text-[#388E3C] border-[#66BB6A]/30'
                      : 'bg-white border border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5] hover:border-[#66BB6A]/30'
                  }`}
                  onClick={() => setSelectedStyle(style)}
                >
                  {style}
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

        {/* Style Presets Slider */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#424242] font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#66BB6A]" />
              스타일 프리셋
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
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {stylePresets.map((preset, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => setSelectedStylePreset(preset.name)}
                className={`flex-shrink-0 w-48 h-36 rounded-3xl bg-gradient-to-br cursor-pointer shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${
                  selectedStylePreset === preset.name
                    ? 'ring-4 ring-[#66BB6A] ring-offset-2'
                    : 'border-2 border-[#E0E0E0]'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${preset.color} opacity-90`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#424242]/40 to-transparent flex items-end p-4">
                  <p className="text-white font-semibold drop-shadow-lg">{preset.name}</p>
                </div>
                {selectedStylePreset === preset.name && (
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
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {characterPresets.map((character, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -4 }}
                onClick={() => setSelectedCharacter(character.name)}
                className={`flex-shrink-0 w-40 h-52 rounded-3xl cursor-pointer shadow-lg hover:shadow-xl transition-all relative overflow-hidden ${
                  selectedCharacter === character.name
                    ? 'ring-4 ring-[#66BB6A] ring-offset-2'
                    : 'border-2 border-[#E0E0E0]'
                }`}
              >
                <ImageWithFallback
                  src={character.imageUrl}
                  alt={character.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#424242]/70 via-[#424242]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="text-white font-semibold drop-shadow-lg mb-1">{character.name}</p>
                  <Badge className="bg-white/80 text-[#66BB6A] border-0 text-xs">
                    {character.category}
                  </Badge>
                </div>
                {selectedCharacter === character.name && (
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

        {/* Generate Button */}
        <div className="mb-10">
          <Button
            className="w-full bg-gradient-to-r from-[#66BB6A] via-[#81C784] to-[#388E3C] hover:from-[#388E3C] hover:via-[#2E7D32] hover:to-[#1B5E20] text-white py-7 rounded-3xl shadow-[0_8px_32px_rgba(102,187,106,0.4)] hover:shadow-[0_12px_40px_rgba(102,187,106,0.5)] hover:scale-[1.02] transition-all duration-300 border-0"
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
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
