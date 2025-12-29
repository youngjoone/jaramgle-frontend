"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, BACKEND_ORIGIN } from '@/lib/api';

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
  };
  onClose: () => void;
}

export function StoryBookViewerPage({ storybook, onClose }: StoryBookViewerPageProps) {
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 공유 피드(shareSlug만 있는 카드)인 경우, 공개 상세 API 사용
        if (storybook.id <= 0 && storybook.shareSlug) {
          const detail = await apiFetch<{
            story: {
              id: number;
              title: string;
              pages?: any[];
              storybookPages?: any[];
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
            .map((p: any) => ({
              id: p.id || 0,
              pageNo: p.pageNumber ?? p.pageNo ?? p.page ?? 0,
              text: p.text,
              imageUrl: normalizeImage(p.imageUrl || p.image_url || null),
              audioUrl: normalizeAudio(p.audioUrl),
            }))
            .sort((a: any, b: any) => (a.pageNo ?? 0) - (b.pageNo ?? 0));
          setPages(sorted);
          setCurrentPage(0);
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
              .map((p) => ({
                id: p.id,
                pageNo: p.pageNumber ?? 0,
                text: p.text,
                imageUrl: normalizeImage(p.imageUrl || (p as any).image_url || null),
                audioUrl: normalizeAudio(p.audioUrl),
              }))
              .sort((a, b) => (a.pageNo ?? 0) - (b.pageNo ?? 0));
            setPages(sortedSb);
            setCurrentPage(0);
            setIsLoading(false);
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
          .map((p: any) => ({
            id: p.id || 0, // Fallback ID, might fail audio gen if 0
            pageNo: p.pageNo ?? p.page ?? 0,
            text: p.text,
            imageUrl: normalizeImage(p.imageUrl || p.image_url || null),
            audioUrl: null,
          }))
          .sort((a: any, b: any) => (a.pageNo ?? 0) - (b.pageNo ?? 0));
        setPages(sorted);
        setCurrentPage(0);
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

  const handleNextPage = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, pages.length]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

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

  const pageVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
      scale: 0.8
    })
  };

  const currentPageData = pages[currentPage];

  // Audio Handlers
  const handlePlayAudio = async () => {
    if (!currentPageData) return;

    // If audio already exists, play it
    if (currentPageData.audioUrl) {
      console.log('🎵 Playing existing audio:', currentPageData.audioUrl);

      if (audioRef.current) {
        // If different source, update it
        if (!audioRef.current.src.endsWith(currentPageData.audioUrl)) {
          console.log('🔄 Updating audio source');
          audioRef.current.src = currentPageData.audioUrl;
        }
        try {
          console.log('▶️ Attempting to play audio...');
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('✅ Audio playing successfully');
        } catch (err) {
          console.error("❌ Audio playback failed:", err);
          alert(`재생 실패: ${err}`);
        }
      } else {
        // Create audio element
        console.log('🆕 Creating new Audio element');
        const audio = new Audio(currentPageData.audioUrl);

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
        };

        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);

        audioRef.current = audio;
        try {
          console.log('▶️ Attempting to play new audio...');
          await audio.play();
          console.log('✅ Audio playing successfully');
        } catch (err) {
          console.error("❌ Audio playback failed:", err);
          alert(`재생 실패: ${err}`);
        }
      }
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
        console.log('🆕 Creating Audio element for generated audio');
        const audio = new Audio(newAudioUrl!);

        audio.onerror = (e) => {
          console.error('❌ Audio loading error:', e);
          alert('생성된 오디오 파일을 불러올 수 없습니다.');
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
        };

        audio.onpause = () => setIsPlaying(false);
        audio.onplay = () => setIsPlaying(true);

        audioRef.current = audio;

        console.log('▶️ Attempting to play generated audio...');
        await audio.play();
        console.log('✅ Generated audio playing successfully');
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-[#F1F8E9] via-[#E8F5E9] to-[#C8E6C9] z-50 flex flex-col"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${storybook.title} 동화책 뷰어`}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-3 md:p-6 flex items-center justify-between border-b border-white/40 z-10 bg-white/40 backdrop-blur-2xl shadow-[0_4px_24px_rgba(176,123,172,0.08)]">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#4A3F47] hover:bg-white/60 hover:backdrop-blur-md rounded-xl w-8 h-8 md:w-10 md:h-10"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div>
            <h2 className="text-[#4A3F47]">{storybook.title}</h2>
            <p className="text-[#7A6F76] text-sm">by {storybook.author}</p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {isGeneratingAudio ? (
            <Button
              variant="ghost"
              disabled
              className="rounded-full bg-white/40 border border-white/40 text-[#7A6F76] gap-2 px-4"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">생성 중...</span>
            </Button>
          ) : currentPageData.audioUrl ? (
            <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-full border border-white/40 p-2 pr-4">
              {/* Play/Pause Button */}
              {isPlaying ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePauseAudio}
                  className="rounded-full w-8 h-8 hover:bg-white/60 text-[#66BB6A]"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayAudio}
                  className="rounded-full w-8 h-8 hover:bg-white/60 text-[#66BB6A]"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </Button>
              )}

              {/* Progress Bar & Time */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#7A6F76] font-medium w-9 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-24 md:w-32 h-1.5 bg-white/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#66BB6A] hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                  style={{
                    background: `linear-gradient(to right, #66BB6A ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.5) ${(currentTime / (duration || 1)) * 100}%)`
                  }}
                />
                <span className="text-xs text-[#7A6F76] font-medium w-9">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Replay Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReplayAudio}
                className="rounded-full w-8 h-8 hover:bg-white/60 text-[#7A6F76] ml-1"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handlePlayAudio}
              className="rounded-full bg-white/40 hover:bg-white/60 border border-white/40 text-[#4A3F47] gap-2 px-4 shadow-sm"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">음성 재생</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
          {/* Book Pages */}
          <div className="relative w-full h-full flex items-center justify-center max-w-6xl">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={`page-${currentPage}`}
                custom={direction}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
                className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full items-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2 aspect-square overflow-hidden rounded-3xl shadow-[0_12px_48px_rgba(176,123,172,0.2)] border border-white/40">
                  <img
                    src={currentPageData.imageUrl || placeholderImage}
                    alt={`Page ${currentPageData.pageNo}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Text */}
                <div className="w-full lg:w-1/2 aspect-square relative flex items-center justify-center px-6 lg:px-8 bg-white/50 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_12px_48px_rgba(176,123,172,0.15),inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <p className="text-[#1a1a1a] text-xl lg:text-2xl leading-relaxed text-center">
                    {currentPageData.text}
                  </p>
                  <span className="absolute bottom-2 right-6 lg:bottom-3 lg:right-8 text-[#7A6F76]/40 text-sm">
                    {currentPageData.pageNo}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 pb-4 md:pb-6 px-4 md:px-8 flex items-center justify-between">
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/60 backdrop-blur-md hover:bg-white/80 text-[#4A3F47] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(176,123,172,0.15)] border border-white/40"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Button>

        {/* Page Counter - Center */}
        <p className="text-[#7A6F76]/60 text-sm md:text-base">
          Page {currentPage + 1} of {pages.length}
        </p>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage >= pages.length - 1}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/60 backdrop-blur-md hover:bg-white/80 text-[#4A3F47] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(176,123,172,0.15)] border border-white/40"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
      </div>
    </div>
  );
}
