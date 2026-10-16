import type { ReactNode } from 'react'
import { ActivityIcon, BotIcon, BrainIcon, HeadphonesIcon, KanbanIcon, VoltrasMark } from '../icons'

/** The apps that are expected to mount this shell. */
export type BrandKey = 'voltras' | 'audiobook' | 'active-work' | 'agents' | 'brain' | 'console'

export interface BrandPreset {
  /** The mark glyph, rendered at 14px through the accent token via `currentColor`. */
  mark: ReactNode
  /** Uppercase product wordmark. */
  wordmark: string
  /** Semantic text token that colours the mark. */
  accentClassName: string
  /**
   * The same accent as a background token, for the nav's active bar. Declared as
   * a literal alongside its `text-*` twin because Tailwind only emits classes it
   * can see in the source — a name built at runtime is never generated.
   */
  accentBarClassName: string
  /** Default "/ subtitle" for that app's shell. */
  subtitle: string
}

// Accents come from `dataviz-categorical-*` rather than `status-*`: distinct,
// CVD-checked hues with no semantic load and a value per mode, which is what a
// per-app identity accent needs. They paint only non-text marks (the glyph and
// the nav bar), so they answer to 3:1, not 4.5; labels stay on `text-primary`.
// Voltras keeps the real brand token.
export const brandPresets: Record<BrandKey, BrandPreset> = {
  voltras: {
    mark: <VoltrasMark size={14} color="currentColor" />,
    wordmark: 'VOLTRAS',
    accentClassName: 'text-brand-primary',
    accentBarClassName: 'bg-brand-primary',
    subtitle: 'wall dashboard',
  },
  audiobook: {
    mark: <HeadphonesIcon size={14} color="currentColor" />,
    wordmark: 'AUDIOBOOK',
    accentClassName: 'text-dataviz-categorical-1',
    accentBarClassName: 'bg-dataviz-categorical-1',
    subtitle: 'library',
  },
  'active-work': {
    mark: <KanbanIcon size={14} color="currentColor" />,
    wordmark: 'ACTIVE WORK',
    accentClassName: 'text-dataviz-categorical-0',
    accentBarClassName: 'bg-dataviz-categorical-0',
    subtitle: 'initiatives',
  },
  agents: {
    mark: <BotIcon size={14} color="currentColor" />,
    wordmark: 'AGENTS',
    accentClassName: 'text-dataviz-categorical-4',
    accentBarClassName: 'bg-dataviz-categorical-4',
    subtitle: 'fleet',
  },
  brain: {
    mark: <BrainIcon size={14} color="currentColor" />,
    wordmark: 'BRAIN',
    accentClassName: 'text-dataviz-categorical-6',
    accentBarClassName: 'bg-dataviz-categorical-6',
    subtitle: 'knowledge',
  },
  console: {
    mark: <ActivityIcon size={14} color="currentColor" />,
    wordmark: 'CONSOLE',
    accentClassName: 'text-dataviz-categorical-2',
    accentBarClassName: 'bg-dataviz-categorical-2',
    subtitle: 'operations',
  },
}

/** Every brand key, in the order the stories present them. */
export const brandKeys = Object.keys(brandPresets) as BrandKey[]

/**
 * A registry key or an app's own preset → the preset to render. Every shell
 * component that takes `brand` resolves it here, so an app with no registry
 * entry passes its {@link BrandPreset} and gets the same lockup and nav accent.
 */
export function resolveBrand(brand: BrandKey | BrandPreset): BrandPreset {
  return typeof brand === 'string' ? brandPresets[brand] : brand
}
