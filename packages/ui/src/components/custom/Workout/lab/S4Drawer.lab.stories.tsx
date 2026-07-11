// LAB EXPLORATION — do not consume in app surfaces.
//
// Candidate design directions for shell unit S4 (overlay/drawer system): the
// scrim + right drawer that hosts drill-ins from any view, with a bottom-sheet
// form on phone. Net-new — no mobile source; composes the S1–S3 shell visual
// language (charcoal surfaces, orange brand accent, mono micro-labels). Static:
// scrim + drawer are shown permanently open, no animation/gesture/backdrop-press
// wiring.
//
// Spec:    coordination/design-explorations/DASHBOARD-DECOMPOSITION.md (S4 row)
// Rating:  Exploration · titan equiv: none (first drawer/overlay primitive)
// Why:     Two structural questions compete: drawer WIDTH/density (a wide
//          detail drill-in vs a narrow quick-action panel) and FORM FACTOR
//          (right-anchored panel on tablet/wall vs bottom sheet on phone).
//          Static specimen.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

interface DrawerRow {
  title: string
  subtitle?: string
}

/** Simplified shell backdrop (rail + topbar + content blocks) so the scrim reads as "over the app". */
function BackdropSpecimen() {
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: t['surface-base'] }}>
      <View
        style={{
          width: 46,
          backgroundColor: t['surface-elevated'],
          borderRightWidth: 1,
          borderRightColor: t['border-default'],
        }}
      />
      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 40,
            backgroundColor: t['surface-elevated'],
            borderBottomWidth: 1,
            borderBottomColor: t['border-default'],
          }}
        />
        <View style={{ flex: 1, padding: 16, gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ height: 56, borderRadius: 10, backgroundColor: t['surface-raised'] }}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

/** Static faithful re-render of the S4 drawer direction: scrim + a right panel or bottom sheet. */
function ShellDrawerSpecimen({
  stageWidth,
  stageHeight,
  anchor,
  drawerSize,
  density,
  headerTitle,
  headerSubtitle,
  rows,
  actionLabel,
}: {
  stageWidth: number
  stageHeight: number
  anchor: 'right' | 'bottom'
  drawerSize: number
  density: 'compact' | 'full'
  headerTitle: string
  headerSubtitle?: string
  rows: DrawerRow[]
  actionLabel?: string
}) {
  const pad = density === 'compact' ? 12 : 20
  const panelStyle =
    anchor === 'right'
      ? {
          position: 'absolute' as const,
          top: 0,
          right: 0,
          bottom: 0,
          width: drawerSize,
          backgroundColor: t['surface-elevated'],
          borderLeftWidth: 1,
          borderLeftColor: t['border-prominent'],
          padding: pad,
          gap: 12,
          shadowColor: '#000',
          shadowOpacity: 0.45,
          shadowRadius: 18,
          shadowOffset: { width: -6, height: 0 },
        }
      : {
          position: 'absolute' as const,
          left: 0,
          right: 0,
          bottom: 0,
          height: drawerSize,
          backgroundColor: t['surface-elevated'],
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          borderTopColor: t['border-prominent'],
          padding: pad,
          gap: 12,
        }

  return (
    <View
      style={{
        width: stageWidth,
        height: stageHeight,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <BackdropSpecimen />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha('#000000', 0.55),
        }}
      />
      <View style={panelStyle}>
        {anchor === 'bottom' ? (
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: t['border-prominent'],
              }}
            />
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: density === 'compact' ? 14 : 17,
                fontWeight: '700',
                color: t['text-primary'],
              }}
            >
              {headerTitle}
            </Text>
            {headerSubtitle ? (
              <Text style={{ fontSize: 11, color: t['text-tertiary'], marginTop: 2 }}>
                {headerSubtitle}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={() => {}}>
            <Text style={{ fontSize: 16, color: t['text-tertiary'] }}>✕</Text>
          </Pressable>
        </View>

        <View style={{ gap: density === 'compact' ? 6 : 10 }}>
          {rows.map((row, i) => (
            <Pressable
              key={i}
              onPress={() => {}}
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: t['border-default'],
                backgroundColor: t['surface-raised'],
                paddingVertical: density === 'compact' ? 8 : 12,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: t['text-primary'] }}>
                {row.title}
              </Text>
              {row.subtitle ? (
                <Text style={{ fontSize: 11, color: t['text-tertiary'], marginTop: 2 }}>
                  {row.subtitle}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        {actionLabel ? (
          <Pressable
            onPress={() => {}}
            style={{
              marginTop: 'auto',
              borderRadius: 10,
              backgroundColor: t['brand-primary'],
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: t['text-inverse'] }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const meta: Meta<typeof ShellDrawerSpecimen> = {
  title: 'Lab/Explorations/S4-Drawer',
  component: ShellDrawerSpecimen,
  tags: ['status:lab', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Lab exploration** — candidate directions for shell unit S4 (overlay/drawer system): ' +
          'scrim + right drawer for drill-ins from any view, bottom-sheet form on phone. Three ' +
          'directions vary width/density and form factor. titan has no drawer/overlay primitive yet. ' +
          'Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ShellDrawerSpecimen>

/** Wide right drawer — full exercise drill-in detail (tablet/wall). */
export const TabletDrawerWide: Story = {
  args: {
    stageWidth: 640,
    stageHeight: 400,
    anchor: 'right',
    drawerSize: 420,
    density: 'full',
    headerTitle: 'Bulgarian Split Squat',
    headerSubtitle: 'Set 3 of 4 · 185 lb · RPE 8',
    rows: [
      { title: 'Set 1', subtitle: '8 reps · 0.71 m/s mean con' },
      { title: 'Set 2', subtitle: '8 reps · 0.68 m/s mean con' },
      { title: 'Set 3 (current)', subtitle: '6 reps so far · 0.61 m/s mean con' },
      { title: 'Set 4', subtitle: 'not started' },
    ],
    actionLabel: 'Log Set Note',
  },
}

/** Narrow right drawer — a quick-action panel (density test against the wide direction). */
export const TabletDrawerCompact: Story = {
  args: {
    stageWidth: 640,
    stageHeight: 400,
    anchor: 'right',
    drawerSize: 280,
    density: 'compact',
    headerTitle: 'Swap Exercise',
    headerSubtitle: 'Quad-dominant alternatives',
    rows: [
      { title: 'Leg Press' },
      { title: 'Walking Lunge' },
      { title: 'Cable Step-Up' },
      { title: 'Goblet Squat' },
    ],
    actionLabel: 'Confirm Swap',
  },
}

/** Bottom-sheet form on phone — quick-note capture, rounded top + drag handle. */
export const PhoneBottomSheet: Story = {
  args: {
    stageWidth: 360,
    stageHeight: 600,
    anchor: 'bottom',
    drawerSize: 320,
    density: 'full',
    headerTitle: 'Add Set Note',
    headerSubtitle: 'Set 3 · Bulgarian Split Squat',
    rows: [
      { title: 'Felt strong' },
      { title: 'Left knee twinge' },
      { title: 'Reduce load next set' },
    ],
    actionLabel: 'Save Note',
  },
}
