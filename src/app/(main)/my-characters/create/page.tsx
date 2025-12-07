"use client";

import { useRouter } from 'next/navigation';
import { CharacterCreatePage } from '@/components/CharacterCreatePage';
import { useCharactersStore } from '@/store';

export default function CreateCharacter() {
  const router = useRouter();
  const { createCharacter } = useCharactersStore();

  const handleBack = () => {
    router.push('/my-characters');
  };

  const handleSubmit = async (character: {
    name: string;
    personality: string;
    keywords: string[];
    dialogues: string[];
    imageUrl: string | null;
  }) => {
    await createCharacter(character);
    router.push('/my-characters');
  };

  return (
    <CharacterCreatePage
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
