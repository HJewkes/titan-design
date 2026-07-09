/**
 * SHEET · Workout Expansion (page 2, EARLY) — what a rail item reveals when expanded.
 * Shows the REAL ExerciseCard expanded (responsive fit + isLive already landed this session) in the rail
 * context, alongside the open questions. NOT yet explored — this frames the next exploration.
 * OPEN: drop the PREV column · embed reps/RPE/weight INTO the velocity bar (vs the current table) · live-set
 * treatment in the expanded view · read-only density (tempo row? per-rep strips per row?). See DECISIONS doc.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExerciseCard, type ExerciseCardProps } from './ExerciseCard'
import { INSET, INSET_SHADOW, RAISED, T_PRIMARY, T_SECONDARY, ORANGE, Page } from './setHeadingKit'

const perRep = (n: number, start: number) => Array.from({ length: n }, (_, r) => +(start + 0.04 - r * 0.015).toFixed(2))

// the active exercise expanded: set 1 done, set 2 LIVE (5/8), set 3 not-started
const EXPANDED: ExerciseCardProps = {
  name: 'Cable Chest Press',
  state: 'expanded',
  onToggle: () => {},
  summary: { sets: 3, reps: 10, weight: 90, unit: 'lbs' },
  tempo: [2, 1, 2, 0],
  sets: [
    { mode: 'completed', setNumber: 1, previous: { reps: 10, weight: 90 }, reps: 10, weight: 90, rpe: 7.5, unit: 'lbs', velocities: perRep(10, 0.7) },
    { mode: 'active', setNumber: 2, previous: { reps: 10, weight: 90 }, reps: null, weight: null, unit: 'lbs', isLive: true, targets: { reps: 10, weight: 90 }, velocities: perRep(5, 0.62) },
    { mode: 'active', setNumber: 3, previous: { reps: 10, weight: 90 }, reps: null, weight: null, unit: 'lbs', isNextSet: false, targets: { reps: 10, weight: 90 } },
  ],
}

const OPEN: [string, string][] = [
  ['Drop PREV', 'The PREV column is reference data, not decision-relevant mid-set — operator wants it gone. Keeps set# · reps · weight · RPE.'],
  ['Embed in the bar', 'Reps/RPE may be redundant with the per-rep velocity bar + the load at top. Explore riding reps/RPE/weight ON the velocity bar instead of a separate table row (a suite of iterations — like the heading was).'],
  ['Live set', 'isLive landed (green “5/8” + grey remainder). In the expanded table it needs to read as clearly in-progress vs the not-started row below.'],
  ['Read-only density', 'Rail is read-only. Candidates to drop for rail density: the TEMPO row, per-rep strips on every completed row. The heading already carries tempo + the set strip.'],
]

const meta: Meta = { title: 'Custom/Workout/Explorations/Workout Expansion', parameters: { layout: 'fullscreen' } }
export default meta
type Story = StoryObj

export const Framing: Story = {
  name: 'Expanded item · current + open questions',
  render: () => (
    <Page
      title="Workout expansion — page 2 (early / framing)"
      note="The real ExerciseCard expanded (responsive fit + isLive landed this session) in the rail. This is the NEXT exploration, not yet done — the panel lists the open questions. The big idea: embed reps/RPE/weight into the velocity bar and drop PREV."
    >
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: T_SECONDARY }}>real ExerciseCard · expanded @ rail width</span>
          <div style={{ width: 246, background: INSET, boxShadow: INSET_SHADOW, padding: '0 0 8px' }}>
            <ExerciseCard {...EXPANDED} />
          </div>
        </div>
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: ORANGE }}>Open questions</span>
          {OPEN.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3, background: RAISED, borderRadius: 8, padding: '10px 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: T_PRIMARY }}>{k}</span>
              <span style={{ fontSize: 12, lineHeight: 1.45, color: T_SECONDARY }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  ),
}
