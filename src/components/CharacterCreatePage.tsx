"use client";

import { useState, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Sparkles, Plus, X, Tag, MessageCircle, Upload, User, Heart, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  PERSONALITY_EXAMPLES,
  KEYWORD_EXAMPLES,
  DIALOGUE_EXAMPLES,
} from '@/store';

// Zod schema for form validation
const characterSchema = z.object({
  name: z.string().min(1, '캐릭터 이름을 입력해주세요'),
  personality: z.string().optional(),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CharacterCreatePageProps {
  onBack: () => void;
  onSubmit: (character: {
    name: string;
    personality: string;
    keywords: string[];
    dialogues: string[];
    imageUrl: string | null;
  }) => Promise<void>;
}

export function CharacterCreatePage({ onBack, onSubmit }: CharacterCreatePageProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [dialogues, setDialogues] = useState<string[]>([]);
  const [newDialogue, setNewDialogue] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLDivElement>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      personality: '',
    },
  });

  const watchedName = watch('name');
  const watchedPersonality = watch('personality');

  // Calculate progress
  const progress = useMemo(() => {
    let completed = 0;
    if (watchedName?.trim()) completed += 25;
    if (imagePreview) completed += 25;
    if (watchedPersonality?.trim()) completed += 20;
    if (keywords.length > 0) completed += 15;
    if (dialogues.length > 0) completed += 15;
    return completed;
  }, [watchedName, imagePreview, watchedPersonality, keywords.length, dialogues.length]);

  // Add keyword
  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim()) && keywords.length < 8) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const addKeywordFromExample = (keyword: string) => {
    if (!keywords.includes(keyword) && keywords.length < 8) {
      setKeywords([...keywords, keyword]);
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  // Add dialogue
  const addDialogue = () => {
    if (newDialogue.trim() && !dialogues.includes(newDialogue.trim()) && dialogues.length < 5) {
      setDialogues([...dialogues, newDialogue.trim()]);
      setNewDialogue('');
    }
  };

  const addDialogueFromExample = (dialogue: string) => {
    if (!dialogues.includes(dialogue) && dialogues.length < 5) {
      setDialogues([...dialogues, dialogue]);
    }
  };

  const removeDialogue = (dialogue: string) => {
    setDialogues(dialogues.filter(d => d !== dialogue));
  };

  // Handle file processing
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle image upload from input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Handle click on drop zone
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Remove image
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const onFormSubmit = async (data: CharacterFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name.trim(),
        personality: data.personality?.trim() || '',
        keywords,
        dialogues,
        imageUrl,
      });
    } catch (err) {
      console.error('캐릭터 생성 실패:', err);
      alert('캐릭터 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if image is uploaded
  const hasImage = !!imagePreview;

  // Handle submit button click - trigger validation first
  const handleSubmitClick = async () => {
    setHasAttemptedSubmit(true);
    const isFormValid = await trigger();

    // Check image first, then name
    if (!hasImage) {
      imageInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!isFormValid) {
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    handleSubmit(onFormSubmit)();
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#FFFFFF]">
      <div className="max-w-[600px] mx-auto px-4 py-6 pb-40 md:pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="grid grid-cols-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#F5F5F5] border border-[#E0E0E0]"
            >
              <ArrowLeft className="w-4 h-4 text-[#757575]" />
            </Button>
            <h1 className="text-[#1A1A1A] font-bold text-lg">새 캐릭터 만들기</h1>
          </div>
          <p className="text-[#757575] text-sm">
            나만의 특별한 캐릭터를 만들어보세요
          </p>
        </div>

        {/* Form Layout */}
        <div className="space-y-4">

          {/* Character Image Section */}
          <div
            ref={imageInputRef}
            className={`bg-white rounded-2xl p-4 shadow-sm border transition-all border-[#E0E0E0]`}
          >
            <div className="flex items-center gap-2 mb-3">
              <User className={`w-4 h-4 ${hasAttemptedSubmit && !hasImage ? 'text-red-400' : 'text-[#FFA726]'}`} />
              <h3 className="text-[#424242] font-semibold text-sm">바꿀 이미지</h3>
              <span className="text-red-400 text-xs">*</span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Image Upload Area */}
            <div
              onClick={handleDropZoneClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden cursor-pointer transition-all relative group ${
                isDragging
                  ? 'bg-[#FFA726]/10 border-2 border-[#FFA726]'
                  : hasAttemptedSubmit && !hasImage
                    ? 'bg-red-50 border-2 border-dashed border-red-400'
                    : 'bg-[#FAFAFA] border-2 border-dashed border-[#E0E0E0] hover:border-[#FFA726]/50'
              }`}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="바꿀 이미지"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                    <Upload className="w-6 h-6 text-white" />
                    <p className="text-white text-xs font-medium">변경</p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                    hasAttemptedSubmit && !hasImage ? 'bg-red-100' : 'bg-[#FFA726]/10'
                  }`}>
                    <Upload className={`w-6 h-6 ${
                      isDragging ? 'text-[#F57C00]' : hasAttemptedSubmit && !hasImage ? 'text-red-400' : 'text-[#FFA726]'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium ${hasAttemptedSubmit && !hasImage ? 'text-red-400' : 'text-[#757575]'}`}>
                    {isDragging ? '여기에 놓아주세요' : '클릭 또는 드래그하여 업로드'}
                  </p>
                  <p className="text-[#BDBDBD] text-xs mt-1">PNG, JPG, GIF</p>
                </div>
              )}
            </div>
            <AnimatePresence>
              {hasAttemptedSubmit && !hasImage && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-red-400 text-xs mt-2 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  바꿀 이미지를 업로드해주세요
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Name Input Section */}
          <div ref={nameInputRef} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#FFA726]" />
              <h3 className="text-[#424242] font-semibold text-sm">캐릭터 이름</h3>
              <span className="text-red-400 text-xs">*</span>
            </div>
            <Input
              {...register('name')}
              placeholder="예: 꼬마 여우 또리"
              className={`h-11 rounded-xl bg-white transition-all ${
                hasAttemptedSubmit && errors.name
                  ? 'border-red-400 focus-visible:ring-red-400/30 focus-visible:border-red-400'
                  : 'border border-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#FFA726]/30 focus-visible:border-[#FFA726] hover:border-[#FFA726]/50'
              }`}
            />
            <AnimatePresence>
              {hasAttemptedSubmit && errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-red-400 text-xs mt-1 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  {errors.name.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Personality Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-[#FFA726]" />
              <h3 className="text-[#424242] font-semibold text-sm">성격</h3>
            </div>
            <Textarea
              {...register('personality')}
              placeholder="캐릭터의 성격을 설명해주세요..."
              className="min-h-[80px] rounded-md border border-[#E0E0E0] bg-white resize-none focus-visible:ring-2 focus-visible:ring-[#FFA726]/30 focus-visible:border-[#FFA726] hover:border-[#FFA726]/50 transition-all text-sm"
            />
            <div className="mt-2">
              <p className="text-xs text-[#9E9E9E] mb-1.5">빠른 선택:</p>
              <div className="flex flex-wrap gap-1.5">
                {PERSONALITY_EXAMPLES.slice(0, 4).map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setValue('personality', example)}
                    className="text-xs text-[#F57C00] bg-[#FFA726]/10 px-2.5 py-1.5 rounded-full hover:bg-[#FFA726]/20 transition-all border border-[#FFA726]/20"
                  >
                    {example.length > 20 ? example.slice(0, 20) + '...' : example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#FFA726]" />
                <h3 className="text-[#424242] font-semibold text-sm">키워드</h3>
              </div>
              <span className="text-xs text-[#9E9E9E]">{keywords.length}/8</span>
            </div>

            {/* Keyword Input */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                placeholder="키워드 입력..."
                className="flex-1 h-10 rounded-lg border border-[#E0E0E0] bg-white focus-visible:ring-2 focus-visible:ring-[#FFA726]/30 focus-visible:border-[#FFA726] hover:border-[#FFA726]/50 transition-all text-sm"
              />
              <Button
                type="button"
                onClick={addKeyword}
                disabled={!newKeyword.trim() || keywords.length >= 8}
                className="h-10 w-10 rounded-lg bg-[#FFA726] hover:bg-[#F57C00] text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Added Keywords */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {keywords.map((keyword) => (
                  <Badge key={keyword} className="bg-[#FFA726]/10 text-[#F57C00] border border-[#FFA726]/30 px-2 py-1 text-xs rounded-full">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1.5 hover:bg-[#FFA726]/20 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Keyword Suggestions */}
            <div>
              <p className="text-xs text-[#9E9E9E] mb-1.5">추천:</p>
              <div className="flex flex-wrap gap-1.5">
                {KEYWORD_EXAMPLES.filter(k => !keywords.includes(k)).slice(0, 6).map((keyword, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addKeywordFromExample(keyword)}
                    disabled={keywords.length >= 8}
                    className="text-xs text-[#757575] bg-[#F5F5F5] px-2 py-1 rounded-full hover:bg-[#FFA726]/10 hover:text-[#F57C00] transition-all border border-[#E0E0E0] hover:border-[#FFA726]/30 disabled:opacity-50"
                  >
                    + {keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dialogues Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#FFA726]" />
                <h3 className="text-[#424242] font-semibold text-sm">대사</h3>
              </div>
              <span className="text-xs text-[#9E9E9E]">{dialogues.length}/5</span>
            </div>

            {/* Dialogue Input */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newDialogue}
                onChange={(e) => setNewDialogue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDialogue())}
                placeholder="캐릭터의 대사를 입력..."
                className="flex-1 h-10 rounded-lg border border-[#E0E0E0] bg-white focus-visible:ring-2 focus-visible:ring-[#FFA726]/30 focus-visible:border-[#FFA726] hover:border-[#FFA726]/50 transition-all text-sm"
              />
              <Button
                type="button"
                onClick={addDialogue}
                disabled={!newDialogue.trim() || dialogues.length >= 5}
                className="h-10 w-10 rounded-lg bg-[#FFA726] hover:bg-[#F57C00] text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Added Dialogues */}
            {dialogues.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {dialogues.map((dialogue) => (
                  <div
                    key={dialogue}
                    className="relative bg-[#FFA726]/10 rounded-lg rounded-tl-sm p-2.5 pr-8 group border border-[#FFA726]/20"
                  >
                    <p className="text-xs text-[#424242]">"{dialogue}"</p>
                    <button
                      type="button"
                      onClick={() => removeDialogue(dialogue)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#BDBDBD] hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dialogue Suggestions */}
            <div>
              <p className="text-xs text-[#9E9E9E] mb-1.5">예시:</p>
              <div className="space-y-1">
                {DIALOGUE_EXAMPLES.filter(d => !dialogues.includes(d)).slice(0, 3).map((dialogue, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addDialogueFromExample(dialogue)}
                    disabled={dialogues.length >= 5}
                    className="block w-full text-left text-xs text-[#757575] bg-[#F5F5F5] px-2.5 py-1.5 rounded-lg hover:bg-[#FFA726]/10 hover:text-[#F57C00] transition-all border border-[#E0E0E0] hover:border-[#FFA726]/30 disabled:opacity-50"
                  >
                    "{dialogue}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Submit Button */}
      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-20 right-0 bg-white border-t border-[#E0E0E0] p-4 z-40">
        <div className="max-w-[600px] mx-auto">
          <Button
            type="button"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            className={`w-full h-12 rounded-xl font-semibold transition-all duration-300 border-0 ${
              hasAttemptedSubmit && (!isValid || !hasImage)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-[#FFA726] hover:bg-[#F57C00] text-white shadow-[0_4px_16px_rgba(255,167,38,0.3)]'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center text-sm">
                캐릭터 만드는 중...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center text-sm">
                캐릭터 생성하기
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
