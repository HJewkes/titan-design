import type { ThemePreset } from './types'

function colorKeyToVar(key: string): string {
  return `--color-${key}`
}

function applyColorOverrides(colors: Record<string, string | undefined>, root: HTMLElement) {
  for (const [key, value] of Object.entries(colors)) {
    if (value !== undefined) {
      root.style.setProperty(colorKeyToVar(key), value)
    }
  }
}

function applyFontOverrides(fonts: Record<string, string | undefined>, root: HTMLElement) {
  const fontVarMap: Record<string, string> = {
    sans: '--font-family-sans',
    body: '--font-family-body',
    heading: '--font-family-heading',
    mono: '--font-family-mono',
  }
  for (const [key, value] of Object.entries(fonts)) {
    if (value !== undefined && fontVarMap[key]) {
      root.style.setProperty(fontVarMap[key], value)
    }
  }
}

function injectFontImport(url: string) {
  if (typeof document === 'undefined') return
  const existing = document.querySelector(`link[href="${url}"]`)
  if (existing) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

export function applyThemePreset(preset: ThemePreset): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  const root = document.documentElement
  const removals: (() => void)[] = []

  // Inject font import if specified
  if (preset.fontImport) {
    injectFontImport(preset.fontImport)
  }

  // Determine current theme mode
  const isLight = root.classList.contains('light')
  const modeColors = isLight ? preset.colors?.light : preset.colors?.dark

  // Apply color overrides
  if (modeColors) {
    const previousValues: Record<string, string | null> = {}
    for (const key of Object.keys(modeColors)) {
      previousValues[colorKeyToVar(key)] = root.style.getPropertyValue(colorKeyToVar(key)) || null
    }
    applyColorOverrides(modeColors, root)
    removals.push(() => {
      for (const [varName, prev] of Object.entries(previousValues)) {
        if (prev === null) {
          root.style.removeProperty(varName)
        } else {
          root.style.setProperty(varName, prev)
        }
      }
    })
  }

  // Apply font overrides
  if (preset.fonts) {
    applyFontOverrides(preset.fonts as Record<string, string | undefined>, root)
  }

  // Apply root classes
  if (preset.rootClasses) {
    for (const cls of preset.rootClasses) {
      root.classList.add(cls)
    }
    removals.push(() => {
      for (const cls of preset.rootClasses!) {
        root.classList.remove(cls)
      }
    })
  }

  // Return cleanup function
  return () => {
    for (const remove of removals) {
      remove()
    }
  }
}
