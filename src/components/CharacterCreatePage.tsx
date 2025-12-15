"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ArrowLeft, Sparkles, Plus, X, MessageCircle, Upload, User, Heart, Wand2, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PERSONALITY_EXAMPLES, DIALOGUE_EXAMPLES } from '@/store';

// Zod schema for form validation
const characterSchema = z.object({
  name: z.string().min(1, '캐릭터 이름을 입력해주세요'),
  personality: z.string().optional(),
  dialogueInput: z.string().max(80, '대사는 80자 이내로 입력해주세요').optional(),
  visualHint: z.string().max(200, '외형/추가 요청은 200자 이내로 입력해주세요').optional(),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CharacterCreatePageProps {
  onBack: () => void;
  onSubmit: (character: {
    name: string;
    personality: string;
    dialogues: string[];
    imageFile: File | null;
    imagePreview: string | null;
    visualHint: string;
    artStyle: string;
  }) => Promise<void>;
  initialCharacter?: {
    name: string;
    personality: string;
    dialogues: string[];
    imageUrl: string | null;
    visualHint?: string;
    artStyle?: string;
  };
  mode?: 'create' | 'edit';
}

export function CharacterCreatePage({ onBack, onSubmit, initialCharacter, mode = 'create' }: CharacterCreatePageProps) {
  const isEdit = mode === 'edit';
  const [dialogues, setDialogues] = useState<string[]>([]);
  const [newDialogue, setNewDialogue] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialCharacter?.imageUrl || null);
  const [artStyle, setArtStyle] = useState(initialCharacter?.artStyle || '');
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
      name: initialCharacter?.name || '',
      personality: initialCharacter?.personality || '',
      visualHint: initialCharacter?.visualHint || '',
    },
  });

  const watchedName = watch('name');
  const watchedPersonality = watch('personality');
  const watchedVisualHint = watch('visualHint');

  // hydrate initial dialogues
  useEffect(() => {
    if (initialCharacter?.dialogues?.length) {
      setDialogues([initialCharacter.dialogues[0]]);
      setNewDialogue(initialCharacter.dialogues[0]);
    }
  }, [initialCharacter]);

  // Calculate progress
  const progress = useMemo(() => {
    let completed = 0;
    if (watchedName?.trim()) completed += 25;
    if (imagePreview) completed += 25;
    if (watchedPersonality?.trim()) completed += 20;
    if (watchedVisualHint?.trim()) completed += 10;
    if (dialogues.length > 0) completed += 8;
    return Math.min(100, completed);
  }, [watchedName, imagePreview, watchedPersonality, watchedVisualHint, dialogues.length]);

  // Add dialogue
  const addDialogue = () => {
    const trimmed = newDialogue.trim();
    if (!trimmed) return;
    if (trimmed.length > 80) {
      alert('대사는 80자 이내로 입력해주세요.');
      return;
    }
    // 대사는 하나만 유지
    setDialogues([trimmed]);
    setNewDialogue(trimmed);
  };

  const addDialogueFromExample = (dialogue: string) => {
    if (!dialogue) return;
    if (dialogue.length > 80) {
      alert('대사 예시는 80자 이내로 선택해주세요.');
      return;
    }
    // 대사는 하나만 유지
    setDialogues([dialogue]);
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
      setImageFile(file);
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
    if (isEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [isEdit]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (isEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [isEdit]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isEdit) return;
    e.preventDefault();
    e.stopPropagation();
  }, [isEdit]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (isEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile, isEdit]);

  // Handle click on drop zone
  const handleDropZoneClick = () => {
    if (isEdit) return; // editing: 이미지 변경 불가
    fileInputRef.current?.click();
  };

  // Remove image
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(initialCharacter?.imageUrl || null);
    setImageFile(null);
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
        dialogues,
        imageFile,
        imagePreview,
        visualHint: data.visualHint?.trim() || '',
        artStyle,
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

    const requireImage = mode === 'create';
    if (requireImage && !hasImage) {
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
            <h1 className="text-[#1A1A1A] font-bold text-lg">{isEdit ? '캐릭터 수정' : '새 캐릭터 만들기'}</h1>
          </div>
          <p className="text-[#757575] text-sm">
            {isEdit ? '이미지는 그대로 두고 정보만 수정할 수 있어요' : '나만의 특별한 캐릭터를 만들어보세요'}
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
              disabled={isEdit}
            />

            {/* Image Upload Area */}
            <div
              onClick={handleDropZoneClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden transition-all relative group ${
                isEdit
                  ? 'bg-[#FAFAFA] border-2 border-[#E0E0E0] cursor-not-allowed'
                  : isDragging
                    ? 'bg-[#FFA726]/10 border-2 border-[#FFA726] cursor-pointer'
                    : hasAttemptedSubmit && !hasImage
                      ? 'bg-red-50 border-2 border-dashed border-red-400 cursor-pointer'
                      : 'bg-[#FAFAFA] border-2 border-dashed border-[#E0E0E0] hover:border-[#FFA726]/50 cursor-pointer'
              }`}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="바꿀 이미지"
                    className="w-full h-full object-cover"
                  />
                  {!isEdit && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                      <Upload className="w-6 h-6 text-white" />
                      <p className="text-white text-xs font-medium">변경</p>
                    </div>
                  )}
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

          {/* Visual / Extra Request Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-[#FFA726]" />
              <h3 className="text-[#424242] font-semibold text-sm">외형/추가 요청</h3>
              <span className="text-xs text-[#9E9E9E]">선택</span>
            </div>
            <Textarea
              {...register('visualHint')}
              placeholder="예: 분홍 토끼 귀와 파스텔 후드티, 작은 별 모양 가방"
              className="min-h-[80px] rounded-md border border-[#E0E0E0] bg-white resize-none focus-visible:ring-2 focus-visible:ring-[#FFA726]/30 focus-visible:border-[#FFA726] hover:border-[#FFA726]/50 transition-all text-sm"
              maxLength={200}
              disabled={isEdit}
              readOnly={isEdit}
            />
            <p className="text-xs text-[#9E9E9E] mt-1">이미지 변환/모델링 시 반영할 외형·소품·분위기 등을 적어주세요. (최대 200자)</p>

            <div className="mt-3">
              <p className="text-xs text-[#9E9E9E] mb-1.5">아트 스타일 (선택)</p>
              <div className="flex flex-wrap gap-2">
                {['', '수채화', '파스텔', '만화', '디지털'].map((style) => (
                  <Button
                    key={style || 'none'}
                    type="button"
                    variant={artStyle === style ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isEdit && setArtStyle(style)}
                    disabled={isEdit}
                    className={`rounded-full px-3 ${artStyle === style ? 'bg-[#FFA726] text-white border-[#FFA726]' : 'bg-white border-[#E0E0E0] text-[#757575]'} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {style || '기본'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Dialogues Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-[#FFA726]" />
              <h3 className="text-[#424242] font-semibold text-sm">대표 대사 (1개)</h3>
            </div>

            {/* Dialogue Input */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newDialogue}
                onChange={(e) => setNewDialogue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDialogue())}
                placeholder="캐릭터의 대표 대사 한 줄 (최대 80자)"
                maxLength={80}
                className="flex-1 h-10 rounded-lg border border-[#E0E0E0] bg-white focus-visible:ring-2 focus-visible:ring-[#FFA726]/30 focus-visible:border-[#FFA726] hover:border-[#FFA726]/50 transition-all text-sm"
              />
              <Button
                type="button"
                onClick={addDialogue}
                disabled={!newDialogue.trim()}
                className="h-10 w-24 rounded-lg bg-[#FFA726] hover:bg-[#F57C00] text-white"
              >
                저장
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
                    disabled={dialogues.length >= 1}
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
                {isEdit ? '캐릭터 수정 중...' : '캐릭터 만드는 중...'}
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center text-sm">
                {isEdit ? '캐릭터 수정하기' : '캐릭터 생성하기'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
