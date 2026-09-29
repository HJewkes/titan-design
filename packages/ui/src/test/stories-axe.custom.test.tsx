import baseline from './stories-axe-baseline.json'
import { loadComposedStories } from './composed-stories'
import { AXE_SHARDS, describeAxeShard } from './stories-axe-suite'

describeAxeShard('custom', baseline, await loadComposedStories(AXE_SHARDS['custom']))
