// Compile-time contract checks for the shell `brand` prop; `pnpm type-check` is the test.
import type { AppShellProps } from './AppShell'
import type { BrandLockupProps } from './BrandLockup'
import type { TopBarProps } from './TopBar'
import { brandPresets } from './brands'

const lockupByKey: BrandLockupProps = { brand: 'brain' }
const topBarByPreset: TopBarProps = { brand: brandPresets.agents }
const shellByKey: AppShellProps = { brand: 'voltras' }

// @ts-expect-error no app is the default: a lockup names its brand
const lockupWithoutBrand: BrandLockupProps = {}

// @ts-expect-error no app is the default: a top bar names its brand
const topBarWithoutBrand: TopBarProps = { showClock: false }

// @ts-expect-error no app is the default: a shell names its brand
const shellWithoutBrand: AppShellProps = { navItems: [] }

// @ts-expect-error a brand outside the registry passes a full BrandPreset, not a new key
const unknownKey: BrandLockupProps = { brand: 'hyperframes' }

export const typecheckSubjects = [
  lockupByKey,
  topBarByPreset,
  shellByKey,
  lockupWithoutBrand,
  topBarWithoutBrand,
  shellWithoutBrand,
  unknownKey,
]
