// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { Fragment, type ReactNode } from 'react'
import { View, Text, type ViewProps, type ViewStyle } from 'react-native'
import { Card } from '../../ui/card'
import { StatusDot } from './StatusDot'
import { resolveColor } from '../../../theme/resolve-color'

const BRAND_PRIMARY = '#FF7900'
const BRAND_PRIMARY_DARK = '#C45E00'
const BRAND_PRIMARY_LIGHT = '#FFB066'

const SUCCESS = '#14B8A6'
const WARNING = '#FFB020'
const ERROR = '#D14343'

/** Gradient stops for the 3px top accent: dark -> primary -> light (matches MesoCard). */
const ACCENT_STOPS = [BRAND_PRIMARY_DARK, BRAND_PRIMARY, BRAND_PRIMARY_LIGHT]

/**
 * Card surface gradient: elevated -> raised at 135deg. Uses resolved dark-theme
 * hexes (a gradient string can't carry a className token, and var() renders
 * black on native).
 */
const CARD_GRADIENT = `linear-gradient(135deg, ${resolveColor('surface-elevated')} 0%, ${resolveColor('surface-raised')} 100%)`

/** Gauge track gradient (teal -> amber -> red) at 0.25 alpha. */
const GAUGE_GRADIENT =
  'linear-gradient(90deg, rgba(20,184,166,0.25) 0%, rgba(255,176,32,0.25) 50%, rgba(209,67,67,0.25) 100%)'

export type MesoStatusBadgeVariant = 'success' | 'warning' | 'error'

const STATUS_VARIANTS: Record<
  MesoStatusBadgeVariant,
  { bg: string; border: string; text: string }
> = {
  success: { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.3)', text: SUCCESS },
  warning: { bg: 'rgba(255,176,32,0.15)', border: 'rgba(255,176,32,0.3)', text: WARNING },
  error: { bg: 'rgba(209,67,67,0.15)', border: 'rgba(209,67,67,0.25)', text: ERROR },
}

export interface MesoStatusBadge {
  /** Short status label, e.g. "On Track". */
  label: string
  /** Color treatment for the badge. */
  variant: MesoStatusBadgeVariant
}

export interface MesoStatusMetric {
  /** Cell label, e.g. "Prescribed". */
  label: string
  /** Cell value, e.g. "3×8 @ RPE 8". */
  value: string
}

export interface MesoStatusGauge {
  /** Gauge label, e.g. "Intensity". */
  label: string
  /** Fill position 0-1; the 14px marker sits at this level. */
  level: number
  /** Optional right-aligned sublabel, e.g. "Prescribed". */
  sublabel?: string
}

export interface MesoStatusCoaching {
  /** Coaching recommendation copy. */
  text: string
  /** Substrings within `text` to render in bold. */
  highlights?: string[]
}

export interface MesoStatusNextTarget {
  /** Leading glyph/emoji, e.g. "→" or "🎯". */
  icon: string
  /** Next-session target copy. */
  text: string
}

export interface MesoStatusCardProps extends ViewProps {
  /** Mesocycle name, e.g. "Hypertrophy Block". */
  mesoName: string
  /** Context line, e.g. "Week 6 of 8 · Upper/Lower". */
  mesoSubtitle: string
  /** Status pill in the header. */
  statusBadge: MesoStatusBadge
  /** Prescription-vs-actual metrics rendered as a 2x2 grid. */
  metrics: MesoStatusMetric[]
  /** Intensity / volume gauges stacked vertically. */
  gauges: MesoStatusGauge[]
  /** Optional coaching recommendation box. */
  coaching?: MesoStatusCoaching
  /** Optional next-session target box. */
  nextTarget?: MesoStatusNextTarget
  className?: string
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/** Marker fill color by gauge zone: teal 0-0.4, amber 0.4-0.7, red 0.7-1.0. */
function getGaugeZoneColor(level: number): string {
  if (level >= 0.7) return ERROR
  if (level >= 0.4) return WARNING
  return SUCCESS
}

/** Splits `text` into nodes, bolding any segment that exactly matches a highlight. */
function renderCoachingText(text: string, highlights?: string[]): ReactNode {
  if (!highlights || highlights.length === 0) return text
  const escaped = highlights
    .filter(Boolean)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (escaped.length === 0) return text
  const regex = new RegExp(`(${escaped.join('|')})`, 'g')
  return text.split(regex).map((part, index) =>
    highlights.includes(part) ? (
      <Text
        key={`${part}-${index}`}
        className="text-text-primary"
        style={{ fontWeight: '700' }}
      >
        {part}
      </Text>
    ) : (
      <Fragment key={`t-${index}`}>{part}</Fragment>
    ),
  )
}

function StatusPill({ badge }: { badge: MesoStatusBadge }) {
  const colors = STATUS_VARIANTS[badge.variant]
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: 5,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
      testID="meso-status-card-badge"
    >
      <View accessibilityElementsHidden>
        <StatusDot variant={badge.variant} size="sm" />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          letterSpacing: 0.3,
          color: colors.text,
        }}
      >
        {badge.label}
      </Text>
    </View>
  )
}

function MetricCell({ metric }: { metric: MesoStatusMetric }) {
  return (
    <View style={{ width: '48%' }} testID="meso-status-card-metric">
      <Text
        className="text-text-tertiary"
        style={{
          fontSize: 10,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {metric.label}
      </Text>
      <Text
        className="text-text-primary"
        style={{
          marginTop: 2,
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
        }}
      >
        {metric.value}
      </Text>
    </View>
  )
}

function Gauge({ gauge }: { gauge: MesoStatusGauge }) {
  const level = clamp01(gauge.level)
  const percentage = Math.round(level * 100)
  const markerColor = getGaugeZoneColor(level)
  return (
    <View
      style={{ gap: 6 }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      accessibilityLabel={`${gauge.label}: ${percentage}%`}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      testID="meso-status-card-gauge"
    >
      <View
        className="flex-row items-center justify-between"
        accessibilityElementsHidden
      >
        <Text
          className="text-text-secondary"
          style={{
            fontSize: 10,
            fontFamily: 'Inter, sans-serif',
            fontWeight: '500',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {gauge.label}
        </Text>
        {gauge.sublabel != null && (
          <Text
            className="text-text-tertiary"
            style={{
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              fontWeight: '500',
            }}
          >
            {gauge.sublabel}
          </Text>
        )}
      </View>

      <View
        style={
          {
            height: 8,
            borderRadius: 4,
            position: 'relative',
            backgroundImage: GAUGE_GRADIENT,
          } as ViewStyle
        }
        accessibilityElementsHidden
      >
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            marginLeft: -0.5,
            backgroundColor: 'rgba(255,255,255,0.3)',
          }}
          testID="meso-status-card-gauge-center"
        />
        <View
          className="border-text-primary"
          style={{
            position: 'absolute',
            left: `${percentage}%`,
            top: -3,
            marginLeft: -7,
            width: 14,
            height: 14,
            borderRadius: 9999,
            borderWidth: 2,
            backgroundColor: markerColor,
            boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          }}
          testID="meso-status-card-gauge-marker"
        />
      </View>
    </View>
  )
}

/**
 * Mesocycle context card for a specific exercise: prescription vs actual
 * metrics, intensity/volume gauges, and coaching guidance. Composes the titan
 * `Card` plus the Workout `StatusDot`, and renders the §25 gauge (8px track,
 * 50% center line, 14px marker) inline since that visual differs from the
 * IntensityBar/DeviationBar primitives.
 *
 * @example
 * <MesoStatusCard
 *   mesoName="Hypertrophy Block"
 *   mesoSubtitle="Week 6 of 8 · Upper/Lower"
 *   statusBadge={{ label: 'On Track', variant: 'success' }}
 *   metrics={[
 *     { label: 'Prescribed', value: '3×8 @ RPE 8' },
 *     { label: 'Actual', value: '3×8 @ 185 lbs' },
 *   ]}
 *   gauges={[{ label: 'Intensity', level: 0.7, sublabel: 'Actual' }]}
 *   coaching={{ text: 'Add load next session.', highlights: ['Add load'] }}
 *   nextTarget={{ icon: '→', text: '190 lbs × 8' }}
 * />
 */
export function MesoStatusCard({
  mesoName,
  mesoSubtitle,
  statusBadge,
  metrics,
  gauges,
  coaching,
  nextTarget,
  className,
  ...props
}: MesoStatusCardProps) {
  return (
    <Card
      variant="outline"
      elevation={1}
      borderColor={BRAND_PRIMARY_DARK}
      className={className}
      style={
        {
          borderColor: BRAND_PRIMARY_DARK,
          borderWidth: 1,
          backgroundImage: CARD_GRADIENT,
        } as ViewStyle
      }
      role="article"
      aria-label={`Mesocycle status for ${mesoName}`}
      testID="meso-status-card"
      {...props}
    >
      <View
        className="flex-row"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 1 }}
        accessibilityElementsHidden
        testID="meso-status-card-accent"
      >
        {ACCENT_STOPS.map((color) => (
          <View key={color} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </View>

      <View style={{ padding: 14, gap: 14 }} testID="meso-status-card-body">
        <View testID="meso-status-card-header">
          <View
            className="flex-row items-center justify-between"
            style={{ gap: 8 }}
          >
            <Text
              className="text-text-primary"
              style={{
                flexShrink: 1,
                fontSize: 15,
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: '700',
              }}
              testID="meso-status-card-name"
            >
              {mesoName}
            </Text>
            <StatusPill badge={statusBadge} />
          </View>
          <Text
            className="text-text-secondary"
            style={{
              marginTop: 4,
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
            }}
            testID="meso-status-card-subtitle"
          >
            {mesoSubtitle}
          </Text>
        </View>

        {metrics.length > 0 && (
          <View
            className="flex-row flex-wrap"
            style={{ gap: 8 }}
            testID="meso-status-card-metrics"
          >
            {metrics.map((metric, index) => (
              <MetricCell key={`${metric.label}-${index}`} metric={metric} />
            ))}
          </View>
        )}

        {gauges.length > 0 && (
          <View style={{ gap: 12 }} testID="meso-status-card-gauges">
            {gauges.map((gauge, index) => (
              <Gauge key={`${gauge.label}-${index}`} gauge={gauge} />
            ))}
          </View>
        )}

        {coaching != null && (
          <View
            style={{
              backgroundColor: 'rgba(255,176,32,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255,176,32,0.15)',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
            testID="meso-status-card-coaching"
          >
            <Text
              className="text-text-secondary"
              style={{
                fontSize: 12,
                lineHeight: 17,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {renderCoachingText(coaching.text, coaching.highlights)}
            </Text>
          </View>
        )}

        {nextTarget != null && (
          <View
            className="flex-row items-center"
            style={{
              gap: 8,
              backgroundColor: 'rgba(20,184,166,0.06)',
              borderWidth: 1,
              borderColor: 'rgba(20,184,166,0.2)',
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
            testID="meso-status-card-next-target"
          >
            <Text style={{ fontSize: 14, color: SUCCESS }} accessibilityElementsHidden>
              {nextTarget.icon}
            </Text>
            <Text
              style={{
                flexShrink: 1,
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                fontWeight: '600',
                color: SUCCESS,
              }}
            >
              {nextTarget.text}
            </Text>
          </View>
        )}
      </View>
    </Card>
  )
}
