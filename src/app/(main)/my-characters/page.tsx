"use client";

import { useRouter } from 'next/navigation';
import { MyCharactersPage } from '@/components/MyCharactersPage';
import { useCharactersStore } from '@/store';
import { useEffect, useState } from 'react';

export default function MyCharacters() {
  const router = useRouter();
  const { characters, deleteCharacter, loadCharacters } = useCharactersStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadCharacters();
      } catch (err: any) {
        console.error(err);
        if (mounted) setError("캐릭터를 불러오지 못했어요.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [loadCharacters]);

  const handleDelete = async (id: number) => {
    try {
      await deleteCharacter(id);
    } catch (err) {
      alert("삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <MyCharactersPage
      characters={characters}
      onDelete={handleDelete}
      onNavigateToCreate={() => router.push('/my-characters/create')}
      onViewCharacter={(c) => router.push(`/my-characters/${c.id}`)}
      isLoading={isLoading}
      error={error}
    />
  );
}
