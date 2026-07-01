// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { Star } from 'lucide-react'
import { Drawer, DrawerBody } from '../../ui/drawer'

const BRAND_PRIMARY = '#FF7900'
const RECENT_BORDER = 'rgba(255,176,32,0.3)'
const RECENT_GLOW = '0 0 12px rgba(255,176,32,0.06)'
const SURFACE_RAISED = 'var(--color-surface-raised)'
const BORDER_DEFAULT = 'var(--color-border-default)'
const TEXT_PRIMARY = 'var(--color-text-primary)'
const TEXT_SECONDARY = 'var(--color-text-secondary)'
const TEXT_TERTIARY = 'var(--color-text-tertiary)'

export type PrRecordType = 'e1rm' | 'weight' | 'reps' | 'volume' | 'velocity'

export interface PrRecord {
  /** PR category, drives the row label and ordering grouping. */
  type: PrRecordType
  /** Numeric magnitude (paired with `unit`) or a pre-formatted display string. */
  value: string | number
  /** Unit suffix appended to numeric values, e.g. "lbs" or "kg". */
  unit?: 'lbs' | 'kg'
  /** Display date for when the record was set, e.g. "Mar 14" or "2 weeks ago". */
  date: string
  /** Marks the record as recently set; adds a subtle amber glow highlight. */
  isRecent?: boolean
}

export interface PrHistoryModalProps extends ViewProps {
  /** Identifier of the exercise whose PR history is shown. */
  exerciseId: string
  /** Human-readable exercise name for the title and a11y label; falls back to `exerciseId`. */
  exerciseName?: string
  /** PR records to display, expected newest-first. */
  records: PrRecord[]
  /** Whether the bottom sheet is visible. */
  isOpen?: boolean
  /** Alias for `isOpen` (spec wording: "isOpen/visible"). `isOpen` wins when both are set. */
  visible?: boolean
  /** Invoked when the sheet requests to close (backdrop, close button, or back gesture). */
  onClose: () => void
}

const TYPE_LABELS: Record<PrRecordType, string> = {
  e1rm: 'e1RM',
  weight: 'Weight',
  reps: 'Reps',
  volume: 'Volume',
  velocity: 'Velocity',
}

function recordLabel(type: PrRecordType): string {
  return TYPE_LABELS[type] ?? type
}

function recordValueText({ value, unit }: PrRecord): string {
  if (typeof value === 'number') {
    return unit ? `${value} ${unit}` : String(value)
  }
  return value
}

function PrRecordRow({ record, index }: { record: PrRecord; index: number }) {
  const label = recordLabel(record.type)
  const valueText = recordValueText(record)
  const a11yLabel = record.isRecent
    ? `${label} personal record: ${valueText}, ${record.date}, recent`
    : `${label} personal record: ${valueText}, ${record.date}`

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
      className="flex-row items-center"
      style={{
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: SURFACE_RAISED,
        borderWidth: 1,
        borderColor: record.isRecent ? RECENT_BORDER : BORDER_DEFAULT,
        ...(record.isRecent ? { boxShadow: RECENT_GLOW } : {}),
      }}
      testID={`pr-history-modal-record-${index}`}
    >
      <Star size={16} color={BRAND_PRIMARY} fill={BRAND_PRIMARY} strokeWidth={2} />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          color: TEXT_SECONDARY,
        }}
        testID={`pr-history-modal-record-${index}-type`}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: '700',
          color: TEXT_PRIMARY,
        }}
        testID={`pr-history-modal-record-${index}-value`}
      >
        {valueText}
      </Text>
      <Text
        style={{
          minWidth: 64,
          textAlign: 'right',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          color: TEXT_TERTIARY,
        }}
        testID={`pr-history-modal-record-${index}-date`}
      >
        {record.date}
      </Text>
    </View>
  )
}

/**
 * Bottom-sheet modal listing an exercise's personal-record history. Each row
 * shows the PR type, value, and date; recent records get a subtle amber glow.
 * Built on the titan `Drawer` primitive (bottom placement) so it inherits
 * backdrop dismissal, the back gesture, and `role="dialog"` semantics.
 *
 * Typically triggered by tapping a `WeightBadge`, but the modal itself is
 * controlled — the trigger lives in the consumer.
 *
 * @example
 * <PrHistoryModal
 *   exerciseId="bench-press"
 *   exerciseName="Bench Press"
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   records={[
 *     { type: 'e1rm', value: 245, unit: 'lbs', date: 'Mar 14', isRecent: true },
 *     { type: 'reps', value: '8 @ 185 lbs', date: 'Feb 28' },
 *   ]}
 * />
 */
export function PrHistoryModal({
  exerciseId,
  exerciseName,
  records,
  isOpen,
  visible,
  onClose,
  ...props
}: PrHistoryModalProps) {
  const open = isOpen ?? visible ?? false
  const exercise = exerciseName ?? exerciseId
  const dialogLabel = `${exercise} PR history`

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      placement="bottom"
      showCloseButton={false}
      className="rounded-t-2xl h-auto max-h-[85%]"
      accessibilityLabel={dialogLabel}
      testID="pr-history-modal"
      {...props}
    >
      <View
        accessibilityElementsHidden
        style={{
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          marginTop: 8,
          backgroundColor: BORDER_DEFAULT,
        }}
        testID="pr-history-modal-handle"
      />

      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}
        testID="pr-history-modal-header"
      >
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 16,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: '700',
            color: TEXT_PRIMARY,
          }}
          testID="pr-history-modal-title"
        >
          {dialogLabel}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close PR history"
          hitSlop={8}
          style={{ padding: 4, margin: -4 }}
          testID="pr-history-modal-close"
        >
          <Text style={{ fontSize: 22, lineHeight: 22, color: TEXT_SECONDARY }}>
            {'×'}
          </Text>
        </Pressable>
      </View>

      <DrawerBody className="px-4 pt-0 pb-4">
        {records.length === 0 ? (
          <View style={{ paddingVertical: 24 }} testID="pr-history-modal-empty">
            <Text
              style={{
                textAlign: 'center',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: TEXT_TERTIARY,
              }}
            >
              No personal records yet
            </Text>
          </View>
        ) : (
          records.map((record, index) => (
            <PrRecordRow
              key={`${record.type}-${record.date}-${index}`}
              record={record}
              index={index}
            />
          ))
        )}
      </DrawerBody>
    </Drawer>
  )
}
