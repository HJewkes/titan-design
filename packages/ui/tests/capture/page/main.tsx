import '../../../src/theme/global.css'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { View } from 'react-native'
import { MotionProvider, seekClock } from '../../../src/motion'
import { PROOF_DURATION_S } from './proof-components'
import { ProofBeat } from './ProofBeat'

const clock = seekClock()

/**
 * A local stand-in for the `window.__titanMotion` bridge that TD-842a adds to MotionProvider, with the
 * same shape: `seek` commits synchronously and clamps to [0, duration], and `ready` settles fonts and
 * images. This page has no `useWaitUntil` callers, so the shim does not track waits.
 */
function installMotionShim(durationS: number) {
  Object.defineProperty(window, '__titanMotion', {
    value: {
      duration: durationS,
      seek(t: number) {
        flushSync(() => clock.seek(Math.min(durationS, Math.max(0, t))))
      },
      async ready() {
        await document.fonts.ready
        await Promise.all(Array.from(document.images, (img) => img.decode().catch(() => {})))
      },
    },
  })
}

const root = document.getElementById('root')
if (root) {
  flushSync(() =>
    createRoot(root).render(
      <MotionProvider clock={clock} durationS={PROOF_DURATION_S}>
        <View style={{ width: 1920, height: 1080 }} className="overflow-hidden">
          <ProofBeat />
        </View>
      </MotionProvider>
    )
  )
  installMotionShim(PROOF_DURATION_S)
}
