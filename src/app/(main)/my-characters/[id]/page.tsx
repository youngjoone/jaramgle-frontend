"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CharacterCreatePage } from '@/components/CharacterCreatePage';
import { useCharactersStore } from '@/store';

export default function CharacterDetail() {
  const router = useRouter();
  const params = useParams();
  const characterId = Number(params?.id);
  const { characters, loadCharacters, updateCharacter } = useCharactersStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const character = useMemo(
    () => characters.find((c) => c.id === characterId),
    [characters, characterId]
  );

  useEffect(() => {
    if (character) return;
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadCharacters();
      } catch (err: any) {
        console.error(err);
        if (mounted) setError('캐릭터를 불러오지 못했어요.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [character, loadCharacters]);

  const handleBack = () => {
    router.push('/my-characters');
  };

  const handleSubmit = async (updated: {
    name: string;
    personality: string;
    dialogues: string[];
    imageFile: File | null;
    imagePreview: string | null;
    visualHint: string;
    artStyle: string;
  }) => {
    try {
      await updateCharacter(characterId, {
        name: updated.name,
        personality: updated.personality,
        dialogues: updated.dialogues,
        imageFile: updated.imageFile || undefined,
        visualHint: updated.visualHint,
        artStyle: updated.artStyle,
      });
      router.push('/my-characters');
    } catch (err) {
      console.error(err);
      alert('캐릭터 수정에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  if (isLoading || (!character && !error)) {
    return <div className="p-6 text-sm text-[#757575]">캐릭터를 불러오는 중...</div>;
  }

  if (error || !character) {
    return <div className="p-6 text-sm text-red-500">{error || '캐릭터를 찾을 수 없습니다.'}</div>;
  }

  return (
    <CharacterCreatePage
      onBack={handleBack}
      onSubmit={handleSubmit}
      initialCharacter={{
        name: character.name,
        personality: character.personality,
        dialogues: character.dialogues,
        imageUrl: character.imageUrl,
        visualHint: character.visualHint,
        artStyle: character.artStyle,
      }}
      mode="edit"
    />
  );
}
