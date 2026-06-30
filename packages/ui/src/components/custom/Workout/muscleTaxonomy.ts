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
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'

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

/** Weekly-volume status relative to MEV/MAV/MRV landmarks. */
export type VolumeStatus = 'under' | 'maintenance' | 'productive' | 'over'

/** Readable label per status for a11y descriptions. */
export const VOLUME_STATUS_LABELS: Record<VolumeStatus, string> = {
  under: 'under-trained',
  maintenance: 'maintenance',
  productive: 'productive',
  over: 'over-reaching',
}

/** Severity ranking — higher wins when several groups share an SVG slug. */
const STATUS_SEVERITY: Record<VolumeStatus, number> = {
  under: 1,
  maintenance: 2,
  productive: 3,
  over: 4,
}

/**
 * Maps a volume status (and intensity, 0-1) to a heatmap fill color. The
 * `approaching` token is used when a productive muscle nears its MRV.
 */
export function getHeatmapColor(status: VolumeStatus | null | undefined, intensity = 0): string {
  const heatmap = WORKOUT_TOKENS.heatmap
  switch (status) {
    case 'under':
      return heatmap.under
    case 'maintenance':
      return heatmap.maintenance
    case 'productive':
      return intensity >= 0.85 ? heatmap.approaching : heatmap.productive
    case 'over':
      return heatmap.over
    default:
      return heatmap.none
  }
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
