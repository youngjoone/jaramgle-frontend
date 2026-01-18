"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, BACKEND_ORIGIN } from '@/lib/api';
import Confetti from 'react-confetti';

interface StoryPage {
  id: number; // pageId
  pageNo: number;
  imageUrl?: string | null;
  image_url?: string | null;
  text: string;
  audioUrl?: string | null;
}

interface StoryBookViewerPageProps {
  storybook: {
    id: number;
    title: string;
    author: string;
    shareSlug?: string | null;
    language?: string;
  };
  onClose: () => void;
}

interface QuizItem {
  question: string;
  options: string[];
  answer: number;
}

// Crayon O Animation Component
const CrayonO = () => (
  <motion.svg
    width="150"
    height="150"
    viewBox="0 0 100 100"
    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.2 }}
  >
    <motion.path
      d="M 50, 10 a 40,40 0 1,0 0,80 a 40,40 0 1,0 0,-80"
      fill="none"
      stroke="#FF5252"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="300"
      strokeDashoffset="300"
      animate={{ strokeDashoffset: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ filter: "url(#crayon-texture)" }}
    />
    <defs>
      <filter id="crayon-texture">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
      </filter>
    </defs>
  </motion.svg>
);

export function StoryBookViewerPage({ storybook, onClose }: StoryBookViewerPageProps) {
  const [stage, setStage] = useState<'cover' | 'reading' | 'quiz'>('cover');
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storyId, setStoryId] = useState(storybook.id);

  // Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [voicePreset, setVoicePreset] = useState<string>('default');
  const [autoPlay, setAutoPlay] = useState<boolean>(false); // 현재 페이지 반복 재생
  const [autoFlip, setAutoFlip] = useState<boolean>(false); // 음성 끝나면 다음 페이지 이동
  const [pendingAutoPlay, setPendingAutoPlay] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [translationMap, setTranslationMap] = useState<Record<number, string>>({});
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translationLanguage, setTranslationLanguage] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const placeholderImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80";

  const normalizeImage = (url?: string | null) => {
    if (!url) return placeholderImage;
    if (/^https?:\/\//i.test(url)) return url;
    return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const normalizeAudio = (url?: string | null) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
  };

  // Auto-focus on mount for keyboard accessibility
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Load preferred voice preset saved during creation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voicePreset');
      if (saved) {
        setVoicePreset(saved);
      }
      const savedAutoPlay = localStorage.getItem('storybookAutoPlay');
      if (savedAutoPlay) {
        setAutoPlay(savedAutoPlay === 'true');
      }
      const savedAutoFlip = localStorage.getItem('storybookAutoFlip');
      if (savedAutoFlip) {
        setAutoFlip(savedAutoFlip === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const applyTranslation = (translation: any, tl?: string) => {
      if (!translation || typeof translation !== 'object') return;
      const map: Record<number, string> = {};
      if (Array.isArray(translation.pages)) {
        translation.pages.forEach((p: any, idx: number) => {
          const pageNo = p.page ?? p.pageNo ?? p.page_no;
          if (pageNo != null && p.text) {
            map[Number(pageNo)] = p.text;
          }
          // 인덱스 기반 예비 매핑(페이지 번호가 누락된 경우 대비)
          if (p.text) {
            map[idx + 1] = map[idx + 1] || p.text;
          }
        });
      }
      if (!mounted) return;
      setTranslationMap(map);
      setTranslatedTitle(translation.title || null);
      // translationLanguage가 비어 있어도 번역본이 존재하면 기본값을 채워 토글이 비활성화되지 않도록 처리
      const resolvedLang = tl || (translation.language as string) || 'TRANSLATION';
      setTranslationLanguage(resolvedLang);
    };
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setTranslationMap({});
      setTranslatedTitle(null);
      setTranslationLanguage(null);
      setShowTranslation(false);
      setStage('cover');
      setCoverImage(null);
      setQuizzes([]);
      setQuizIndex(0);
      setQuizFeedback(null);
      setQuizComplete(false);
      setCurrentPage(0);
      try {
        // 공유 피드(shareSlug만 있는 카드)인 경우, 공개 상세 API 사용
        if (storybook.id <= 0 && storybook.shareSlug) {
          const detail = await apiFetch<{
            story: {
              id: number;
              title: string;
              pages?: any[];
              storybookPages?: any[];
              translation?: any;
              translationLanguage?: string;
              translation_language?: string;
              coverImageUrl?: string;
              cover_image_url?: string;
              quiz?: QuizItem[];
            };
            storybookPages?: any[];
          }>(`/public/shared-stories/${storybook.shareSlug}`);
          if (!mounted) return;
          setStoryId(detail.story.id || 0);
          let sbPages = (detail.storybookPages && detail.storybookPages.length > 0)
            ? detail.storybookPages
            : (detail.story.storybookPages || []);
          const basePages = detail.story.pages || [];

          // 이미지가 없으면 백엔드 스토리북 페이지도 시도(로그인 상태일 때만 성공)
          if ((!sbPages || sbPages.length === 0) && detail.story.id > 0) {
            try {
              const more = await apiFetch<Array<{
                id: number;
                pageNumber: number;
                text: string;
                imageUrl?: string | null;
                image_url?: string | null;
                audioUrl?: string | null;
              }>>(`/stories/${detail.story.id}/storybook/pages`);
              if (more && more.length > 0) {
                sbPages = more;
              }
            } catch (e) {
              console.warn("공유 스토리북 이미지 추가 조회 실패", e);
            }
          }

          const chosen = (sbPages && sbPages.length > 0 ? sbPages : basePages);
          const sorted = chosen
            .map((p: any, idx: number) => ({
              id: p.id || 0,
              pageNo: p.pageNumber ?? p.pageNo ?? p.page ?? (idx + 1),
              text: p.text,
              imageUrl: normalizeImage(p.imageUrl || p.image_url || null),
              audioUrl: normalizeAudio(p.audioUrl),
            }))
            .sort((a: any, b: any) => (a.pageNo ?? 0) - (b.pageNo ?? 0));
          setPages(sorted);
          setCurrentPage(0);
          setCoverImage(normalizeImage(detail.story.coverImageUrl || (detail.story as any).cover_image_url || null));
          setQuizzes(detail.story.quiz || (detail.story as any).quiz || []);
          const sharedTL = detail.story.translationLanguage
            || (detail.story as any).translation_language
            || (detail.story.translation as any)?.language;
          applyTranslation(detail.story.translation, sharedTL as string | undefined);
          return;
        }

        // 우선 스토리북 페이지(이미지 포함)를 시도
        try {
          const sbPages = await apiFetch<Array<{
            id: number;
            pageNumber: number;
            text: string;
            imageUrl?: string | null;
            image_url?: string | null;
            audioUrl?: string | null;
          }>>(`/stories/${storybook.id}/storybook/pages`);

          if (mounted && sbPages && sbPages.length > 0) {
            const sortedSb = sbPages
              .map((p, idx) => ({
                id: p.id,
                pageNo: p.pageNumber ?? (idx + 1),
                text: p.text,
                imageUrl: normalizeImage(p.imageUrl || (p as any).image_url || null),
                audioUrl: normalizeAudio(p.audioUrl),
              }))
              .sort((a, b) => (a.pageNo ?? 0) - (b.pageNo ?? 0));
            setPages(sortedSb);
            setCurrentPage(0);
            setIsLoading(false);
            try {
              const detail = await apiFetch<any>(`/stories/${storybook.id}`);
              if (mounted && detail) {
                const tl = detail.translationLanguage
                  || detail.translation_language
                  || (detail.translation as any)?.language;
                applyTranslation(detail.translation, tl as string | undefined);
                setCoverImage(normalizeImage(detail.coverImageUrl || detail.cover_image_url || null));
                setQuizzes(detail.quiz || []);
              }
            } catch (e) {
              console.warn("번역 정보 조회 실패", e);
            }
            return;
          }
        } catch (e) {
          // 스토리북 없으면 원본 스토리 페이지로 fallback
          console.warn("스토리북 페이지 조회 실패, 원본 페이지로 대체", e);
        }

        // fallback: 스토리 상세(텍스트 위주, 이미지 없을 수 있음)
        // Note: Fallback pages might not have IDs compatible with audio generation if they are not StorybookPages
        const detail = await apiFetch<{ pages?: any[] }>(`/stories/${storybook.id}`);
        if (!mounted) return;
        const sorted = (detail.pages || [])
          .map((p: any, idx: number) => ({
            id: p.id || 0, // Fallback ID, might fail audio gen if 0
            pageNo: p.pageNo ?? p.page ?? (idx + 1),
            text: p.text,
            imageUrl: normalizeImage(p.imageUrl || p.image_url || null),
            audioUrl: null,
          }))
          .sort((a: any, b: any) => (a.pageNo ?? 0) - (b.pageNo ?? 0));
        setPages(sorted);
        setCurrentPage(0);
        setCoverImage(normalizeImage((detail as any).coverImageUrl || (detail as any).cover_image_url || null));
        setQuizzes((detail as any).quiz || []);
        const tl = (detail as any).translationLanguage
          || (detail as any).translation_language
          || ((detail as any).translation as any)?.language;
        applyTranslation((detail as any).translation, tl as string | undefined);
      } catch (err) {
        console.error("스토리 상세 불러오기 실패", err);
        if (mounted) setError("스토리 내용을 불러오지 못했습니다.");
      }
      finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [storybook.id]);

  // Stop audio when page changes or component unmounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentPage]);

  // Stop audio when stage changes away from reading
  useEffect(() => {
    if (stage !== 'reading' && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [stage]);

  // Animation State
  const [flippingState, setFlippingState] = useState<'idle' | 'next' | 'prev'>('idle');

  // Page flip animation variants
  const flipVariants = {
    initial: (direction: number) => ({
      rotateY: direction > 0 ? 0 : -180,
      zIndex: 50,
    }),
    animate: (direction: number) => ({
      rotateY: direction > 0 ? -180 : 0,
      zIndex: 50,
      transition: {
        duration: 0.8,
        ease: [0.645, 0.045, 0.355, 1.000] as any, // cubic-bezier for smooth paper feel
      }
    }),
    exit: {
      opacity: 0 // Should not happen in manual state, but for safety
    }
  };

  const handleNextPage = useCallback(() => {
    if (flippingState !== 'idle') return;
    if (stage === 'cover') {
      setStage('reading');
      return;
    }
    if (stage === 'quiz') {
      return;
    }
    if (stage === 'reading') {
      if (currentPage < pages.length - 1) {
        setDirection(1);
        setFlippingState('next');
        return;
      }
      if (quizzes.length > 0) {
        setStage('quiz');
        setQuizIndex(0);
        setQuizFeedback(null);
        return;
      }
    }
  }, [stage, flippingState, currentPage, pages.length, quizzes.length]);

  const handlePrevPage = useCallback(() => {
    if (flippingState !== 'idle') return;
    if (stage === 'quiz') {
      setStage('reading');
      setCurrentPage(Math.max(pages.length - 1, 0));
      setQuizFeedback(null);
      setQuizComplete(false);
      return;
    }
    if (stage === 'cover') return;
    if (stage === 'reading') {
      if (currentPage === 0) {
        setStage('cover');
        return;
      }
      setDirection(-1);
      setFlippingState('prev');
    }
  }, [stage, flippingState, currentPage, pages.length]);

  const onFlipComplete = () => {
    if (flippingState === 'next') {
      setCurrentPage(prev => prev + 1);
    } else if (flippingState === 'prev') {
      setCurrentPage(prev => prev - 1);
    }
    setFlippingState('idle');
  };

  // When auto-play requested, try to play on the new page after flip completes
  // Auto-play hook: wait after page change then play
  useEffect(() => {
    if (!autoPlay || !pendingAutoPlay || stage !== 'reading') return;
    const timer = setTimeout(() => {
      handlePlayAudio();
      setPendingAutoPlay(false);
    }, 1500); // allow assets to settle
    return () => clearTimeout(timer);
  }, [currentPage, autoPlay, pendingAutoPlay, stage]); // handlePlayAudio defined later in scope

  // Helper to render a single page face
  const renderPageFace = (pageIndex: number, side: 'left' | 'right') => {
    const page = pages[pageIndex];
    if (!page) return <div className="w-full h-full bg-[#FDFBF7]" />; // Empty/Cover

    const isImage = side === 'left';
    const pageText = showTranslation && translationMap[page.pageNo] ? translationMap[page.pageNo] : page.text;

    return (
      <div className="w-full h-full relative overflow-hidden bg-[#FDFBF7]">
        {/* Paper Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/paper.png")` }}></div>

        {/* Spine Gradient/Shadow */}
        {side === 'left' ? (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-10 mix-blend-multiply"></div>
        ) : (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10 mix-blend-multiply"></div>
        )}

        {isImage ? (
          <div className="w-full h-full p-6 md:p-10 flex items-center justify-center">
            <div className="relative w-full h-full rounded-sm overflow-hidden shadow-inner border border-black/5 bg-white">
              <img
                src={page.imageUrl || placeholderImage}
                alt={`Page ${page.pageNo}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none"></div>
            </div>
            <div className="absolute bottom-4 left-6 text-[#8D6E63] font-serif text-sm opacity-60">
              {pageIndex * 2 + 1}
            </div>
          </div>
        ) : (
          <div className="w-full h-full p-8 md:p-14 flex items-center justify-center">
            <div className="prose prose-lg md:prose-xl font-serif text-[#4E342E] leading-loose text-center whitespace-pre-wrap">
              {pageText}
            </div>
            <div className="absolute bottom-4 right-6 text-[#8D6E63] font-serif text-sm opacity-60">
              {pageIndex * 2 + 2}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper to render a blank page face (for flipping animation)
  const renderBlankFace = (side: 'left' | 'right') => {
    return (
      <div className="w-full h-full relative overflow-hidden bg-[#FDFBF7]">
        {/* Paper Texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/paper.png")` }}></div>

        {/* Spine Gradient/Shadow */}
        {side === 'left' ? (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none z-10 mix-blend-multiply"></div>
        ) : (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none z-10 mix-blend-multiply"></div>
        )}
      </div>
    );
  };

  const renderCover = () => {
    const hasImage = !!coverImage;
    return (
      <div
        className="relative h-full aspect-[0.75/1] max-h-[700px] flex items-center justify-center perspective-[2000px] group cursor-pointer"
        onClick={handleNextPage}
        title="클릭하거나 → 키로 펼치기"
      >
        {/* Book Cover Container */}
        <div className="relative w-full h-full bg-[#5D4037] rounded-r-md rounded-l-sm shadow-2xl transform-style-3d transition-transform duration-500 group-hover:rotate-y-[-5deg] group-hover:translate-x-2">

          {/* Spine (Left Edge) */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#3E2723] via-[#5D4037] to-[#3E2723] rounded-l-sm z-20 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.3)]"></div>

          {/* Spine Highlight */}
          <div className="absolute left-2 top-0 bottom-0 w-[1px] bg-white/10 z-20"></div>

          {/* Front Cover Surface */}
          <div className="absolute inset-0 left-12 bg-[#5D4037] rounded-r-md border-t-2 border-b-2 border-r-2 border-[#3E2723] flex flex-col items-center p-8 overflow-hidden">
            {/* Leather Texture Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
              style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/leather.png")` }}></div>

            {/* Decorative Border Frame */}
            <div className="absolute inset-4 border border-[#8D6E63]/30 rounded-sm pointer-events-none"></div>
            <div className="absolute inset-6 border border-[#8D6E63]/20 rounded-sm pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col items-center text-center">
              <div className="mt-8 mb-2 text-xs uppercase tracking-[0.3em] text-[#D7CCC8]">Storybook</div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#EFEBE9] leading-tight drop-shadow-md px-4 break-keep">
                {displayTitle}
              </h1>
              <div className="w-12 h-[1px] bg-[#D7CCC8]/50 my-6"></div>

              {/* Cover Image Area */}
              <div className="flex-1 w-full flex items-center justify-center p-4">
                {hasImage ? (
                  <div className="relative w-full max-w-[80%] aspect-[3/4] rounded-sm overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.3)] border-4 border-[#3E2723] bg-[#3E2723]">
                    <img
                      src={coverImage || placeholderImage}
                      alt="표지"
                      className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                    {/* Inner Shadow */}
                    <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] pointer-events-none"></div>
                  </div>
                ) : (
                  <div className="w-full max-w-[80%] aspect-[3/4] rounded-sm border-2 border-dashed border-[#D7CCC8]/30 flex items-center justify-center text-[#D7CCC8]/50">
                    <span className="text-sm">No Cover Image</span>
                  </div>
                )}
              </div>


            </div>
          </div>

          {/* Page Block (Right Edge Thickness) */}
          <div className="absolute right-0 top-2 bottom-2 w-4 bg-[#FDFBF7] transform translate-x-full translate-z-[-2px] rounded-r-sm border-l border-gray-300"
            style={{
              background: 'repeating-linear-gradient(90deg, #f5f5f5, #f5f5f5 1px, #e0e0e0 2px, #e0e0e0 3px)',
              transform: 'rotateY(90deg) translateX(-2px)',
              transformOrigin: 'right center'
            }}>
          </div>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (!quizzes.length) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <div className="bg-white/70 rounded-xl p-8 text-[#4A3F47] shadow-lg border border-[#4A3F47]/10">
            퀴즈가 준비되지 않았습니다.
          </div>
        </div>
      );
    }
    const quiz = quizzes[quizIndex];
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F1F8E9] via-[#E8F5E9] to-[#C8E6C9]" />
        <div className="relative z-10 w-full max-w-5xl bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-2xl p-6 md:p-10 flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3">
            <div className="text-xs uppercase tracking-[0.3em] text-[#7A6F76] mb-2">Quiz</div>
            <h3 className="text-2xl font-serif text-[#4A3F47] leading-snug">{displayTitle}</h3>
            <p className="text-sm text-[#7A6F76] mt-2">문제를 풀고 이야기를 마무리해 보세요.</p>
            <div className="mt-6 text-sm text-[#4A3F47]">
              {quizIndex + 1} / {quizzes.length}
            </div>
          </div>
          <div className="flex-1 bg-[#FDFBF7] rounded-xl border border-[#E0D5C8] shadow-inner p-6">
            <h4 className="text-lg font-semibold text-[#4A3F47] mb-4 leading-relaxed">{quiz.question}</h4>
            <div className="grid gap-3 relative">
              <AnimatePresence>
                {quizFeedback === 'correct' && <CrayonO />}
              </AnimatePresence>
              {quiz.options.map((opt, idx) => {
                const isCorrect = quizFeedback === 'correct' && idx === quiz.answer;
                const isWrong = quizFeedback === 'wrong' && idx === quiz.answer;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const answer = idx === quiz.answer ? 'correct' : 'wrong';
                      setQuizFeedback(answer);
                      if (answer === 'correct') {
                        setTimeout(() => {
                          if (quizIndex < quizzes.length - 1) {
                            setQuizIndex((prev) => prev + 1);
                            setQuizFeedback(null);
                          } else {
                            setQuizComplete(true);
                          }
                        }, 900);
                      } else {
                        setTimeout(() => setQuizFeedback(null), 900);
                      }
                    }}
                    className={`text-left px-4 py-3 rounded-lg border transition-all ${quizFeedback
                      ? idx === quiz.answer
                        ? 'border-green-500 bg-green-50'
                        : 'border-[#E0D5C8] bg-white/60'
                      : 'border-[#E0D5C8] bg-white hover:border-[#4A3F47] hover:bg-white/80'
                      }`}
                    disabled={!!quizFeedback}
                  >
                    <span className="font-medium text-[#4A3F47]">{opt}</span>
                    {isCorrect && <span className="ml-2 text-sm text-green-600">정답!</span>}
                    {isWrong && <span className="ml-2 text-sm text-red-500">오답!</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {quizComplete && (
            <>
              <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.2}
              />
              <motion.div
                className="absolute inset-0 bg-black/40 flex items-center justify-center z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl p-8 w-96 text-center space-y-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <h3 className="text-xl font-semibold text-[#4A3F47]">퀴즈 완료!</h3>
                  <p className="text-sm text-[#7A6F76]">이야기의 모든 문제를 풀었어요.</p>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStage('cover');
                        setCurrentPage(0);
                        setQuizIndex(0);
                        setQuizFeedback(null);
                        setQuizComplete(false);
                      }}
                      className="text-[#4A3F47] border-[#4A3F47]/30"
                    >
                      처음으로
                    </Button>
                    <Button onClick={onClose} className="bg-[#4A3F47] hover:bg-[#3A2F35]">
                      목록으로
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Global keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage, onClose]);

  const currentPageData = stage === 'reading' ? pages[currentPage] : null;
  const langLabelMap: Record<string, string> = {
    KO: '한국어',
    EN: 'English',
    JA: '日本語',
    FR: 'Français',
    ES: 'Español',
    DE: 'Deutsch',
    ZH: '中文',
  };
  const translationLabel = translationLanguage ? (langLabelMap[translationLanguage] || translationLanguage) : null;
  const displayTitle = showTranslation && translatedTitle ? translatedTitle : storybook.title;

  // Audio Handlers
  const handleToggleAutoPlay = () => {
    setAutoPlay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('storybookAutoPlay', String(next));
      } catch {
        // ignore storage errors
      }
      if (!next) {
        setPendingAutoPlay(false);
      }
      return next;
    });
  };

  const handleToggleAutoFlip = () => {
    setAutoFlip((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('storybookAutoFlip', String(next));
      } catch {
        // ignore storage errors
      }
      if (!next) {
        setPendingAutoPlay(false);
      }
      return next;
    });
  };

  const handleToggleTranslation = () => {
    if (!translationLanguage || Object.keys(translationMap).length === 0) {
      return;
    }
    setShowTranslation((prev) => !prev);
  };

  const handlePlayAudio = async () => {
    if (stage !== 'reading' || !currentPageData) return;

    const playExisting = async (url: string) => {
      console.log('🎵 Playing audio:', url);

      const audio = audioRef.current ?? new Audio(url);
      if (!audioRef.current) {
        audioRef.current = audio;
      }

      // (Re)bind handlers to reflect latest toggle states
      audio.onerror = (e) => {
        console.error('❌ Audio loading error:', e);
        alert('오디오 파일을 불러올 수 없습니다.');
      };

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (autoPlay) {
          setPendingAutoPlay(true); // repeat same page after delay
        }
        if (autoFlip && currentPage < pages.length - 1) {
          handleNextPage();
        }
      };

      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);

      // If different source, update it
      if (!audio.src.endsWith(url)) {
        console.log('🔄 Updating audio source');
        audio.src = url;
      }
      try {
        console.log('▶️ Attempting to play audio...');
        await audio.play();
        setIsPlaying(true);
        console.log('✅ Audio playing successfully');
      } catch (err) {
        console.error("❌ Audio playback failed:", err);
        alert(`재생 실패: ${err}`);
      }
    };

    // If audio already exists, play it
    if (currentPageData.audioUrl) {
      await playExisting(currentPageData.audioUrl);
      return;
    }

    // Generate audio
    console.log('🎙️ Generating new audio for page:', currentPageData.id);
    setIsGeneratingAudio(true);
    try {
      const targetStoryId = storyId > 0 ? storyId : storybook.id;
      const res = await apiFetch<{ audioUrl: string }>(
        `/stories/${targetStoryId}/storybook/pages/${currentPageData.id}/audio`,
        {
          method: 'POST',
          body: {
            text: currentPageData.text,
            // Optional: user-selected voice preset for Gemini TTS style guidance
            voicePreset: voicePreset !== 'default' ? voicePreset : undefined,
            language: storybook.language || 'KO'
          }
        }
      );

      console.log('📦 Audio generation response:', res);

      // Handle both camelCase and snake_case from backend
      const audioUrlFromResponse = res.audioUrl || (res as any).audio_url;

      if (res && audioUrlFromResponse) {
        const newAudioUrl = normalizeAudio(audioUrlFromResponse);
        console.log('🔗 Normalized audio URL:', newAudioUrl);

        // Update pages state with new audio URL
        setPages(prev => prev.map((p, idx) =>
          idx === currentPage ? { ...p, audioUrl: newAudioUrl } : p
        ));

        // Play immediately
        await playExisting(newAudioUrl!);
      }
    } catch (err) {
      console.error("❌ Audio generation failed:", err);
      alert("음성 생성에 실패했습니다.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReplayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#F1F8E9] via-[#E8F5E9] to-[#C8E6C9] z-50 flex items-center justify-center">
        <div className="text-[#4A3F47]">스토리를 불러오는 중...</div>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#F1F8E9] via-[#E8F5E9] to-[#C8E6C9] z-50 flex flex-col items-center justify-center gap-4 text-[#4A3F47]">
        <div>{error || "스토리 내용을 찾을 수 없습니다."}</div>
        <Button onClick={onClose}>닫기</Button>
      </div>
    );
  }

  // Calculate stack thickness
  const leftStackCount = stage === 'reading' ? currentPage : 0;
  const rightStackCount = stage === 'reading' ? pages.length - 1 - currentPage : 0;
  const maxStack = 5; // Visual cap
  const leftStackWidth = Math.min(leftStackCount, maxStack) * 4;
  const rightStackWidth = Math.min(rightStackCount, maxStack) * 4;

  const progressLabel = stage === 'cover'
    ? '표지'
    : stage === 'quiz'
      ? `퀴즈 ${quizIndex + 1} / ${quizzes.length || 1}`
      : `${currentPage + 1} / ${pages.length}`;

  const prevDisabled = stage === 'cover' || (stage === 'reading' && currentPage === 0 && flippingState === 'idle');
  const nextDisabled = stage === 'quiz' || (stage === 'reading' && currentPage === pages.length - 1 && quizzes.length === 0 && flippingState === 'idle');

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-[#F1F8E9] via-[#E8F5E9] to-[#C8E6C9] z-50 flex flex-col items-center justify-center overflow-hidden perspective-[2000px]"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${storybook.title} 동화책 뷰어`}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-6 flex items-center justify-between z-20 bg-white/40 backdrop-blur-2xl border-b border-white/40 shadow-[0_4px_24px_rgba(176,123,172,0.08)]">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#4A3F47] hover:bg-white/40 rounded-full w-10 h-10"
          >
            <X className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-[#4A3F47] font-serif tracking-wide text-lg">
              {displayTitle}
              {showTranslation && translatedTitle && <span className="ml-2 text-xs text-[#7A6F76]">(번역본)</span>}
            </h2>
            <p className="text-[#7A6F76] text-xs">by {storybook.author}</p>
          </div>
        </div>

        {/* Controls (Floating) */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Translation Toggle */}
          <Button
            variant="ghost"
            size="sm"
            disabled={Object.keys(translationMap).length === 0}
            onClick={handleToggleTranslation}
            className={`rounded-full px-4 h-9 ${showTranslation ? 'bg-white/70 text-[#4A3F47]' : 'bg-white/30 text-[#4A3F47]'
              } border border-white/40 shadow`}
          >
            {showTranslation ? '원문 보기' : '번역본 보기'}
            {translationLabel ? ` (${translationLabel})` : ''}
          </Button>

          {/* Auto Play Toggle */}
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/40 shadow-lg">
            <button
              onClick={handleToggleAutoPlay}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${autoPlay ? 'bg-[#4A3F47]' : 'bg-[#d7d7d7]'
                }`}
              aria-pressed={autoPlay}
              aria-label="연속 재생"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${autoPlay ? 'translate-x-5' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className="text-xs text-[#4A3F47]">{autoPlay ? '연속 재생 ON' : '연속 재생 OFF'}</span>
          </div>

          {/* Auto Flip Toggle */}
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/40 shadow-lg">
            <button
              onClick={handleToggleAutoFlip}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${autoFlip ? 'bg-[#4A3F47]' : 'bg-[#d7d7d7]'
                }`}
              aria-pressed={autoFlip}
              aria-label="자동 넘김"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${autoFlip ? 'translate-x-5' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className="text-xs text-[#4A3F47]">{autoFlip ? '자동 넘김 ON' : '자동 넘김 OFF'}</span>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-full p-2 pr-4 border border-white/40 shadow-lg">
            {isGeneratingAudio ? (
              <div className="flex items-center gap-2 px-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#4A3F47]" />
                <span className="text-xs text-[#4A3F47]">음성 생성 중...</span>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isPlaying ? handlePauseAudio : handlePlayAudio}
                  className="rounded-full w-8 h-8 hover:bg-white/40 text-[#4A3F47]"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </Button>

                {pages[currentPage]?.audioUrl && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tabular-nums opacity-70 w-8 text-right text-[#4A3F47]">{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-20 h-1 bg-black/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4A3F47]"
                      />
                      <span className="text-[10px] tabular-nums opacity-70 w-8 text-[#4A3F47]">{formatTime(duration)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleReplayAudio}
                      className="rounded-full w-6 h-6 hover:bg-white/40 text-[#4A3F47] opacity-70"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Book Container */}
      <div className="relative w-full max-w-6xl h-[80vh] flex items-center justify-center p-4">
        {stage === 'reading' ? (
          <div className="relative w-full h-full max-h-[700px] aspect-[1.5/1] flex items-center justify-center">

            {/* Back Cover / Binding (Extended to wrap pages) */}
            <div
              className="absolute bg-[#5D4037] rounded-lg shadow-2xl border-4 border-[#3E2723]"
              style={{
                top: -20, bottom: -20,
                left: 10 - leftStackWidth,
                right: 10 - rightStackWidth,
                transition: 'all 0.5s ease',
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            ></div>

            {/* Page Stacks (Visual Depth with Texture) */}
            {/* Left Stack */}
            <div
              className="absolute top-0 bottom-0 border-l border-gray-300"
              style={{
                left: -leftStackWidth,
                width: leftStackWidth,
                background: 'repeating-linear-gradient(90deg, #f5f5f5, #f5f5f5 1px, #e0e0e0 2px, #e0e0e0 3px)',
                boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.1)',
                zIndex: 0
              }}
            />
            {/* Right Stack */}
            <div
              className="absolute top-0 bottom-0 border-r border-gray-300"
              style={{
                right: -rightStackWidth,
                width: rightStackWidth,
                background: 'repeating-linear-gradient(90deg, #f5f5f5, #f5f5f5 1px, #e0e0e0 2px, #e0e0e0 3px)',
                boxShadow: 'inset 2px 0 5px rgba(0,0,0,0.1)',
                zIndex: 0
              }}
            />

            {/* Main Book Area (3D Context) */}
            <div className="relative w-full h-full flex transform-style-3d perspective-[2000px]">

              {/* Static Layer (Underneath) */}
              <div className="absolute inset-0 flex z-10">
                {/* Static Left Page */}
                <div className="w-1/2 h-full border-r border-[#E0E0E0] bg-[#FDFBF7]">
                  {flippingState === 'prev'
                    ? renderPageFace(currentPage - 1, 'left') // Target Left
                    : renderPageFace(currentPage, 'left')     // Current Left
                  }
                </div>
                {/* Static Right Page */}
                <div className="w-1/2 h-full bg-[#FDFBF7]">
                  {flippingState === 'next'
                    ? renderPageFace(currentPage + 1, 'right') // Target Right
                    : renderPageFace(currentPage, 'right')     // Current Right
                  }
                </div>
              </div>

              {/* Flipping Layer */}
              {flippingState !== 'idle' && (
                <motion.div
                  key={flippingState === 'next' ? currentPage : currentPage - 1}
                  custom={direction}
                  variants={flipVariants}
                  initial="initial"
                  animate="animate"
                  onAnimationComplete={onFlipComplete}
                  className="absolute left-1/2 top-0 bottom-0 w-1/2 origin-left transform-style-3d"
                  style={{ backfaceVisibility: 'visible' }} // Important for 3D flip
                >
                  {/* Front Face (Visible at 0deg) */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Use renderBlankFace for cleaner transition */}
                    {renderBlankFace('right')}

                    {/* Shadow overlay when flipping */}
                    <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                  </div>

                  {/* Back Face (Visible at -180deg) */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    {/* Use renderBlankFace for cleaner transition */}
                    {renderBlankFace('left')}

                    {/* Shadow overlay when flipping */}
                    <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                  </div>
                </motion.div>
              )}

              {/* Spine Shadow Overlay (Center) */}
              <div className="absolute left-1/2 top-0 bottom-0 w-12 -ml-6 bg-gradient-to-r from-transparent via-black/20 to-transparent z-40 pointer-events-none mix-blend-multiply"></div>

              {/* Click Zones */}
              <div
                className="absolute top-0 left-0 w-1/6 h-full cursor-pointer z-50 hover:bg-black/5 transition-colors"
                onClick={handlePrevPage}
                title="이전 페이지"
              />
              <div
                className="absolute top-0 right-0 w-1/6 h-full cursor-pointer z-50 hover:bg-black/5 transition-colors"
                onClick={handleNextPage}
                title="다음 페이지"
              />
            </div>
          </div>
        ) : stage === 'quiz' ? (
          renderQuiz()
        ) : (
          renderCover()
        )}
      </div>

      {/* Bottom Navigation (Visual Only) */}
      <div className="absolute bottom-6 flex items-center gap-6 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevPage}
          disabled={prevDisabled}
          className="rounded-full border-[#4A3F47]/30 text-[#4A3F47] hover:bg-[#4A3F47]/10 disabled:opacity-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <span className="text-[#4A3F47] font-serif tracking-widest text-sm">
          {progressLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={nextDisabled}
          className="rounded-full border-[#4A3F47]/30 text-[#4A3F47] hover:bg-[#4A3F47]/10 disabled:opacity-30"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
