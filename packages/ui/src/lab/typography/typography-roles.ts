import { contrast } from '../../theme/color-checks'
import { greyRamp, primitiveRamps, semanticPins } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

/**
 * TD-781: the text roles the library uses, each with its rule or the open decision that governs
 * it. Data only; `TypographyRules.stories.tsx` renders it and `docs/typography-rules.md` mirrors it.
 */

export type RoleFamily = 'heading' | 'body' | 'sans' | 'mono'
export type RoleWeight = 'regular' | 'medium' | 'semibold' | 'bold'
export type RoleCase = 'sentence' | 'upper' | 'digits'
export type RoleColor = 'text-primary' | 'text-secondary' | 'text-tertiary' | 'tone' | 'result'
export type DecisionId = 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7'

export interface RoleRule {
  variant: string
  family: RoleFamily
  weight: RoleWeight
  textCase: RoleCase
  color: RoleColor
  sizePx: number
}

export interface TextRole {
  id: string
  group: string
  role: string
  /** Where the role appears today (component, file). */
  usedBy: string
  /** The rule as established, or as built today when the role is open. */
  rule: RoleRule
  /** The recommended default for an open role; absent on an established role. */
  proposed?: RoleRule
  decision?: DecisionId
  /** Why the rule is settled, or what settles it. */
  note: string
  sample: string
}

const rule = (
  variant: string,
  family: RoleFamily,
  weight: RoleWeight,
  textCase: RoleCase,
  color: RoleColor,
  sizePx: number
): RoleRule => ({ variant, family, weight, textCase, color, sizePx })

export const TEXT_ROLES: readonly TextRole[] = [
  {
    id: 'display',
    group: 'Headings',
    role: 'Display heading',
    usedBy: 'h1-h4; hero and page banners',
    rule: rule('h1-h4', 'heading', 'bold', 'sentence', 'text-primary', 24),
    note: 'Heading face, bold, sentence case. Established.',
    sample: 'Training status',
  },
  {
    id: 'page-heading',
    group: 'Headings',
    role: 'Page heading',
    usedBy: 'Page title (ui/page, h5 at aria-level 1)',
    rule: rule('h5', 'heading', 'semibold', 'sentence', 'text-primary', 20),
    note: 'Heading face, semibold, sentence case. Established.',
    sample: 'Weekly volume',
  },
  {
    id: 'section-title',
    group: 'Headings',
    role: 'Section title',
    usedBy: 'SectionHeader (ui/section)',
    rule: rule('raw Text', 'body', 'semibold', 'upper', 'text-secondary', 14),
    proposed: rule('h6 at 14px', 'heading', 'semibold', 'sentence', 'text-primary', 14),
    decision: 'D6',
    note: 'OPEN D6: the only 14px caps label; heading face or a 12px overline eyebrow.',
    sample: 'Weekly volume',
  },
  {
    id: 'card-title',
    group: 'Titles',
    role: 'Card title',
    usedBy: 'CardTitle (ui/card), GoalCard full size',
    rule: rule('h6', 'heading', 'semibold', 'sentence', 'text-primary', 18),
    note: 'Heading face, semibold, sentence case. Established.',
    sample: 'Bench press',
  },
  {
    id: 'subtitle',
    group: 'Titles',
    role: 'Row title / subtitle',
    usedBy: 'subtitle2 row titles, ListItem title',
    rule: rule('subtitle2', 'body', 'medium', 'sentence', 'text-primary', 14),
    note: 'Body face, medium, sentence case. Established: a row title is a sentence, not a label.',
    sample: 'Back squat',
  },
  {
    id: 'eyebrow',
    group: 'Labels',
    role: 'Eyebrow / stat header / menu group header',
    usedBy: 'Eyebrow, StatCard header, MenuGroup, GoalCard compact title',
    rule: rule('overline', 'body', 'semibold', 'upper', 'text-tertiary', 12),
    proposed: rule('overline', 'body', 'semibold', 'upper', 'text-secondary', 12),
    decision: 'D2',
    note: 'All caps on overline (never monoLabel). OPEN D2: the colour token.',
    sample: 'Weekly volume',
  },
  {
    id: 'column-header',
    group: 'Labels',
    role: 'Column header',
    usedBy: 'TableHeaderCell, SetTableHeader (microLabel)',
    rule: rule('overline / microLabel', 'body', 'semibold', 'upper', 'text-secondary', 12),
    note: 'All caps, semibold, text-secondary; the sorted column reads text-primary. Established.',
    sample: 'Set · Prev',
  },
  {
    id: 'lockup-name',
    group: 'Labels',
    role: 'Label-value lockup name',
    usedBy: 'CardStat, Tile, VolumeLandmarkBar (#764 pick C)',
    rule: rule('overline', 'body', 'semibold', 'upper', 'text-secondary', 12),
    note: 'Settled by #764 pick C: overline name, bold value. D1 closed.',
    sample: 'Calves',
  },
  {
    id: 'lockup-value',
    group: 'Values',
    role: 'Label-value lockup value',
    usedBy: 'CardStat, Tile, Metric, VolumeLandmarkBar %',
    rule: rule('mono', 'mono', 'bold', 'digits', 'text-primary', 14),
    note: 'Bold mono. text-primary for a KPI; text-secondary beside its own track (#764 pick C).',
    sample: '14',
  },
  {
    id: 'unit',
    group: 'Values',
    role: 'Unit / suffix beside a value',
    usedBy: 'Metric unit, Gauge unit',
    rule: rule('mono', 'mono', 'regular', 'sentence', 'text-tertiary', 12),
    decision: 'D3',
    note: 'Lowercase as written, one step smaller. OPEN D3: tertiary stays only if D3 keeps it redundant.',
    sample: 'lb',
  },
  {
    id: 'delta',
    group: 'Values',
    role: 'Delta / trend',
    usedBy: 'Metric trend, MetricTrend',
    rule: rule('mono', 'mono', 'medium', 'digits', 'result', 12),
    note: 'Sign plus digits on result-improve / result-degrade; never colour alone. Established.',
    sample: '+4.2%',
  },
  {
    id: 'status-token',
    group: 'Labels',
    role: 'Status token',
    usedBy: 'SessionStatePill (LIVE, REST), PR mark',
    rule: rule('overline + bold', 'body', 'bold', 'upper', 'tone', 12),
    note: 'All caps on overline, bold, tone colour; not monoLabel (owner, batch 11). Established.',
    sample: 'Live',
  },
  {
    id: 'nav-label',
    group: 'Labels',
    role: 'Nav label under a glyph',
    usedBy: 'shell/NavItem',
    rule: rule('microLabel', 'sans', 'bold', 'upper', 'text-primary', 10),
    note: 'text-primary in both modes; the active state is bar, glyph and weight (batch 9). Established.',
    sample: 'Train',
  },
  {
    id: 'body',
    group: 'Body',
    role: 'Body text',
    usedBy: 'body1, MarkdownProse',
    rule: rule('body1', 'body', 'regular', 'sentence', 'text-primary', 16),
    note: 'Body face, regular, sentence case, never bold. Established.',
    sample: 'Three working sets at RPE 8, then a back-off set.',
  },
  {
    id: 'description',
    group: 'Body',
    role: 'Description / card body / help text',
    usedBy: 'CardDescription, body2',
    rule: rule('body2', 'body', 'regular', 'sentence', 'text-secondary', 14),
    note: 'Body face, regular, text-secondary. Established.',
    sample: 'Sets per muscle group this week',
  },
  {
    id: 'caption',
    group: 'Body',
    role: 'Caption / metadata / timestamp',
    usedBy: 'caption (101 sites, 34 tertiary), FormField help text',
    rule: rule('caption', 'body', 'regular', 'sentence', 'text-tertiary', 12),
    proposed: rule('caption', 'body', 'regular', 'sentence', 'text-secondary', 12),
    decision: 'D3',
    note: 'Never bold. OPEN D3: secondary by default, tertiary only when redundant.',
    sample: 'Updated 3 min ago · 4 sets logged',
  },
  {
    id: 'control-button',
    group: 'Controls',
    role: 'Button label',
    usedBy: 'ButtonText',
    rule: rule('button', 'sans', 'semibold', 'sentence', 'tone', 14),
    proposed: rule('button', 'heading', 'semibold', 'sentence', 'tone', 14),
    decision: 'D5',
    note: 'Semibold: the one control that acts. OPEN D5: the face.',
    sample: 'Save',
  },
  {
    id: 'control-pill',
    group: 'Controls',
    role: 'Pill / Badge / Chip / Tab label',
    usedBy: 'Pill (heading semibold), Badge and Chip (sans medium), Tab (sans medium)',
    rule: rule('component', 'sans', 'medium', 'sentence', 'tone', 12),
    proposed: rule('component', 'heading', 'medium', 'sentence', 'tone', 12),
    decision: 'D5',
    note: 'Pill keeps font-heading. OPEN D5: whether the other small controls join it.',
    sample: 'On track',
  },
  {
    id: 'form-label',
    group: 'Forms',
    role: 'Form label',
    usedBy: 'FormField label, Label (subtitle2)',
    rule: rule('subtitle2', 'body', 'medium', 'sentence', 'text-primary', 14),
    proposed: rule('subtitle2 + font-heading', 'heading', 'medium', 'sentence', 'text-primary', 14),
    decision: 'D7',
    note: 'Medium, sentence case, text-primary. OPEN D7: body face or heading face.',
    sample: 'Target weight',
  },
  {
    id: 'inline-label',
    group: 'Forms',
    role: 'Inline label (DataRow, Metric, Gauge)',
    usedBy: 'DataRow label, Metric label, Gauge label',
    rule: rule('body2 / caption', 'body', 'regular', 'sentence', 'text-secondary', 12),
    proposed: rule('caption + font-heading', 'heading', 'medium', 'sentence', 'text-secondary', 12),
    decision: 'D7',
    note: 'Sentence case, text-secondary. OPEN D7: body face or heading face.',
    sample: 'Health',
  },
  {
    id: 'table-cell',
    group: 'Tables',
    role: 'Table cell',
    usedBy: 'TableCell',
    rule: rule('body2', 'body', 'regular', 'sentence', 'text-primary', 14),
    note: 'Body face, text-primary; numerals in mono where columns align. Established.',
    sample: 'Romanian deadlift',
  },
  {
    id: 'tick-numeral',
    group: 'Charts',
    role: 'Axis tick numeral',
    usedBy: 'ScatterGridlines (9px), ZoneTrack ticks (inline monospace)',
    rule: rule('raw Text', 'mono', 'regular', 'digits', 'text-tertiary', 9),
    proposed: rule('mono', 'mono', 'regular', 'digits', 'text-tertiary', 10),
    decision: 'D4',
    note: 'Tabular digits; tertiary under the 3:1 chart-ink floor. OPEN D4: one chart text spec.',
    sample: '0.25',
  },
  {
    id: 'axis-category',
    group: 'Charts',
    role: 'Axis category / track label',
    usedBy: 'ZoneTrack MEV / MAV / MRV, SetBarChart side labels',
    rule: rule('inline style', 'mono', 'bold', 'upper', 'text-secondary', 10),
    proposed: rule('microLabel', 'sans', 'semibold', 'upper', 'text-secondary', 10),
    decision: 'D4',
    note: 'All caps; the emphasised tick bold. OPEN D4.',
    sample: 'MAV',
  },
  {
    id: 'axis-title',
    group: 'Charts',
    role: 'Axis title',
    usedBy: 'ScatterFrame x/y labels (10px semibold)',
    rule: rule('raw Text', 'sans', 'semibold', 'sentence', 'text-secondary', 10),
    proposed: rule(
      'caption + font-heading',
      'heading',
      'semibold',
      'sentence',
      'text-secondary',
      11
    ),
    decision: 'D4',
    note: 'Sentence case with the unit. OPEN D4: heading face or all caps.',
    sample: 'Instability (I)',
  },
  {
    id: 'legend',
    group: 'Charts',
    role: 'Legend / data label',
    usedBy: 'Gauge label, Treemap cell label, BarList row label',
    rule: rule('raw Text', 'sans', 'regular', 'sentence', 'text-secondary', 12),
    proposed: rule('caption + font-heading', 'heading', 'medium', 'sentence', 'text-secondary', 12),
    decision: 'D4',
    note: 'Sentence case, text-secondary. OPEN D4.',
    sample: 'Main sequence',
  },
  {
    id: 'code',
    group: 'Code',
    role: 'Code / readout / id',
    usedBy: 'mono (clocks, ids, tempo), Kbd, FilePathLabel',
    rule: rule('mono', 'mono', 'regular', 'sentence', 'text-primary', 12),
    note: 'Mono, regular, text-primary. Established.',
    sample: '3-1-2-0',
  },
]

export const OPEN_DECISIONS: readonly DecisionId[] = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7']

export function rolesFor(decision: DecisionId): TextRole[] {
  return TEXT_ROLES.filter((role) => role.decision === decision)
}

/** The ramp step a hex is on (`grey 400`), or the pin's name; never the hex itself. */
export function rampStepOf(hex: string): string {
  const wanted = hex.toUpperCase()
  for (const [step, value] of Object.entries(greyRamp)) {
    if (value.toUpperCase() === wanted) return `grey ${step}`
  }
  for (const [hue, ramp] of Object.entries(primitiveRamps)) {
    for (const [step, value] of Object.entries(ramp)) {
      if (String(value).toUpperCase() === wanted) return `${hue} ${step}`
    }
  }
  for (const [name, value] of Object.entries(semanticPins)) {
    if (value.toUpperCase() === wanted) return `pin ${name}`
  }
  return 'off ramp'
}

export type MeasurableColor = Exclude<RoleColor, 'tone' | 'result'>

export interface ColorMeasure {
  mode: ThemeMode
  step: string
  ratio: number
}

/** The text token's ramp step and its WCAG ratio on `surface-base` in one mode. */
export function measureColor(color: MeasurableColor, mode: ThemeMode): ColorMeasure {
  const colors = getSemanticColors(mode)
  const hex = colors[color]
  return { mode, step: rampStepOf(hex), ratio: contrast(hex, colors['surface-base']) }
}

export function isMeasurable(color: RoleColor): color is MeasurableColor {
  return color !== 'tone' && color !== 'result'
}

const THEMES: readonly ThemeMode[] = ['dark', 'light']

/** `grey 400 5.95 (dark) · grey 700 6.99 (light)`, or the reason a colour is not measured. */
export function colorLine(color: RoleColor): string {
  if (!isMeasurable(color)) return color === 'tone' ? 'on tone (per component)' : 'result-* tokens'
  return THEMES.map((mode) => {
    const m = measureColor(color, mode)
    return `${m.step} ${m.ratio.toFixed(2)} (${mode})`
  }).join(' · ')
}

export function ruleLine(r: RoleRule): string {
  return [r.variant, r.family, r.weight, r.textCase, `${r.sizePx}px`, r.color].join(' · ')
}

const FAMILY_CLASS: Record<RoleFamily, string> = {
  heading: 'font-heading',
  body: 'font-body',
  sans: 'font-sans',
  mono: 'font-mono',
}

const WEIGHT_CLASS: Record<RoleWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const CASE_CLASS: Record<RoleCase, string> = {
  sentence: 'normal-case tracking-normal',
  upper: 'uppercase tracking-widest',
  digits: 'normal-case tracking-normal',
}

const COLOR_CLASS: Record<RoleColor, string> = {
  'text-primary': 'text-text-primary',
  'text-secondary': 'text-text-secondary',
  'text-tertiary': 'text-text-tertiary',
  tone: 'text-brand-primary',
  result: 'text-result-improve',
}

/** Tailwind classes that paint a rule on a `Text`; the size is an inline style in the story. */
export function ruleClasses(r: RoleRule): string {
  return [
    FAMILY_CLASS[r.family],
    WEIGHT_CLASS[r.weight],
    CASE_CLASS[r.textCase],
    COLOR_CLASS[r.color],
  ].join(' ')
}
