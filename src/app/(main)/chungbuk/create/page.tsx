import { LocalStoryCreatePage } from '@/components/LocalStoryCreatePage';
import { LOCAL_STORY_REGIONS } from '@/lib/localStoryRegions';

export default function ChungbukStoryCreateRoutePage() {
  return <LocalStoryCreatePage config={LOCAL_STORY_REGIONS.chungbuk} />;
}
