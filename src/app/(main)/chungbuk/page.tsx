import { LocalStoryRegionPage } from '@/components/LocalStoryRegionPage';
import { LOCAL_STORY_REGIONS } from '@/lib/localStoryRegions';

export default function ChungbukStoryRoutePage() {
  return <LocalStoryRegionPage config={LOCAL_STORY_REGIONS.chungbuk} />;
}
