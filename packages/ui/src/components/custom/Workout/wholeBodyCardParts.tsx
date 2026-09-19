// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// The pieces BodyweightGoalCard and SessionsGoalCard share: header, figure line and detail tip.
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { InfoIcon } from '../../icons'
import { Pill } from '../../ui/pill'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger, Tooltip } from '../../ui/tooltip'
import { Metric } from '../Metric'
import { Typography } from '../Typography'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { GOAL_STATUS_LABEL, GOAL_STATUS_TONE, type GoalLiftStatus } from './GoalCard'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import type { CaptionLine, WholeBodyScale } from './wholeBody'

/** Tip cards need a width of their own, or an in-flow tip wraps to its trigger's width. */
const TIP_WIDTH = 280

const INFO_ICON_SIZE = 14

/** A goal status as a resolved colour, the same one the goal chart draws its line in. */
export function useStatusColor(status: GoalLiftStatus): string {
  return getSemanticColors(useSurfaceMode())[STATUS_TOKEN[status]]
}

/** Label, optional tag, and the status furthest right; wraps under the label when narrow. */
export function GoalCardHeader(props: {
  label: string
  tag?: string
  status: GoalLiftStatus
  testID: string
}) {
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}
      className="justify-between gap-x-inline-md gap-y-stack-sm"
      testID={props.testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        <Typography variant="overline" color="tertiary">
          {props.label}
        </Typography>
        {props.tag !== undefined && (
          <Pill tone="neutral" variant="outline" size="sm">
            {props.tag}
          </Pill>
        )}
      </View>
      <Pill tone={GOAL_STATUS_TONE[props.status]} variant="subtle" size="sm" leading="dot">
        {GOAL_STATUS_LABEL[props.status]}
      </Pill>
    </View>
  )
}

function DetailTipContent({ lines }: { lines: string[] }) {
  return (
    <View className="gap-stack-sm" style={{ width: TIP_WIDTH }}>
      {lines.map((line) => (
        <Typography key={line} variant="caption" className="leading-normal">
          {line}
        </Typography>
      ))}
    </View>
  )
}

/**
 * The info glyph that holds a card's other detail lines. `isOpen` pins it open by
 * state, for review frames and tests: a focus-opened tip closes as soon as a
 * sibling frame takes focus.
 */
function DetailTip(props: { lines: string[]; label: string; isOpen?: boolean; testID: string }) {
  const color = getSemanticColors(useSurfaceMode())['text-tertiary']
  const glyph = <InfoIcon size={INFO_ICON_SIZE} color={color} title={props.label} />
  const content = <DetailTipContent lines={props.lines} />
  if (props.isOpen) {
    return (
      <Tooltip isOpen placement="bottom-end" usePortal={false} content={content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={props.label}
          testID={props.testID}
        >
          {glyph}
        </Pressable>
      </Tooltip>
    )
  }
  return (
    <TipTrigger
      label={props.label}
      content={content}
      placement="bottom-end"
      usePortal={false}
      testID={props.testID}
    >
      {glyph}
    </TipTrigger>
  )
}

/**
 * The main figure with its label, and one caption right-aligned on the label's
 * line. Every other detail line sits in the tip beside that caption.
 */
export function FigureLine(props: {
  scale: WholeBodyScale
  value: string
  unit: string
  label: string
  lead: CaptionLine | null
  rest: CaptionLine[]
  tipLabel: string
  isTipOpen?: boolean
  testID: string
}) {
  const tipLines = props.rest.map((line) => line.text)
  return (
    <View
      // Raised so an open tip paints over the track beneath it: a later sibling
      // wins on paint order whatever the tip's own z-index says (as GoalCard's title row).
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', zIndex: 10 }}
      className="justify-between gap-x-inline-md gap-y-stack-sm"
    >
      <Metric
        size={props.scale === 'wall' ? 'lg' : 'md'}
        value={props.value}
        unit={props.unit}
        label={props.label}
        className="items-start"
        valueClassName="leading-none"
        testID={props.testID}
      />
      <CaptionWithTip
        lead={props.lead}
        tip={
          tipLines.length === 0 ? null : (
            <DetailTip
              lines={tipLines}
              label={props.tipLabel}
              isOpen={props.isTipOpen}
              testID={`${props.testID}-tip`}
            />
          )
        }
        testID={`${props.testID}-caption`}
      />
    </View>
  )
}

function CaptionWithTip(props: { lead: CaptionLine | null; tip: ReactNode; testID: string }) {
  if (props.lead === null && props.tip === null) return null
  return (
    <View
      // `marginLeft: auto` keeps it at the right edge when it wraps under the figure,
      // so the tip, which opens leftward from the glyph, stays inside the card.
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        minWidth: 0,
        marginLeft: 'auto',
      }}
      className="gap-inline-sm"
    >
      {props.lead !== null && (
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            color="secondary"
            className="leading-normal text-right"
            testID={props.testID}
          >
            {props.lead.text}
          </Typography>
        </View>
      )}
      {props.tip}
    </View>
  )
}
