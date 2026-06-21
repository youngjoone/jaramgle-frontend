import { LocalStoryCreatePage } from '@/components/LocalStoryCreatePage';
import { LOCAL_STORY_REGIONS } from '@/lib/localStoryRegions';

export default function DaeguStoryCreateRoutePage() {
  return <LocalStoryCreatePage config={LOCAL_STORY_REGIONS.daegu} />;
}
