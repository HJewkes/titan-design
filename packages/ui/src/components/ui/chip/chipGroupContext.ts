import { createContext } from 'react'
import type { HitTargetLimit } from '../../../utils/hit-target'

/**
 * Set by `ChipGroup`. A pressable chip inside it is a radio, and its 44px hit box
 * stops at the neighbouring chip's face (TD-10, TD-991).
 */
export const ChipGroupContext = createContext<HitTargetLimit | undefined>(undefined)
