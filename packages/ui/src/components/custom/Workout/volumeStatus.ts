/**
 * The volume status union, kept in a leaf module so `muscleTaxonomy` and
 * `volumeStatusPaint` can both import it without importing each other.
 * `muscleTaxonomy` re-exports every name here.
 */

/**
 * The ONE volume status, shared by the BodyMap fill, the MuscleGroupChip dot and
 * every legend over them (VW-333). Before it existed, the figure keyed off the
 * landmark zone and the chip off a five-value union of its own, so one muscle
 * could render two different hues.
 *
 * `noverdict` (VW-741) marks a trained muscle whose landmarks are withheld, so its
 * week has sets but no verdict. It paints result-neutral, never a diverging stop.
 */
export type VolumeStatus = (typeof VOLUME_STATUSES)[number]

/** Every status in severity order; the union derives from it, so tests can iterate it whole. */
export const VOLUME_STATUSES = [
  'untrained',
  'noverdict',
  'behind',
  'ontrack',
  'target',
  'approaching',
  'over',
] as const
