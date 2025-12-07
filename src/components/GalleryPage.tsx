"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Heart, Share2, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertPopup } from '@/components/ui/alert-popup';
import { type Storybook } from '@/store';

interface GalleryPageProps {
  storybooks: Storybook[];
  onToggleShare: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigateToCreate: () => void;
  onViewStorybook: (storybook: Storybook) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function GalleryPage({ storybooks, onToggleShare, onDelete, onNavigateToCreate, onViewStorybook, isLoading = false, error = null }: GalleryPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Filter storybooks by search query
  const filteredStorybooks = storybooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Top Bar - Responsive */}
      <div className={`fixed top-0 left-0 md:left-20 right-0 z-40 px-4 md:px-6 h-16 flex items-center bg-white/95 backdrop-blur-md transition-all duration-[var(--duration-normal)] ${
        isScrolled ? 'border-b border-[var(--border)] shadow-sm' : ''
      }`}>
        <div className="flex items-center justify-between w-full">
          <div className="min-w-0">
            <h1 className="text-[var(--text-primary)] font-bold truncate">내 도서목록</h1>
            <p className="text-sm text-[var(--text-tertiary)] font-medium mt-0.5 hidden sm:block">
              {storybooks.length}개의 동화책
            </p>
          </div>

          {/* Desktop Search - Input with dropdown */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-md mx-4 md:mx-6 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <Input
                type="text"
                placeholder="내 동화책 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full bg-white border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] pl-12 pr-10 py-2.5 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)] rounded-full"
                aria-label="내 동화책 검색"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
                >
                  <X className="w-3 h-3 text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border)] rounded-2xl shadow-lg overflow-hidden z-50">
                <div className="p-4 space-y-3">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">검색 팁</p>
                  <ul className="space-y-2 text-xs text-[var(--text-tertiary)]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      동화책 제목으로 검색하세요
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      작가 이름으로도 검색할 수 있어요
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search - Icon button that expands */}
          <div ref={mobileSearchRef} className="md:hidden relative">
            {!mobileSearchOpen ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSearchOpen(true)}
                className="w-10 h-10 rounded-full text-[#757575] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] relative"
              >
                <Search className="w-5 h-5" />
                {searchQuery && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#66BB6A] rounded-full" />
                )}
              </Button>
            ) : (
              <div className="fixed inset-x-0 top-0 bg-white/95 backdrop-blur-md z-50 px-4 py-3 border-b border-[var(--border)] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                    <Input
                      type="text"
                      placeholder="내 동화책 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] pl-12 pr-10 py-2.5 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)] rounded-full"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
                      >
                        <X className="w-3 h-3 text-[var(--text-tertiary)]" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileSearchOpen(false)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    취소
                  </Button>
                </div>

                {/* Mobile Search Dropdown */}
                <div className="mt-3 bg-[var(--muted)] rounded-xl p-4">
                  <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">검색 팁</p>
                  <ul className="space-y-2 text-xs text-[var(--text-tertiary)]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      동화책 제목으로 검색하세요
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      작가 이름으로도 검색할 수 있어요
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Create Button */}
          <Button
            onClick={onNavigateToCreate}
            className="bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] hover:shadow-lg rounded-full px-4 md:px-6 font-semibold touch-target"
          >
            <span className="hidden sm:inline">새로 만들기</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* Grid Layout - pt-24 for spacing below h-16 topbar */}
      <div className="pt-24 px-4 md:px-6 pb-8 bg-[var(--background)] min-h-screen">
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)] text-sm text-[#757575]">
            내 동화책을 불러오는 중...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)] text-sm text-red-500">
            {error}
          </div>
        ) : storybooks.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[#F5F5F5] flex items-center justify-center">
                <Search className="w-12 h-12 text-[#757575]" />
              </div>
              <h2 className="text-[#1A1A1A] font-bold mb-2">아직 동화책이 없습니다</h2>
              <p className="text-[#757575] font-normal text-sm">첫 번째 동화책을 만들어보세요!</p>
            </div>
          </div>
        ) : filteredStorybooks.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[#F1F8E9] flex items-center justify-center">
                <Search className="w-12 h-12 text-[#66BB6A]" />
              </div>
              <h2 className="text-[#424242] font-bold mb-2">일치하는 동화책이 없습니다</h2>
              <p className="text-[#757575] font-normal text-sm">검색어를 변경해 보세요</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
            {filteredStorybooks.map((storybook) => (
              <GalleryCard
                key={storybook.id}
                storybook={storybook}
                onToggleShare={onToggleShare}
                onDelete={onDelete}
                onViewStorybook={onViewStorybook}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface GalleryCardProps {
  storybook: Storybook;
  onToggleShare: (id: number) => void;
  onDelete: (id: number) => void;
  onViewStorybook: (storybook: Storybook) => void;
}

function GalleryCard({ storybook, onToggleShare, onDelete, onViewStorybook }: GalleryCardProps) {
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeletePopup(true);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSharePopup(true);
  };

  const confirmDelete = () => {
    onDelete(storybook.id);
    setShowDeletePopup(false);
  };

  const confirmShare = () => {
    onToggleShare(storybook.id);
    setShowSharePopup(false);
  };

  return (
    <motion.div
      className="group cursor-pointer bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(102,187,106,0.2)] border border-[#E0E0E0] hover:border-[#66BB6A] transition-all duration-300 relative overflow-hidden rounded-xl"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={() => onViewStorybook(storybook)}
    >
      {/* Content */}
      <div className="relative">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden mb-3 rounded-lg">
          <img
            src={storybook.imageUrl}
            alt={storybook.title}
            className="w-full h-full object-cover"
          />

          {/* Hover Overlay with Actions - Always visible on mobile/tablet, hover on desktop (1920px+) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#424242]/90 via-transparent to-transparent opacity-100 min-[1920px]:opacity-0 min-[1920px]:group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareClick}
                className={`gap-2 rounded-full px-4 backdrop-blur-md border ${
                  storybook.isShared
                    ? 'bg-[#66BB6A] text-white hover:bg-[#388E3C] border-white/20 shadow-[0_4px_16px_rgba(102,187,106,0.3)]'
                    : 'bg-white/90 text-[#66BB6A] hover:bg-white hover:text-[#388E3C] border-white/40 shadow-[0_4px_16px_rgba(255,255,255,0.4)]'
                } font-semibold`}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">{storybook.isShared ? '공유됨' : '공유하기'}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className="w-9 h-9 bg-white/90 hover:bg-white text-red-500 hover:text-red-600 rounded-full backdrop-blur-md border border-white/40 shadow-[0_4px_16px_rgba(255,255,255,0.4)]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-2 px-1">
          {/* Title */}
          <h3 className="text-[#424242] font-semibold line-clamp-1">{storybook.title}</h3>

          {/* Author */}
          <p className="text-sm text-[#757575] font-normal">작가 {storybook.author}</p>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {storybook.categories.map((category, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-[#F1F8E9] border border-[#66BB6A]/30 text-[#66BB6A] text-xs px-2 py-0.5 font-medium"
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Likes - Only show if shared */}
          {storybook.isShared && (
            <div className="flex items-center gap-1.5 text-[#757575] pt-1">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">{storybook.likes.toLocaleString()} 좋아요</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      <AlertPopup
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        onConfirm={confirmDelete}
        title="동화책 삭제"
        description={`"${storybook.title}"을(를) 정말 삭제하시겠습니까? 삭제된 동화책은 복구할 수 없습니다.`}
        type="warning"
        confirmText="삭제"
        cancelText="취소"
      />

      {/* Share Confirmation Popup */}
      <AlertPopup
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
        onConfirm={confirmShare}
        title={storybook.isShared ? "공유 해제" : "동화책 공유"}
        description={
          storybook.isShared
            ? `"${storybook.title}"의 공유를 해제하시겠습니까? 도서관에서 더 이상 다른 사용자들이 볼 수 없게 됩니다.`
            : `"${storybook.title}"을(를) 도서관에 공유하시겠습니까? 다른 사용자들이 이 동화책을 볼 수 있게 됩니다.`
        }
        type="info"
        confirmText={storybook.isShared ? "공유 해제" : "공유하기"}
        cancelText="취소"
      />
    </motion.div>
  );
}
