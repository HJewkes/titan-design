import baseline from './stories-axe-baseline.json'
import { loadComposedStories } from './composed-stories'
import { AXE_SHARDS, describeAxeShard } from './stories-axe-suite'

describeAxeShard('workout-h-z', baseline, await loadComposedStories(AXE_SHARDS['workout-h-z']))
