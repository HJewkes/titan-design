import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { layoutCollectorSource } from '../../scripts/audit-stories/layout-collect.mjs'

export type CollectArgs = { spacingVars?: string[] }

/** Loads a fixture page and installs the layout collector beside it, as a capture run would. */
export async function loadFixture(page: Page, name: string, source = layoutCollectorSource) {
  const html = readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')
  await page.setContent(html)
  await page.addScriptTag({ content: source })
  await page.evaluate(() => document.fonts.ready)
}

/** Runs the installed collector in the page. */
export function collect(page: Page, args: CollectArgs = {}) {
  return page.evaluate(
    (a) => (window as unknown as { collectLayout: (x: CollectArgs) => Layout }).collectLayout(a),
    args
  )
}

type Line = { baseline: number; inkTop: number; inkBottom: number; left: number; right: number }
type Rect = [number, number, number, number]
export type NodeStyle = {
  color: string
  backgroundColor: string
  hasBackgroundImage: boolean
  opacity: number
  effectiveOpacity: number
  boxShadow: string
  direction: string
  textAlign: string
}
export type NodeText = {
  fontSize: number
  lineCount: number
  first: Line
  last: Line
  textTransform: string
  letterSpacing: number
  fontWeight: number
  family: string
  color: string
  /** Lowercase `#rrggbb`, or null when a background image stops the walk. */
  backdrop: string | null
  backdropImage: boolean
  ownText: string
}
export type NodeState = {
  selected: boolean
  current: string | null
  pressed: string | null
  checked: string | null
  disabled: boolean
}
export type LayoutNode = {
  id: string
  parent: string | null
  selector: string
  tag: string
  box: Rect
  ink: Rect | null
  paints: boolean
  text: NodeText | null
  style: NodeStyle
  /** svg nodes only: a geometry hash, or the `data-icon` attribute. */
  glyph?: string | null
  /** svg nodes only: the computed stroke, else fill, of the first painted shape. */
  paint?: string | null
  concept: string | null
  state: NodeState
  heading: number | null
}
export type StoryAudit = {
  concepts: Record<string, string[]>
  glyphRoles: Record<string, string>
}
export type Layout = {
  nodes: LayoutNode[]
  truncated: boolean
  declared: Record<string, number>
  audit: StoryAudit
}
