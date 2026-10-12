/**
 * Class sets for the text a chart paints, one per role. Numerals read in mono, categories in the
 * microLabel caps, and titles in the heading face in sentence case. `dataLabel` carries no colour
 * because the chart picks the ink against the fill it sits on.
 */
export const chartText = {
  tick: 'font-mono text-2xs font-normal text-text-tertiary',
  category:
    'font-sans text-2xs font-semibold uppercase tracking-widest leading-normal text-text-secondary',
  axisTitle: 'font-heading text-xs font-semibold text-text-secondary',
  legend: 'font-heading text-xs font-medium text-text-secondary',
  dataLabel: 'font-heading text-2xs font-semibold',
} as const
