"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Languages, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryPage {
  pageNumber: number;
  imageUrl: string;
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

// Mock storybook pages data
const mockPages: StoryPage[] = [
  {
    pageNumber: 1,
    imageUrl: "https://images.unsplash.com/photo-1600804010026-8387cc05e1c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    text: "Once upon a time, in a lush green forest, there lived a curious little fox named Ruby. She loved exploring every corner of her woodland home."
  },
  {
    pageNumber: 2,
    imageUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    text: "One sunny morning, Ruby discovered a mysterious glowing path she had never seen before. Her heart raced with excitement and wonder."
  },
  {
    pageNumber: 3,
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    text: "Following the path, Ruby met a wise old owl named Oliver. 'This path leads to the Secret Garden,' he hooted, 'but only the brave can find it.'"
  },
  {
    pageNumber: 4,
    imageUrl: "https://images.unsplash.com/photo-1574244931790-ee19df716899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    text: "With courage in her heart, Ruby ventured deeper into the forest. The trees seemed to whisper encouragement as she walked."
  },
  {
    pageNumber: 5,
    imageUrl: "https://images.unsplash.com/photo-1511497584788-876760111969?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    text: "At last, Ruby found the Secret Garden! It was filled with flowers that sparkled like stars and butterflies that sang sweet melodies."
  },
  {
    pageNumber: 6,
    imageUrl: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    text: "Ruby realized that the greatest adventures come to those who are curious and brave. She returned home with stories to share with all her friends. The End."
  }
];

export function StoryBookViewerPage({ storybook, onClose }: StoryBookViewerPageProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTranslated, setIsTranslated] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount for keyboard accessibility
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleNextPage = useCallback(() => {
    if (currentPage < mockPages.length - 1) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage]);

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

  const currentPageData = mockPages[currentPage];

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
                    src={currentPageData.imageUrl}
                    alt={`Page ${currentPageData.pageNumber}`}
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
                    {currentPageData.pageNumber}
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
          Page {currentPage + 1} of {mockPages.length}
        </p>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage >= mockPages.length - 1}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/60 backdrop-blur-md hover:bg-white/80 text-[#4A3F47] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(176,123,172,0.15)] border border-white/40"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
      </div>
    </div>
  );
}
