/**
 * Muscle grouping taxonomy for volume tracking, exercise mapping, and the
 * BodyMap visualization. Ported from the Voltras muscle-taxonomy design doc.
 *
 * Level 2 (15 groups) is the primary volume-tracking unit; SimpleMuscleGroup
 * (8 groups) is the beginner-facing aggregation. MUSCLE_TO_SVG_SLUGS maps each
 * group to react-native-body-highlighter slugs using the closest-slug approach
 * (Phase 1: combined colors, no sub-region splitting — deltoids is a single
 * slug, lats and upper back share `upper-back`).
 */
export {
  VOLUME_STATUS_DATAVIZ_TOKEN,
  getHeatmapColor,
  isVolumeStatusDotRing,
  volumeStatusDotColor,
  volumeStatusDotStyle,
} from './volumeStatusPaint'
export { VOLUME_STATUSES, type VolumeStatus } from './volumeStatus'
import type { VolumeStatus } from './volumeStatus'

/**
 * Full muscle group taxonomy for volume tracking and exercise mapping.
 * 15 groups — the primary unit for volume accounting.
 */
export enum MuscleGroup {
  // Push
  CHEST = 'chest',
  FRONT_DELTS = 'front_delts',
  SIDE_DELTS = 'side_delts',
  TRICEPS = 'triceps',

  // Pull
  LATS = 'lats',
  UPPER_BACK = 'upper_back',
  REAR_DELTS = 'rear_delts',
  BICEPS = 'biceps',
  FOREARMS = 'forearms',

  // Legs
  QUADS = 'quads',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',

  // Core
  ABS = 'abs',
  OBLIQUES = 'obliques',
}

/**
 * Simplified muscle group view for beginners. Maps to one or more MuscleGroup.
 */
export enum SimpleMuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  LEGS = 'legs',
  CORE = 'core',
  FOREARMS = 'forearms',
}

/** Mapping from simplified groups to the full taxonomy. */
export const SIMPLE_TO_DETAILED: Record<SimpleMuscleGroup, MuscleGroup[]> = {
  [SimpleMuscleGroup.CHEST]: [MuscleGroup.CHEST],
  [SimpleMuscleGroup.BACK]: [MuscleGroup.LATS, MuscleGroup.UPPER_BACK],
  [SimpleMuscleGroup.SHOULDERS]: [
    MuscleGroup.FRONT_DELTS,
    MuscleGroup.SIDE_DELTS,
    MuscleGroup.REAR_DELTS,
  ],
  [SimpleMuscleGroup.BICEPS]: [MuscleGroup.BICEPS],
  [SimpleMuscleGroup.TRICEPS]: [MuscleGroup.TRICEPS],
  [SimpleMuscleGroup.LEGS]: [
    MuscleGroup.QUADS,
    MuscleGroup.HAMSTRINGS,
    MuscleGroup.GLUTES,
    MuscleGroup.CALVES,
  ],
  [SimpleMuscleGroup.CORE]: [MuscleGroup.ABS, MuscleGroup.OBLIQUES],
  [SimpleMuscleGroup.FOREARMS]: [MuscleGroup.FOREARMS],
}

/** Reverse map: detailed MuscleGroup -> its SimpleMuscleGroup. */
export const DETAILED_TO_SIMPLE: Record<MuscleGroup, SimpleMuscleGroup> = Object.entries(
  SIMPLE_TO_DETAILED
).reduce(
  (acc, [simple, groups]) => {
    for (const group of groups) {
      acc[group] = simple as SimpleMuscleGroup
    }
    return acc
  },
  {} as Record<MuscleGroup, SimpleMuscleGroup>
)

/** Movement category for training split organization. */
export type MovementCategory = 'push' | 'pull' | 'legs' | 'core'

export const MUSCLE_TO_CATEGORY: Record<MuscleGroup, MovementCategory> = {
  [MuscleGroup.CHEST]: 'push',
  [MuscleGroup.FRONT_DELTS]: 'push',
  [MuscleGroup.SIDE_DELTS]: 'push',
  [MuscleGroup.TRICEPS]: 'push',
  [MuscleGroup.LATS]: 'pull',
  [MuscleGroup.UPPER_BACK]: 'pull',
  [MuscleGroup.REAR_DELTS]: 'pull',
  [MuscleGroup.BICEPS]: 'pull',
  [MuscleGroup.FOREARMS]: 'pull',
  [MuscleGroup.QUADS]: 'legs',
  [MuscleGroup.HAMSTRINGS]: 'legs',
  [MuscleGroup.GLUTES]: 'legs',
  [MuscleGroup.CALVES]: 'legs',
  [MuscleGroup.ABS]: 'core',
  [MuscleGroup.OBLIQUES]: 'core',
}

/**
 * react-native-body-highlighter slug(s) per muscle group. Phase 1 uses the
 * closest available slug; deltoids share one path and lats/upper-back share
 * `upper-back` (see doc Level 4 "Recommended approach").
 */
export const MUSCLE_TO_SVG_SLUGS: Record<MuscleGroup, string[]> = {
  [MuscleGroup.CHEST]: ['chest'],
  [MuscleGroup.FRONT_DELTS]: ['deltoids'],
  [MuscleGroup.SIDE_DELTS]: ['deltoids'],
  [MuscleGroup.REAR_DELTS]: ['deltoids'],
  [MuscleGroup.TRICEPS]: ['triceps'],
  [MuscleGroup.LATS]: ['upper-back'],
  [MuscleGroup.UPPER_BACK]: ['upper-back', 'trapezius'],
  [MuscleGroup.BICEPS]: ['biceps'],
  [MuscleGroup.FOREARMS]: ['forearm'],
  [MuscleGroup.QUADS]: ['quadriceps'],
  [MuscleGroup.HAMSTRINGS]: ['hamstring'],
  [MuscleGroup.GLUTES]: ['gluteal'],
  [MuscleGroup.CALVES]: ['calves'],
  [MuscleGroup.ABS]: ['abs'],
  [MuscleGroup.OBLIQUES]: ['obliques'],
}

/** Human-readable name per muscle group (used in a11y labels). */
export const MUSCLE_DISPLAY_NAMES: Record<MuscleGroup, string> = {
  [MuscleGroup.CHEST]: 'Chest',
  [MuscleGroup.FRONT_DELTS]: 'Front Delts',
  [MuscleGroup.SIDE_DELTS]: 'Side Delts',
  [MuscleGroup.REAR_DELTS]: 'Rear Delts',
  [MuscleGroup.TRICEPS]: 'Triceps',
  [MuscleGroup.LATS]: 'Lats',
  [MuscleGroup.UPPER_BACK]: 'Upper Back',
  [MuscleGroup.BICEPS]: 'Biceps',
  [MuscleGroup.FOREARMS]: 'Forearms',
  [MuscleGroup.QUADS]: 'Quads',
  [MuscleGroup.HAMSTRINGS]: 'Hamstrings',
  [MuscleGroup.GLUTES]: 'Glutes',
  [MuscleGroup.CALVES]: 'Calves',
  [MuscleGroup.ABS]: 'Abs',
  [MuscleGroup.OBLIQUES]: 'Obliques',
}

/** Human-readable name per simple group. */
export const SIMPLE_DISPLAY_NAMES: Record<SimpleMuscleGroup, string> = {
  [SimpleMuscleGroup.CHEST]: 'Chest',
  [SimpleMuscleGroup.BACK]: 'Back',
  [SimpleMuscleGroup.SHOULDERS]: 'Shoulders',
  [SimpleMuscleGroup.BICEPS]: 'Biceps',
  [SimpleMuscleGroup.TRICEPS]: 'Triceps',
  [SimpleMuscleGroup.LEGS]: 'Legs',
  [SimpleMuscleGroup.CORE]: 'Core',
  [SimpleMuscleGroup.FOREARMS]: 'Forearms',
}

/** Volume landmarks per muscle group (weekly working sets). */
export interface VolumeLandmarks {
  mev: number // Minimum Effective Volume
  mav: number // Maximum Adaptive Volume
  mrv: number // Maximum Recoverable Volume
}

export const DEFAULT_VOLUME_LANDMARKS: Record<MuscleGroup, VolumeLandmarks> = {
  [MuscleGroup.CHEST]: { mev: 8, mav: 14, mrv: 20 },
  [MuscleGroup.LATS]: { mev: 8, mav: 14, mrv: 20 },
  [MuscleGroup.UPPER_BACK]: { mev: 6, mav: 12, mrv: 18 },
  [MuscleGroup.FRONT_DELTS]: { mev: 2, mav: 6, mrv: 10 },
  [MuscleGroup.SIDE_DELTS]: { mev: 6, mav: 14, mrv: 22 },
  [MuscleGroup.REAR_DELTS]: { mev: 6, mav: 12, mrv: 18 },
  [MuscleGroup.BICEPS]: { mev: 4, mav: 10, mrv: 18 },
  [MuscleGroup.TRICEPS]: { mev: 4, mav: 8, mrv: 14 },
  [MuscleGroup.FOREARMS]: { mev: 2, mav: 6, mrv: 12 },
  [MuscleGroup.QUADS]: { mev: 6, mav: 12, mrv: 18 },
  [MuscleGroup.HAMSTRINGS]: { mev: 4, mav: 10, mrv: 16 },
  [MuscleGroup.GLUTES]: { mev: 4, mav: 10, mrv: 16 },
  [MuscleGroup.CALVES]: { mev: 6, mav: 10, mrv: 16 },
  [MuscleGroup.ABS]: { mev: 0, mav: 8, mrv: 16 },
  [MuscleGroup.OBLIQUES]: { mev: 0, mav: 6, mrv: 12 },
}

/**
 * Where a muscle's weekly sets sit in its MEV/MAV/MRV band — the physiological
 * classification, not a UI status. Was itself called `VolumeStatus` until VW-333;
 * that name now belongs to the one UI status below.
 */
export type VolumeLandmarkZone = 'under' | 'maintenance' | 'productive' | 'over'

/**
 * Intensity at or above which a muscle inside the productive band reads as
 * approaching its MRV. This is the split that makes `approaching` a status of
 * its own rather than a hue the figure picked and the chip could not name.
 */
export const APPROACHING_MRV_INTENSITY = 0.85

/**
 * The canonical landmark-zone → status wiring (VW-333). Replaces the map that
 * `WorkoutCard` used to hand-write, and is the only place the `approaching`
 * split is decided.
 */
export function landmarkZoneToStatus(zone: VolumeLandmarkZone, intensity = 0): VolumeStatus {
  switch (zone) {
    case 'under':
      return 'behind'
    case 'maintenance':
      return 'ontrack'
    case 'productive':
      return intensity >= APPROACHING_MRV_INTENSITY ? 'approaching' : 'target'
    case 'over':
      return 'over'
  }
}

/** Readable label per status for a11y descriptions. */
export const VOLUME_STATUS_LABELS: Record<VolumeStatus, string> = {
  untrained: 'untrained',
  noverdict: 'no verdict',
  behind: 'behind plan',
  ontrack: 'on track',
  target: 'target met',
  approaching: 'approaching MRV',
  over: 'over MRV',
}

/**
 * Severity ranking — higher wins when several muscle groups share an SVG slug.
 *
 * `approaching` outranks `target` (VW-333). Before the split they were one
 * status and the tie resolved by data order, so two productive muscles on the
 * same slug painted whichever colour came last. The ranking makes it definite.
 * `noverdict` is the lowest painted rung: any verdict on a shared slug outranks it.
 */
const STATUS_SEVERITY: Record<VolumeStatus, number> = {
  untrained: 0,
  noverdict: 1,
  behind: 2,
  ontrack: 3,
  target: 4,
  approaching: 5,
  over: 6,
}

/** True when one status is at least as severe as another. */
export function isMoreSevere(a: VolumeStatus, b: VolumeStatus): boolean {
  return STATUS_SEVERITY[a] >= STATUS_SEVERITY[b]
}

/**
 * Representative MuscleGroup for each SVG slug, used to resolve taps on shared
 * paths (e.g. `deltoids`, `upper-back`) back to a single group.
 */
export const SLUG_TO_PRIMARY_MUSCLE: Record<string, MuscleGroup> = {
  chest: MuscleGroup.CHEST,
  deltoids: MuscleGroup.SIDE_DELTS,
  triceps: MuscleGroup.TRICEPS,
  'upper-back': MuscleGroup.LATS,
  trapezius: MuscleGroup.UPPER_BACK,
  biceps: MuscleGroup.BICEPS,
  forearm: MuscleGroup.FOREARMS,
  quadriceps: MuscleGroup.QUADS,
  hamstring: MuscleGroup.HAMSTRINGS,
  gluteal: MuscleGroup.GLUTES,
  calves: MuscleGroup.CALVES,
  abs: MuscleGroup.ABS,
  obliques: MuscleGroup.OBLIQUES,
}
