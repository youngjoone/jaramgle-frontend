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
    language?: string;
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
  const [autoPlay, setAutoPlay] = useState<boolean>(false); // 현재 페이지 반복 재생
  const [autoFlip, setAutoFlip] = useState<boolean>(false); // 음성 끝나면 다음 페이지 이동
  const [pendingAutoPlay, setPendingAutoPlay] = useState<boolean>(false);
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
    if (currentPage < pages.length - 1 && flippingState === 'idle') {
      setDirection(1);
      setFlippingState('next');
    }
  }, [currentPage, pages.length, flippingState]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0 && flippingState === 'idle') {
      setDirection(-1);
      setFlippingState('prev');
    }
  }, [currentPage, flippingState]);

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
    if (!autoPlay || !pendingAutoPlay) return;
    const timer = setTimeout(() => {
      handlePlayAudio();
      setPendingAutoPlay(false);
    }, 1500); // allow assets to settle
    return () => clearTimeout(timer);
  }, [currentPage, autoPlay, pendingAutoPlay]); // handlePlayAudio defined later in scope

  // Helper to render a single page face
  const renderPageFace = (pageIndex: number, side: 'left' | 'right') => {
    const page = pages[pageIndex];
    if (!page) return <div className="w-full h-full bg-[#FDFBF7]" />; // Empty/Cover

    const isImage = side === 'left';

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
              {page.text}
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

  const currentPageData = pages[currentPage];

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

  const handlePlayAudio = async () => {
    if (!currentPageData) return;

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
  const leftStackCount = currentPage;
  const rightStackCount = pages.length - 1 - currentPage;
  const maxStack = 5; // Visual cap
  const leftStackWidth = Math.min(leftStackCount, maxStack) * 4;
  const rightStackWidth = Math.min(rightStackCount, maxStack) * 4;

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
            <h2 className="text-[#4A3F47] font-serif tracking-wide text-lg">{storybook.title}</h2>
            <p className="text-[#7A6F76] text-xs">by {storybook.author}</p>
          </div>
        </div>

        {/* Controls (Floating) */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Auto Play Toggle */}
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/40 shadow-lg">
            <button
              onClick={handleToggleAutoPlay}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                autoPlay ? 'bg-[#4A3F47]' : 'bg-[#d7d7d7]'
              }`}
              aria-pressed={autoPlay}
              aria-label="연속 재생"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  autoPlay ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs text-[#4A3F47]">{autoPlay ? '연속 재생 ON' : '연속 재생 OFF'}</span>
          </div>

          {/* Auto Flip Toggle */}
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md rounded-full px-3 py-2 border border-white/40 shadow-lg">
            <button
              onClick={handleToggleAutoFlip}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                autoFlip ? 'bg-[#4A3F47]' : 'bg-[#d7d7d7]'
              }`}
              aria-pressed={autoFlip}
              aria-label="자동 넘김"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  autoFlip ? 'translate-x-5' : 'translate-x-1'
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
      </div>

      {/* Bottom Navigation (Visual Only) */}
      <div className="absolute bottom-6 flex items-center gap-6 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevPage}
          disabled={currentPage === 0 && flippingState === 'idle'}
          className="rounded-full border-[#4A3F47]/30 text-[#4A3F47] hover:bg-[#4A3F47]/10 disabled:opacity-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <span className="text-[#4A3F47] font-serif tracking-widest text-sm">
          {currentPage + 1} / {pages.length}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage === pages.length - 1 && flippingState === 'idle'}
          className="rounded-full border-[#4A3F47]/30 text-[#4A3F47] hover:bg-[#4A3F47]/10 disabled:opacity-30"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
