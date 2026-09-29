import baseline from './stories-axe-baseline.json'
import { loadComposedStories } from './composed-stories'
import { AXE_SHARDS, describeAxeShard } from './stories-axe-suite'

describeAxeShard('workout-a-g', baseline, await loadComposedStories(AXE_SHARDS['workout-a-g']))
