import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import type { ThemeMode } from '../../theme/tokens/semantic'
import {
  DARK_PLANES,
  INK,
  PLANE_KEYS,
  PLANE_ROLE,
  ROLES,
  missesOnMain,
  optionColours,
  readRole,
  roleColours,
  solveRecolours,
  stepName,
  type AaOption,
  type Group,
  type PlaneKey,
  type Planes,
  type Role,
} from './ramp-aa'

// Every colour here is painted explicitly, so a frame looks the same under either story theme.
// A text role that misses is drawn as a swatch beside a label in the frame's ink, never as live
// text in the failing colour: the story contrast gate has no known-defect list for a lab frame.
const GROUPS: Group[] = [
  'Text',
  'Input',
  'Status marks',
  'BarList fill',
  'Hairline',
  'Shell accent',
]
const LABEL = 'font-mono text-[11px]'

type Colours = Record<string, string>

function Ink({ mode, miss, children }: { mode: ThemeMode; miss?: boolean; children: ReactNode }) {
  const color = miss ? INK[mode].miss : INK[mode].label
  return (
    <Text className={miss ? `${LABEL} font-semibold` : LABEL} style={{ color }}>
      {children}
    </Text>
  )
}

function Sample({ role, colour, track }: { role: Role; colour: string; track: string }) {
  if (role.kind === 'hairline') {
    return <View className="h-px w-12" style={{ backgroundColor: colour }} />
  }
  if (role.kind === 'fill') {
    return (
      <View className="h-2 w-12 rounded-full" style={{ backgroundColor: track }}>
        <View className="h-2 w-8 rounded-full" style={{ backgroundColor: colour }} />
      </View>
    )
  }
  if (role.group === 'Input') {
    return <View className="h-5 w-12 rounded border" style={{ borderColor: colour }} />
  }
  if (role.group === 'Shell accent') {
    return <View className="h-4 w-1 rounded-full" style={{ backgroundColor: colour }} />
  }
  const shape = role.kind === 'text' ? 'h-3 w-6 rounded-sm' : 'h-3 w-3 rounded-full'
  return <View className={shape} style={{ backgroundColor: colour }} />
}

interface RowProps {
  role: Role
  colours: Colours
  on: Planes
  plane: PlaneKey
  mode: ThemeMode
}

function RoleRow({ role, colours, on, plane, mode }: RowProps) {
  const colour = colours[role.id]
  const reading = readRole(role, colour, on, colours).find((r) => r.plane === plane)!
  const unit = role.kind === 'hairline' ? ' ΔL*' : ''
  const label = `${role.id} · ${stepName(colour)} · ${reading.value.toFixed(2)}${unit}`
  const live = role.kind === 'text' && reading.passes
  return (
    <View
      className="flex-row flex-wrap items-center gap-inline-xs"
      testID={reading.passes ? 'aa-pass' : 'aa-miss'}
    >
      {reading.passes ? null : (
        <Ink mode={mode} miss>
          {`MISS < ${role.floor}`}
        </Ink>
      )}
      {live ? (
        <Text className={LABEL} style={{ color: colour }}>
          {label}
        </Text>
      ) : (
        <>
          <Sample role={role} colour={colour} track={colours['hairline-default']} />
          <Ink mode={mode}>{label}</Ink>
        </>
      )}
      {role.pinned && !reading.passes ? <Ink mode={mode}>{role.pinned}</Ink> : null}
    </View>
  )
}

function PlaneFrame({ plane, colours, on, mode }: Omit<RowProps, 'role'>) {
  const roles = ROLES.filter((r) => r.planes.includes(plane))
  return (
    <View
      className="min-w-[300px] flex-1 basis-[300px] gap-stack-xs rounded-lg p-inset-md"
      style={{ backgroundColor: on[plane] }}
      testID={`plane-${plane}`}
    >
      <Ink mode={mode}>{`${PLANE_ROLE[plane]} · ${stepName(on[plane])}`}</Ink>
      {GROUPS.map((group) => {
        const rows = roles.filter((r) => r.group === group)
        if (rows.length === 0) return null
        return (
          <View key={group} className="gap-stack-xs pt-2">
            <Ink mode={mode}>{group.toUpperCase()}</Ink>
            {rows.map((role) => (
              <RoleRow
                key={role.id}
                role={role}
                colours={colours}
                on={on}
                plane={plane}
                mode={mode}
              />
            ))}
          </View>
        )
      })}
    </View>
  )
}

function worst(role: Role, colour: string, on: Planes, colours: Colours) {
  return Math.min(...readRole(role, colour, on, colours).map((r) => r.value)).toFixed(2)
}

function RecolourList({ option }: { option: AaOption }) {
  const before = roleColours('light')
  const after = optionColours(option)
  const set = Object.keys(solveRecolours(option.planes))
  return (
    <View className="gap-stack-xs" testID="recolour-set">
      <Ink mode="light">{`Re-colour set: ${set.length} roles (worst plane, before → after)`}</Ink>
      {ROLES.filter((r) => set.includes(r.id)).map((role) => (
        <Ink key={role.id} mode="light">
          {`${role.id}: ${stepName(before[role.id])} → ${stepName(after[role.id])} · ` +
            `${worst(role, before[role.id], option.planes, before)} → ` +
            `${worst(role, after[role.id], option.planes, after)}` +
            (role.repointTo ? ` (paint ${role.repointTo} instead)` : '') +
            (missesOnMain(role) ? ' · already misses on main' : '')}
        </Ink>
      ))}
    </View>
  )
}

function missCount(colours: Colours, on: Planes) {
  return ROLES.flatMap((r) => readRole(r, colours[r.id], on, colours)).filter((r) => !r.passes)
    .length
}

function Frames({ on, colours, mode }: { on: Planes; colours: Colours; mode: ThemeMode }) {
  return (
    <View className="flex-row flex-wrap gap-gutter-sm">
      {PLANE_KEYS.map((plane) => (
        <PlaneFrame key={plane} plane={plane} colours={colours} on={on} mode={mode} />
      ))}
    </View>
  )
}

const planesLine = (on: Planes) =>
  `Frame ${stepName(on.frame)} (no content) · ` +
  PLANE_KEYS.map((p) => `${PLANE_ROLE[p].split(':')[0]} ${stepName(on[p])}`).join(' · ')

export function OptionUnit({ option }: { option: AaOption }) {
  const colours = optionColours(option)
  const { failing, reKeyOnly } = option.storyThemes
  const source = option.key === 'asPicked' ? 'measured in #800’s CI' : 'estimated by role'
  return (
    <View
      className="gap-stack-sm p-gutter-md"
      style={{ backgroundColor: option.planes.overlay }}
      testID={`aa-${option.key}`}
    >
      <Text
        className="text-lg font-semibold"
        style={{ color: INK.light.label }}
        accessibilityRole="header"
      >
        {option.title}
      </Text>
      <Ink mode="light">{option.summary}</Ink>
      <Ink mode="light">{planesLine(option.planes)}</Ink>
      <Ink mode="light">
        {`Role-plane misses: ${missCount(colours, option.planes)} · story-themes the contrast ` +
          `spec fails: ${failing} (${source}); ${reKeyOnly} of them only move a miss the ` +
          'baseline already lists to the new plane'}
      </Ink>
      {option.recolours ? <RecolourList option={option} /> : null}
      <Frames on={option.planes} colours={colours} mode="light" />
    </View>
  )
}

export function DarkReferenceUnit() {
  const colours = roleColours('dark')
  return (
    <View
      className="gap-stack-sm p-gutter-md"
      style={{ backgroundColor: DARK_PLANES.background }}
      testID="aa-dark"
    >
      <Text
        className="text-lg font-semibold"
        style={{ color: INK.dark.label }}
        accessibilityRole="header"
      >
        Dark, for reference (unchanged in every option)
      </Text>
      <Ink mode="dark">{planesLine(DARK_PLANES)}</Ink>
      <Ink mode="dark">
        {`Role-plane misses: ${missCount(colours, DARK_PLANES)}, all on main today. This frame ` +
          'holds text-tertiary to 4.5:1 as axe does; the token gate holds it to 3:1. Dark ' +
          'text-error (red 500) is the owner’s pick below 4.5:1.'}
      </Ink>
      <Frames on={DARK_PLANES} colours={colours} mode="dark" />
    </View>
  )
}
