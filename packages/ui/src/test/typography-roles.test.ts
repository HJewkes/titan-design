import { createElement, type ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import baseline from './typography-roles-baseline.json'
import { capturedByNode } from './classname-capture'
import { Typography, type TypographyVariant } from '../components/ui/typography'
import { Eyebrow } from '../components/ui/eyebrow'
import { SectionHeader } from '../components/ui/section'
import { TableHeaderCell } from '../components/ui/table'
import { MenuGroup } from '../components/ui/menu'
import { StatCardHeader } from '../components/ui/stat-card'
import { CardStat } from '../components/ui/card'
import { Metric } from '../components/ui/metric'
import { DataRow } from '../components/ui/data-row'

/**
 * The text roles as data (TD-782). An eyebrow (card, stat, section, menu group or column
 * header, a lockup's name) renders the `overline` or `microLabel` variant on
 * `text-text-secondary`; a value (the figure of a KPI, tile or row) renders `font-bold` on
 * `text-text-primary`. NativeWind never runs under vitest, so the classes are read off the
 * className capture, not the DOM.
 *
 * Today's misses are in `typography-roles-baseline.json`, keyed by site, each with the
 * `variant × colour` (eyebrow) or `weight × colour` (value) it renders. The baseline only
 * shrinks: a site that now meets its role fails until its entry is deleted, and a baselined
 * site that drifts to another miss fails too.
 */

type Role = 'eyebrow' | 'value'

const LABEL = 'Volume'
const VALUE = '76%'

const VARIANTS = Object.keys({
  h1: 1,
  h2: 1,
  h3: 1,
  h4: 1,
  h5: 1,
  h6: 1,
  body1: 1,
  body2: 1,
  subtitle1: 1,
  subtitle2: 1,
  caption: 1,
  overline: 1,
  button: 1,
  mono: 1,
  monoLabel: 1,
  microLabel: 1,
  boldLabel: 1,
} satisfies Record<TypographyVariant, 1>) as TypographyVariant[]

const EYEBROW_VARIANTS = new Set<string>(['overline', 'microLabel'])
const COLOUR = /^text-(?:text|status|result|brand)-[a-z-]+$/
const WEIGHT = /^font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/

const SITES: Array<{ site: string; role: Role; text: string; element: () => ReactElement }> = [
  {
    site: 'Eyebrow',
    role: 'eyebrow',
    text: LABEL,
    element: () => createElement(Eyebrow, null, LABEL),
  },
  {
    site: 'SectionHeader title',
    role: 'eyebrow',
    text: LABEL,
    element: () => createElement(SectionHeader, { title: LABEL }),
  },
  {
    site: 'TableHeaderCell label',
    role: 'eyebrow',
    text: LABEL,
    element: () => createElement(TableHeaderCell, null, LABEL),
  },
  {
    site: 'MenuGroup label',
    role: 'eyebrow',
    text: LABEL,
    element: () => createElement(MenuGroup, { label: LABEL }),
  },
  {
    site: 'StatCardHeader title',
    role: 'eyebrow',
    text: LABEL,
    element: () => createElement(StatCardHeader, { title: LABEL }),
  },
  {
    site: 'CardStat label',
    role: 'eyebrow',
    text: LABEL,
    element: () => createElement(CardStat, { label: LABEL, value: VALUE }),
  },
  {
    site: 'Metric value',
    role: 'value',
    text: VALUE,
    element: () => createElement(Metric, { label: LABEL, value: VALUE }),
  },
  {
    site: 'CardStat value',
    role: 'value',
    text: VALUE,
    element: () => createElement(CardStat, { label: LABEL, value: VALUE }),
  },
  {
    site: 'DataRow value',
    role: 'value',
    text: VALUE,
    element: () => createElement(DataRow, { label: LABEL, value: VALUE }),
  },
]

const allowed: Record<string, string> = baseline

/** The classes the host element holding `text` was rendered with. */
function classesOf(text: string): string[] {
  const raw = capturedByNode.get(screen.getByText(text))
  if (raw === undefined) throw new Error(`no captured className for "${text}"`)
  return raw.split(/\s+/).filter(Boolean)
}

function classesAs(element: ReactElement, text: string): string[] {
  const { unmount } = render(element)
  const classes = classesOf(text)
  unmount()
  return classes
}

function lastMatch(classes: string[], pattern: RegExp): string {
  const matches = classes.filter((cls) => pattern.test(cls))
  return matches[matches.length - 1] ?? 'none'
}

/** The first variant whose every class the element kept, or `raw` when an override broke them all. */
function variantOf(classes: string[], variantClasses: Map<TypographyVariant, string[]>): string {
  const kept = new Set(classes)
  for (const [variant, own] of variantClasses) if (own.every((cls) => kept.has(cls))) return variant
  return 'raw'
}

function treatment(
  role: Role,
  classes: string[],
  variantClasses: Map<TypographyVariant, string[]>
) {
  const colour = lastMatch(classes, COLOUR)
  if (role === 'eyebrow') {
    const variant = variantOf(classes, variantClasses)
    return {
      rendered: `${variant} × ${colour}`,
      meets: EYEBROW_VARIANTS.has(variant) && colour === 'text-text-secondary',
    }
  }
  const weight = lastMatch(classes, WEIGHT)
  return {
    rendered: `${weight} × ${colour}`,
    meets: weight === 'font-bold' && colour === 'text-text-primary',
  }
}

const EXPECTED: Record<Role, string> = {
  eyebrow: '`overline` or `microLabel` × `text-text-secondary`',
  value: '`font-bold` × `text-text-primary`',
}

describe('typography roles', () => {
  let variantClasses: Map<TypographyVariant, string[]>

  beforeAll(() => {
    variantClasses = new Map(
      VARIANTS.map((variant) => [
        variant,
        classesAs(createElement(Typography, { variant, color: 'inherit' }, variant), variant),
      ])
    )
  })

  it.each(SITES)('$site renders the $role role', ({ site, role, text, element }) => {
    const { rendered, meets } = treatment(role, classesAs(element(), text), variantClasses)
    if (site in allowed) {
      expect(
        meets,
        `${site} now renders the ${role} role: delete its entry from typography-roles-baseline.json`
      ).toBe(false)
      expect(
        rendered,
        `${site} drifted to another miss; the ${role} role is ${EXPECTED[role]}`
      ).toBe(allowed[site])
      return
    }
    expect(meets, `${site} renders ${rendered}; the ${role} role is ${EXPECTED[role]}`).toBe(true)
  })

  it('baselines only sites the table names', () => {
    const sites = new Set(SITES.map(({ site }) => site))
    expect(Object.keys(allowed).filter((site) => !sites.has(site))).toEqual([])
  })

  it('classifies a variant the element keeps whole and calls an override raw', () => {
    const overline = classesAs(createElement(Typography, { variant: 'overline' }, LABEL), LABEL)
    expect(variantOf(overline, variantClasses)).toBe('overline')
    const overridden = classesAs(createElement(Eyebrow, null, LABEL), LABEL)
    expect(overridden).toContain('tracking-wider')
    expect(variantOf(overridden, variantClasses)).toBe('raw')
  })
})
