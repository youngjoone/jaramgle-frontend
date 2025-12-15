"use client";

import { create } from 'zustand';
import { apiFetch, BACKEND_ORIGIN } from '@/lib/api';

export interface Character {
  id: number;
  name: string;
  imageUrl: string | null;
  personality: string;
  keywords: string[];
  dialogues: string[];
  visualHint?: string;
  artStyle?: string;
  createdAt?: string;
}

// 성격 예시
export const PERSONALITY_EXAMPLES = [
  "밝고 활발한 성격으로 항상 긍정적인 에너지를 뿜어내요",
  "수줍음이 많지만 친구들에게는 따뜻하고 다정해요",
  "호기심이 많아서 새로운 것을 탐험하는 걸 좋아해요",
  "용감하고 정의로운 성격으로 친구들을 지켜주려 해요",
  "똑똑하고 차분해서 어려운 문제도 잘 해결해요",
  "장난기가 많지만 속마음은 따뜻한 친구예요",
  "느긋하고 여유로운 성격으로 주변을 편안하게 만들어요",
  "부끄러움을 잘 타지만 마음속엔 큰 꿈이 있어요",
];

// 키워드 예시
export const KEYWORD_EXAMPLES = [
  "분홍 토끼 귀", "노란 우비와 장화", "별무늬 망토", "파스텔 고양이 후드",
  "초록 공룡 후드", "반짝이는 요정 날개", "작은 탐험가 모자", "별빛 지팡이",
  "붉은 망토와 나침반", "파란 비행 모자", "무지개 팔찌", "별무늬 파자마",
  "꽃무늬 원피스", "반달 안경", "로봇 팔 장갑", "물감 묻은 앞치마",
];

// 대사 예시
export const DIALOGUE_EXAMPLES = [
  "안녕! 오늘도 신나는 모험을 떠나볼까?",
  "걱정 마! 내가 도와줄게!",
  "우와, 정말 신기하다! 이건 뭘까?",
  "친구가 생겨서 정말 기뻐!",
  "포기하지 않으면 꼭 할 수 있어!",
  "같이 가면 무섭지 않아!",
  "음... 생각을 좀 해봐야겠어.",
  "하하, 그건 비밀이야~",
  "괜찮아, 다시 해보자!",
  "넌 정말 대단한 친구야!",
];

const placeholderImage = "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=400&q=80";

interface CharactersState {
  characters: Character[];
  isLoading: boolean;
  error: string | null;
  loadCharacters: () => Promise<void>;
  createCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'imageUrl'> & { imageFile: File | null; imagePreview?: string | null }) => Promise<Character>;
  deleteCharacter: (id: number) => Promise<void>;
  updateCharacter: (id: number, updates: Partial<Character> & { imageFile?: File | null }) => Promise<void>;
  setCharacters: (characters: Character[]) => void;
}

export const useCharactersStore = create<CharactersState>((set, get) => ({
  characters: [],
  isLoading: false,
  error: null,

  loadCharacters: async () => {
    set({ isLoading: true, error: null });
    try {
      const normalizeImage = (url?: string | null) => {
        if (!url) return placeholderImage;
        if (/^https?:\/\//i.test(url)) return url;
        return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
      };

      const data = await apiFetch<Array<{
        id: number;
        name: string;
        imageUrl?: string | null;
        image_url?: string | null;
        persona?: string;
        catchphrase?: string;
        promptKeywords?: string;
        visualDescription?: string;
        artStyle?: string;
        personality?: string; // legacy/local
        keywords?: string[];  // legacy/local
        dialogues?: string[]; // legacy/local
        createdAt?: string;
        created_at?: string;
      }>>("/characters/me");

      const mapped: Character[] = data.map((c) => ({
        id: c.id,
        name: c.name || "이름 없음",
        imageUrl: normalizeImage(c.imageUrl || c.image_url),
        personality: c.persona || c.personality || "",
        keywords: c.promptKeywords
          ? c.promptKeywords.split(',').map((k) => k.trim()).filter(Boolean)
          : c.keywords || [],
        dialogues: c.catchphrase
          ? [c.catchphrase]
          : (c.dialogues || []),
        visualHint: c.visualDescription || "",
        artStyle: c.artStyle || "",
        createdAt: c.createdAt || c.created_at,
      }));

      set({ characters: mapped, isLoading: false });
    } catch (err) {
      console.error("캐릭터 불러오기 실패", err);
      set({ error: "캐릭터를 불러오는데 실패했습니다.", isLoading: false });
    }
  },

  createCharacter: async (character) => {
    if (!character.imageFile) {
      throw new Error("이미지 파일이 필요합니다.");
    }

    // 백엔드 CreateCharacterRequest 매핑
    const payload = {
      name: character.name,
      persona: character.personality,
      catchphrase: character.dialogues[0] || "",
      promptKeywords: "", // 키워드 입력 제거
      visualDescription: character.visualHint || character.personality || "",
      descriptionPrompt: character.visualHint || character.dialogues[0] || "",
      artStyle: character.artStyle || "",
    };

    const formData = new FormData();
    formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    formData.append("photo", character.imageFile);

    const created = await apiFetch<Character>("/characters", {
      method: "POST",
      body: formData,
    });

    const newCharacter: Character = {
      id: created.id,
      name: created.name,
      imageUrl: created.imageUrl || null,
      personality: (created as any).persona || created.personality || "",
      keywords: (created as any).promptKeywords
        ? (created as any).promptKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
        : created.keywords || [],
      dialogues: (created as any).catchphrase
        ? [(created as any).catchphrase]
        : created.dialogues || character.dialogues,
      visualHint: (created as any).visualDescription || character.visualHint,
      artStyle: (created as any).artStyle || character.artStyle,
      createdAt: created.createdAt,
    };

    set((state) => ({
      characters: [newCharacter, ...state.characters],
    }));

    return newCharacter;
  },

  deleteCharacter: async (id) => {
    await apiFetch(`/characters/${id}`, { method: "DELETE" });
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
    }));
  },

  updateCharacter: async (id, updates) => {
    const payload = {
      name: updates.name,
      persona: updates.personality,
      catchphrase: updates.dialogues?.[0] || updates.dialogues?.[0] || "",
      promptKeywords: "",
      visualDescription: updates.visualHint || updates.personality || "",
      descriptionPrompt: updates.visualHint || updates.dialogues?.[0] || "",
      artStyle: updates.artStyle || "",
    };

    const formData = new FormData();
    formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (updates.imageFile) {
      formData.append("photo", updates.imageFile);
    }

    const updated = await apiFetch<Character>(`/characters/${id}`, {
      method: "PUT",
      body: formData,
    });

    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id
          ? {
              ...c,
              name: updated.name,
              imageUrl: updates.imageFile ? (updated.imageUrl || c.imageUrl) : c.imageUrl,
              personality: (updated as any).persona || updated.personality || c.personality,
              dialogues: (updated as any).catchphrase
                ? [(updated as any).catchphrase]
                : updated.dialogues || updates.dialogues || c.dialogues,
              visualHint: (updated as any).visualDescription || updates.visualHint || c.visualHint,
              artStyle: (updated as any).artStyle || updates.artStyle || c.artStyle,
            }
          : c
      ),
    }));
  },

  setCharacters: (characters) => set({ characters }),
}));
