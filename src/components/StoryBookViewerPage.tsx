"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Languages, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, BACKEND_ORIGIN } from '@/lib/api';

interface StoryPage {
  pageNo: number;
  imageUrl?: string | null;
  image_url?: string | null;
  text: string;
}

interface StoryBookViewerPageProps {
  storybook: {
    id: number;
    title: string;
    author: string;
  };
  onClose: () => void;
}

export function StoryBookViewerPage({ storybook, onClose }: StoryBookViewerPageProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [direction, setDirection] = useState(0);
  const [pages, setPages] = useState<StoryPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const placeholderImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80";
  const normalizeImage = (url?: string | null) => {
    if (!url) return placeholderImage;
    if (/^https?:\/\//i.test(url)) return url;
    return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
  };

  // Auto-focus on mount for keyboard accessibility
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await apiFetch<{ pages?: StoryPage[] }>(`/stories/${storybook.id}`);
        if (!mounted) return;
        const sorted = (detail.pages || [])
          .map((p) => ({
            ...p,
            imageUrl: normalizeImage(p.imageUrl || (p as any).image_url || null),
          }))
          .sort((a, b) => (a.pageNo ?? 0) - (b.pageNo ?? 0));
        setPages(sorted);
        setCurrentPage(0);
      } catch (err) {
        console.error("스토리 상세 불러오기 실패", err);
        if (mounted) setError("스토리 내용을 불러오지 못했습니다.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [storybook.id]);

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

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn);
    // Here you would implement actual sound playback
  };

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

        {/* Control Buttons */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsTranslated(!isTranslated)}
            className={`rounded-full transition-all w-8 h-8 md:w-10 md:h-10 border backdrop-blur-md ${
              isTranslated
                ? 'bg-[#B07BAC] text-white border-white/20 hover:bg-[#9D8FA8] shadow-[0_4px_16px_rgba(176,123,172,0.3)]'
                : 'text-[#7A6F76] bg-white/40 border-white/40 hover:bg-white/60 hover:text-[#B07BAC]'
            }`}
          >
            <Languages className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            className={`rounded-full transition-all w-8 h-8 md:w-10 md:h-10 border backdrop-blur-md ${
              isSoundOn
                ? 'bg-[#C4D4C0] text-white border-white/20 hover:bg-[#B0C5AC] shadow-[0_4px_16px_rgba(196,212,192,0.3)]'
                : 'text-[#7A6F76] bg-white/40 border-white/40 hover:bg-white/60 hover:text-[#C4D4C0]'
            }`}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>
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
                    {isTranslated
                      ? `[Translated] ${currentPageData.text}`
                      : currentPageData.text
                    }
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
