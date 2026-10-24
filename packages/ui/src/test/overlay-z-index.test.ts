import fs from 'node:fs'
import path from 'node:path'
import { primitiveZIndex } from '../theme/tokens/primitives'

const uiRoot = path.resolve(__dirname, '../components/ui')

const isScanned = (file: string) =>
  /\.tsx?$/.test(file) && !/\.(test|stories)\.tsx?$/.test(file) && !file.endsWith('.d.ts')

const RAW_Z_CLASS = /(?<![\w])z-(\d+|\[[^\]]*\])/g
const RAW_Z_STYLE = /zIndex:\s*-?\d+/g

function rawZIndexSites(source: string): string[] {
  return [...(source.match(RAW_Z_CLASS) ?? []), ...(source.match(RAW_Z_STYLE) ?? [])]
}

function scanUi(): Record<string, string[]> {
  const sites: Record<string, string[]> = {}
  for (const entry of fs.readdirSync(uiRoot, { recursive: true, encoding: 'utf8' })) {
    if (!isScanned(entry)) continue
    const found = rawZIndexSites(fs.readFileSync(path.join(uiRoot, entry), 'utf8'))
    if (found.length > 0) sites[entry.split(path.sep).join('/')] = found
  }
  return sites
}

const read = (file: string) => fs.readFileSync(path.join(uiRoot, file), 'utf8')

/** Each overlay and the named steps its backdrop and panel sit on. */
const OVERLAY_STEPS: Array<[string, string[]]> = [
  ['popover/Popover.tsx', ['z-overlay', 'z-popover']],
  ['menu/Menu.tsx', ['z-overlay', 'z-popover']],
  ['select/SelectPopover.tsx', ['z-overlay', 'z-popover']],
  ['toolbar-button/ToolbarButtonParts.tsx', ['z-overlay', 'z-popover']],
  ['autocomplete/AutocompleteParts.tsx', ['z-popover']],
  ['toast/Toast.tsx', ['z-toast']],
  ['tooltip/Tooltip.tsx', ['z-tooltip']],
  ['tooltip/TooltipParts.tsx', ['primitiveZIndex.tooltip']],
]

describe('overlay z-index', () => {
  it('flags a raw z-index class or numeric zIndex literal', () => {
    expect(rawZIndexSites("cn('fixed z-[9999] flex')")).toEqual(['z-[9999]'])
    expect(rawZIndexSites('className="absolute z-50"')).toEqual(['z-50'])
    expect(rawZIndexSites('style={{ zIndex: 10000 }}')).toEqual(['zIndex: 10000'])
    expect(rawZIndexSites('className="z-popover" style={{ zIndex: Z.top }} // z-index')).toEqual([])
  })

  it('finds no raw z-index literal in ui components', () => {
    expect(scanUi()).toEqual({})
  })

  it.each(OVERLAY_STEPS)('%s sits on its named z steps', (file, steps) => {
    const source = read(file)
    for (const step of steps) expect(source).toContain(step)
  })

  it('stacks backdrop under panel under toast under tooltip', () => {
    const { overlay, popover, toast, tooltip } = primitiveZIndex
    expect(overlay).toBeLessThan(popover)
    expect(popover).toBeLessThan(toast)
    expect(toast).toBeLessThan(tooltip)
  })
})
