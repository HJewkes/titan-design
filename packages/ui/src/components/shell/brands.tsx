import type { ReactNode } from 'react'
import { BotIcon, BrainIcon, HeadphonesIcon, KanbanIcon, VoltrasMark } from '../icons'

/** The apps that are expected to mount this shell. */
export type BrandKey = 'voltras' | 'audiobook' | 'active-work' | 'agents' | 'brain'

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

// Accents come from `data-*` rather than `status-*`: `data-*` is the library's
// palette of N distinct, CVD-checked hues with no semantic load, which is exactly
// what a per-app identity accent needs. Voltras keeps the real brand token.
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
    accentClassName: 'text-data-5',
    accentBarClassName: 'bg-data-5',
    subtitle: 'library',
  },
  'active-work': {
    mark: <KanbanIcon size={14} color="currentColor" />,
    wordmark: 'ACTIVE WORK',
    accentClassName: 'text-data-1',
    accentBarClassName: 'bg-data-1',
    subtitle: 'initiatives',
  },
  agents: {
    mark: <BotIcon size={14} color="currentColor" />,
    wordmark: 'AGENTS',
    accentClassName: 'text-data-2',
    accentBarClassName: 'bg-data-2',
    subtitle: 'fleet',
  },
  brain: {
    mark: <BrainIcon size={14} color="currentColor" />,
    wordmark: 'BRAIN',
    accentClassName: 'text-data-3',
    accentBarClassName: 'bg-data-3',
    subtitle: 'knowledge',
  },
}

/** Every brand key, in the order the stories present them. */
export const brandKeys = Object.keys(brandPresets) as BrandKey[]
