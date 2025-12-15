"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Trash2, X, Plus, Sparkles, MessageCircle, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertPopup } from '@/components/ui/alert-popup';
import { type Character } from '@/store';

interface MyCharactersPageProps {
  characters: Character[];
  onDelete: (id: number) => void;
  onNavigateToCreate: () => void;
  onViewCharacter?: (character: Character) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function MyCharactersPage({
  characters,
  onDelete,
  onNavigateToCreate,
  onViewCharacter,
  isLoading = false,
  error = null,
}: MyCharactersPageProps) {
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

  // Filter characters by search query
  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.personality.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      {/* Top Bar - Responsive */}
      <div className={`fixed top-0 left-0 md:left-20 right-0 z-40 px-4 md:px-6 h-16 flex items-center bg-white/95 backdrop-blur-md transition-all duration-[var(--duration-normal)] ${
        isScrolled ? 'border-b border-[var(--border)] shadow-sm' : ''
      }`}>
        <div className="flex items-center justify-between w-full">
          <div className="min-w-0">
            <h1 className="text-[var(--text-primary)] font-bold truncate">내 캐릭터</h1>
            <p className="text-sm text-[var(--text-tertiary)] font-medium mt-0.5 hidden sm:block">
              {characters.length}개의 캐릭터
            </p>
          </div>

          {/* Desktop Search - Input with dropdown */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-md mx-4 md:mx-6 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
              <Input
                type="text"
                placeholder="캐릭터 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full bg-white border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] pl-12 pr-10 py-2.5 focus-visible:ring-2 focus-visible:ring-[#FFA726] focus-visible:border-[#FFA726] rounded-full"
                aria-label="캐릭터 검색"
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFA726]" />
                      캐릭터 이름으로 검색하세요
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFA726]" />
                      성격이나 키워드로도 검색할 수 있어요
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
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFA726] rounded-full" />
                )}
              </Button>
            ) : (
              <div className="fixed inset-x-0 top-0 bg-white/95 backdrop-blur-md z-50 px-4 py-3 border-b border-[var(--border)] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
                    <Input
                      type="text"
                      placeholder="캐릭터 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)] pl-12 pr-10 py-2.5 focus-visible:ring-2 focus-visible:ring-[#FFA726] focus-visible:border-[#FFA726] rounded-full"
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
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFA726]" />
                      캐릭터 이름으로 검색하세요
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFA726]" />
                      성격이나 키워드로도 검색할 수 있어요
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Create Button */}
          <Button
            onClick={onNavigateToCreate}
            className="bg-[#FFA726] text-white hover:bg-[#F57C00] hover:shadow-lg rounded-full px-4 md:px-6 font-semibold touch-target"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">캐릭터 만들기</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* Grid Layout - pt-24 for spacing below h-16 topbar */}
      <div className="pt-24 px-4 md:px-6 pb-8 bg-[var(--background)] min-h-screen">
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)] text-sm text-[#757575]">
            캐릭터를 불러오는 중...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)] text-sm text-red-500">
            {error}
          </div>
        ) : characters.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <h2 className="text-[#1A1A1A] font-bold mb-2">아직 캐릭터가 없습니다</h2>
              <p className="text-[#757575] font-normal text-sm mb-6">나만의 캐릭터를 만들어 동화책에 등장시켜보세요!</p>
              <Button
                onClick={onNavigateToCreate}
                className="bg-[#FFA726] text-white hover:bg-[#F57C00] rounded-full px-6 font-semibold"
              >
                <Plus className="w-4 h-4" />
                첫 캐릭터 만들기
              </Button>
            </div>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[#FFF3E0] flex items-center justify-center">
                <Search className="w-12 h-12 text-[#FFA726]" />
              </div>
              <h2 className="text-[#424242] font-bold mb-2">일치하는 캐릭터가 없습니다</h2>
              <p className="text-[#757575] font-normal text-sm">검색어를 변경해 보세요</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {filteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onDelete={onDelete}
                onView={onViewCharacter}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface CharacterCardProps {
  character: Character;
  onDelete: (id: number) => void;
  onView?: (character: Character) => void;
}

function CharacterCard({ character, onDelete, onView }: CharacterCardProps) {
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeletePopup(true);
  };

  const confirmDelete = () => {
    onDelete(character.id);
    setShowDeletePopup(false);
  };

  return (
    <motion.div
      className="group cursor-pointer bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(255,167,38,0.2)] border border-[#E0E0E0] hover:border-[#FFA726] transition-all duration-300 relative overflow-hidden rounded-xl"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={() => onView?.(character)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView?.(character);
        }
      }}
    >
      {/* Content */}
      <div className="relative">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden mb-4 rounded-lg">
          {character.imageUrl ? (
            <img
              src={character.imageUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2] flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-[#FFA726]" />
            </div>
          )}

          {/* Hover Overlay with Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#424242]/90 via-transparent to-transparent opacity-100 min-[1920px]:opacity-0 min-[1920px]:group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-end">
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
        <div className="space-y-3 px-1">
          {/* Name */}
          <h3 className="text-[#424242] font-semibold text-lg line-clamp-1">{character.name}</h3>

          {/* Personality */}
          {character.personality && (
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#FFA726] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#757575] line-clamp-2">{character.personality}</p>
            </div>
          )}

          {/* Keywords */}
          {character.keywords.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-[#FFA726] mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {character.keywords.slice(0, 4).map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-[#FFF3E0] border border-[#FFA726]/30 text-[#F57C00] text-xs px-2 py-0.5 font-medium"
                  >
                    {keyword}
                  </Badge>
                ))}
                {character.keywords.length > 4 && (
                  <Badge
                    variant="outline"
                    className="bg-[#F5F5F5] border border-[#E0E0E0] text-[#757575] text-xs px-2 py-0.5 font-medium"
                  >
                    +{character.keywords.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Dialogues Preview */}
          {character.dialogues.length > 0 && (
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-[#FFA726] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#757575] italic line-clamp-1">
                "{character.dialogues[0]}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      <AlertPopup
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        onConfirm={confirmDelete}
        title="캐릭터 삭제"
        description={`"${character.name}"을(를) 정말 삭제하시겠습니까? 삭제된 캐릭터는 복구할 수 없습니다.`}
        type="warning"
        confirmText="삭제"
        cancelText="취소"
      />
    </motion.div>
  );
}
