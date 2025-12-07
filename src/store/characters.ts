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
  createdAt?: string;
}

// 성격 예시
export const PERSONALITY_EXAMPLES = [
  "밝고 활발한 성격으로 항상 긍정적인 에너지를 뿜어내요",
  "수줍음이 많지만 친구들에게는 따뜻하고 다정해요",
  "호기심이 많아서 새로운 것을 탐험하는 걸 좋아해요",
  "용감하고 정의로운 성격으로 친구들을 지켜주려 해요",
  "똑똒하고 차분해서 어려운 문제도 잘 해결해요",
  "장난기가 많지만 속마음은 따뜻한 친구예요",
  "느긋하고 여유로운 성격으로 주변을 편안하게 만들어요",
  "부끄러움을 잘 타지만 마음속엔 큰 꿈이 있어요",
];

// 키워드 예시
export const KEYWORD_EXAMPLES = [
  "용감한", "귀여운", "똑똒한", "장난꾸러기",
  "친절한", "호기심왕", "수줍은", "활발한",
  "다정한", "씩씩한", "온순한", "당당한",
  "엉뚱한", "사랑스러운", "의리있는", "배려심깊은",
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
  createCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => Promise<Character>;
  deleteCharacter: (id: number) => Promise<void>;
  updateCharacter: (id: number, updates: Partial<Character>) => Promise<void>;
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
        personality?: string;
        keywords?: string[];
        dialogues?: string[];
        createdAt?: string;
        created_at?: string;
      }>>("/characters/me");

      const mapped: Character[] = data.map((c) => ({
        id: c.id,
        name: c.name || "이름 없음",
        imageUrl: normalizeImage(c.imageUrl || c.image_url),
        personality: c.personality || "",
        keywords: c.keywords || [],
        dialogues: c.dialogues || [],
        createdAt: c.createdAt || c.created_at,
      }));

      set({ characters: mapped, isLoading: false });
    } catch (err) {
      console.error("캐릭터 불러오기 실패", err);
      set({ error: "캐릭터를 불러오는데 실패했습니다.", isLoading: false });
    }
  },

  createCharacter: async (character) => {
    const formData = new FormData();
    formData.append('name', character.name);
    formData.append('personality', character.personality);
    formData.append('keywords', JSON.stringify(character.keywords));
    formData.append('dialogues', JSON.stringify(character.dialogues));

    // 이미지 URL이 있으면 전송 (실제로는 이미지 파일을 업로드해야 할 수 있음)
    if (character.imageUrl) {
      formData.append('imageUrl', character.imageUrl);
    }

    const created = await apiFetch<{
      id: number;
      name: string;
      imageUrl?: string | null;
      personality?: string;
      keywords?: string[];
      dialogues?: string[];
    }>("/characters", {
      method: "POST",
      body: {
        name: character.name,
        personality: character.personality,
        keywords: character.keywords,
        dialogues: character.dialogues,
        imageUrl: character.imageUrl,
      },
    });

    const newCharacter: Character = {
      id: created.id,
      name: created.name,
      imageUrl: created.imageUrl || null,
      personality: created.personality || "",
      keywords: created.keywords || [],
      dialogues: created.dialogues || [],
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
    await apiFetch(`/characters/${id}`, {
      method: "PATCH",
      body: updates,
    });
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  setCharacters: (characters) => set({ characters }),
}));
