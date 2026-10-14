import '../../../src/theme/global.css'
import { createRoot } from 'react-dom/client'
import { View } from 'react-native'
import { MotionProvider, seekClock } from '../../../src/motion'
import { PROOF_DURATION_S } from './proof-components'
import { ProofBeat } from './ProofBeat'

// On a seek clock, MotionProvider publishes `window.__titanMotion` (TD-842a); capture drives that.
const clock = seekClock()

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <MotionProvider clock={clock} durationS={PROOF_DURATION_S}>
      <View style={{ width: 1920, height: 1080 }} className="overflow-hidden">
        <ProofBeat />
      </View>
    </MotionProvider>
  )
}
