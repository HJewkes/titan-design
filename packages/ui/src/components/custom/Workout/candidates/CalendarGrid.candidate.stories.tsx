// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/calendar/CalendarGrid.tsx
// Rating:   Medium · titan equiv: none (no monthly calendar grid)
// Why:      Monthly history calendar with workout-day dot markers, today ring, and
//           selected-day fill. Month navigation is frozen (arrows render, no-op); the
//           domain date-range helper and Ionicons are reimplemented locally/with text glyphs.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getCalendarDays(year: number, month: number): string[] {
  const firstOfMonth = new Date(year, month, 1)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7 // Monday = 0
  const start = new Date(year, month, 1 - firstWeekday)
  const days: string[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(toDateKey(d))
  }
  return days
}

/** Static faithful re-render of the mobile CalendarGrid (month nav frozen, no Date.now()). */
function CalendarGridSpecimen({
  year,
  month,
  workoutDates,
  selectedDate,
  todayKey,
}: {
  year: number
  month: number
  workoutDates: Set<string>
  selectedDate: string | null
  todayKey: string | null
}) {
  const days = getCalendarDays(year, month)
  const monthName = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <View>
      <View
        style={{
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={() => {}} style={{ padding: 8 }}>
          <Text style={{ fontSize: 20, color: t['text-primary'] }}>{'‹'}</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t['text-primary'] }}>
          {monthName}
        </Text>
        <Pressable onPress={() => {}} style={{ padding: 8 }}>
          <Text style={{ fontSize: 20, color: t['text-primary'] }}>{'›'}</Text>
        </Pressable>
      </View>
      <View style={{ marginBottom: 8, flexDirection: 'row' }}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: t['text-disabled'] }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      {Array.from({ length: 6 }, (_, weekIndex) => (
        <View key={weekIndex} style={{ flexDirection: 'row' }}>
          {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((dateKey) => {
            const dayNum = parseInt(dateKey.split('-')[2], 10)
            const dayMonth = parseInt(dateKey.split('-')[1], 10) - 1
            const isCurrentMonth = dayMonth === month
            const isToday = dateKey === todayKey
            const isSelected = dateKey === selectedDate
            const hasWorkout = workoutDates.has(dateKey)

            return (
              <Pressable
                key={dateKey}
                onPress={() => {}}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
              >
                <View
                  style={{
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    ...(isSelected ? { backgroundColor: t['brand-primary'] } : {}),
                    ...(isToday && !isSelected
                      ? { borderWidth: 1, borderColor: t['brand-primary'] }
                      : {}),
                  }}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? '#FFFFFF'
                        : isCurrentMonth
                          ? t['text-primary']
                          : t['text-disabled'],
                      fontWeight: isToday || isSelected ? '700' : '400',
                      fontSize: 14,
                    }}
                  >
                    {dayNum}
                  </Text>
                </View>
                <View
                  style={{
                    marginTop: 2,
                    height: 6,
                    width: 6,
                    borderRadius: 999,
                    backgroundColor: hasWorkout
                      ? isSelected
                        ? t['brand-primary']
                        : alpha(t['brand-primary'], 0.8)
                      : 'transparent',
                  }}
                />
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const meta: Meta<typeof CalendarGridSpecimen> = {
  title: 'Lab/Candidates/Charts/CalendarGrid',
  component: CalendarGridSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Monthly history calendar ' +
          'with workout-day dot markers, a today ring, and a selected-day fill. titan has no ' +
          'equivalent calendar grid. Month navigation frozen (no-op arrows). Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CalendarGridSpecimen>

const marchWorkouts = new Set([
  '2026-03-02',
  '2026-03-04',
  '2026-03-06',
  '2026-03-09',
  '2026-03-11',
  '2026-03-13',
  '2026-03-16',
  '2026-03-18',
  '2026-03-20',
  '2026-03-23',
  '2026-03-25',
])

export const ActiveMonth: Story = {
  args: {
    year: 2026,
    month: 2,
    workoutDates: marchWorkouts,
    selectedDate: null,
    todayKey: '2026-03-16',
  },
}
export const DaySelected: Story = {
  args: {
    year: 2026,
    month: 2,
    workoutDates: marchWorkouts,
    selectedDate: '2026-03-11',
    todayKey: '2026-03-16',
  },
}
export const SparseMonth: Story = {
  args: {
    year: 2026,
    month: 0,
    workoutDates: new Set(['2026-01-05', '2026-01-19']),
    selectedDate: null,
    todayKey: '2026-01-19',
  },
}
