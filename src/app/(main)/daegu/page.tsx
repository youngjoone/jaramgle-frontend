import { LocalStoryRegionPage } from '@/components/LocalStoryRegionPage';
import { LOCAL_STORY_REGIONS } from '@/lib/localStoryRegions';

export default function DaeguStoryRoutePage() {
  return <LocalStoryRegionPage config={LOCAL_STORY_REGIONS.daegu} />;
}
