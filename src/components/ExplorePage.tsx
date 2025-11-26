"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Heart, Bookmark, Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Storybook {
  id: number;
  imageUrl: string;
  title: string;
  author: string;
  categories: string[];
  likes: number;
  isBookmarked: boolean;
}

interface ExplorePageProps {
  storybooks: Storybook[];
  onToggleBookmark: (id: number) => void;
  onToggleLike: (id: number) => void;
  onViewStorybook: (storybook: Storybook) => void;
}

export function ExplorePage({ storybooks, onToggleBookmark, onToggleLike, onViewStorybook }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>('popular');
  const [isScrolled, setIsScrolled] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

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

  // Extract all unique categories from storybooks
  const allCategories = Array.from(
    new Set(storybooks.flatMap(book => book.categories))
  ).sort();

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle category toggle
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSortBy('popular');
  };

  // Apply filters and sort
  const filteredStorybooks = storybooks
    .filter(book => {
      // Search filter
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategories.length === 0 ||
        book.categories.some(cat => selectedCategories.includes(cat));

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes;
        case 'newest':
          return b.id - a.id;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  return (
    <>
      {/* Top Bar - Responsive */}
      <div className={`fixed top-0 left-0 md:left-20 right-0 z-40 px-4 md:px-6 h-16 flex items-center bg-white/95 backdrop-blur-md transition-all duration-[var(--duration-normal)] ${
        isScrolled ? 'border-b border-[var(--border)] shadow-sm' : ''
      }`}>
        <div className="flex items-center justify-between w-full">
          <h1 className="text-[var(--text-primary)] font-bold">도서관</h1>

          {/* Desktop Search - Input with dropdown */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-md mx-4 md:mx-6 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <Input
                type="text"
                placeholder="동화책 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full bg-white border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] pl-12 pr-10 py-2.5 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:border-[var(--primary)] rounded-full"
                aria-label="동화책 검색"
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
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      카테고리 필터와 함께 사용해보세요
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
                      placeholder="동화책 검색..."
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

          {/* Filter Button */}
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] gap-2 rounded-full px-4 relative font-semibold"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">필터</span>
                {(selectedCategories.length > 0 || sortBy !== 'popular') && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#66BB6A] text-white text-xs rounded-full flex items-center justify-center">
                    {selectedCategories.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#E0E0E0] shadow-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#1A1A1A] font-bold flex items-center justify-between">
                  <span>동화책 필터</span>
                  {(selectedCategories.length > 0 || sortBy !== 'popular') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-[#757575] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] text-sm"
                    >
                      모두 지우기
                    </Button>
                  )}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  카테고리와 설정으로 동화책 필터 및 정렬
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-6">
                  {/* Sort Options */}
                  <div className="space-y-3">
                    <h3 className="text-[#1A1A1A] font-semibold">정렬 기준</h3>
                    <RadioGroup value={sortBy} onValueChange={(value: 'newest' | 'popular' | 'alphabetical') => setSortBy(value)}>
                      <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-[#F5F5F5] transition-colors">
                        <RadioGroupItem value="popular" id="popular" className="border-[#E0E0E0] text-[#1A1A1A]" />
                        <Label htmlFor="popular" className="text-[#1A1A1A] cursor-pointer flex-1">
                          인기순
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-[#F5F5F5] transition-colors">
                        <RadioGroupItem value="newest" id="newest" className="border-[#E0E0E0] text-[#1A1A1A]" />
                        <Label htmlFor="newest" className="text-[#1A1A1A] cursor-pointer flex-1">
                          최신순
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded-xl hover:bg-[#F5F5F5] transition-colors">
                        <RadioGroupItem value="alphabetical" id="alphabetical" className="border-[#E0E0E0] text-[#1A1A1A]" />
                        <Label htmlFor="alphabetical" className="text-[#1A1A1A] cursor-pointer flex-1">
                          가나다순
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Category Filters */}
                  <div className="space-y-3">
                    <h3 className="text-[#1A1A1A] font-semibold">카테고리</h3>
                    <div className="space-y-2">
                      {allCategories.map(category => (
                        <div
                          key={category}
                          className="flex items-center space-x-2 p-2 rounded-xl hover:bg-[#F5F5F5] transition-colors"
                        >
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                            className="border-[#66BB6A]/30 data-[state=checked]:bg-[#66BB6A] data-[state=checked]:border-[#66BB6A]"
                          />
                          <Label htmlFor={category} className="text-[#424242] cursor-pointer flex-1">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4 border-t border-[#E0E0E0]">
                <Button
                  onClick={() => setFilterOpen(false)}
                  className="flex-1 bg-gradient-to-br from-[#66BB6A] to-[#388E3C] hover:from-[#388E3C] hover:to-[#2E7D32] text-white shadow-lg shadow-[#66BB6A]/30 rounded-full"
                >
                  필터 적용
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid Layout - pt-24 for spacing below h-16 topbar */}
      <div className="pt-24 px-4 md:px-6 pb-8 bg-[var(--background)] min-h-screen">
        {filteredStorybooks.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[#F1F8E9] flex items-center justify-center">
                <Search className="w-12 h-12 text-[#66BB6A]" />
              </div>
              <h2 className="text-[#424242] font-bold mb-2">
                {storybooks.length === 0 ? '동화책이 없습니다' : '일치하는 동화책이 없습니다'}
              </h2>
              <p className="text-[#757575] font-normal text-sm">
                {storybooks.length === 0
                  ? '커뮤니티에 첫 번째 동화책을 공유해 보세요!'
                  : '필터를 조정하거나 검색어를 변경해 보세요'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
            {filteredStorybooks.map((storybook) => (
              <StorybookCard
                key={storybook.id}
                storybook={storybook}
                onToggleBookmark={onToggleBookmark}
                onToggleLike={onToggleLike}
                onViewStorybook={onViewStorybook}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface StorybookCardProps {
  storybook: Storybook;
  onToggleBookmark: (id: number) => void;
  onToggleLike: (id: number) => void;
  onViewStorybook: (storybook: Storybook) => void;
}

function StorybookCard({ storybook, onToggleBookmark, onToggleLike, onViewStorybook }: StorybookCardProps) {
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

          {/* Likes and Bookmark */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(storybook.id);
              }}
              className="flex items-center gap-1.5 text-[#757575] hover:text-[#66BB6A] transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span className="text-sm">{storybook.likes.toLocaleString()}</span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(storybook.id);
              }}
              className={`w-8 h-8 rounded-full transition-colors border ${
                storybook.isBookmarked
                  ? 'text-[#66BB6A] bg-[#F1F8E9] border-[#66BB6A]/30'
                  : 'text-[#757575] hover:text-[#66BB6A] hover:bg-[#F1F8E9] border-transparent hover:border-[#66BB6A]/20'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${storybook.isBookmarked ? 'fill-current' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
