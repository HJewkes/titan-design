// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
// The pieces BodyweightGoalCard and SessionsGoalCard share: header, figure line and detail tip.
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import {
  EqualIcon,
  InfoIcon,
  RepeatIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type IconProps,
} from '../../icons'
import { Pill } from '../../ui/pill'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger, Tooltip } from '../../ui/tooltip'
import { Metric } from '../Metric'
import { Typography } from '../../ui/typography'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { GOAL_STATUS_LABEL, GOAL_STATUS_TONE, type GoalLiftStatus } from './GoalCard'
import { STATUS_TOKEN } from './GoalTrajectoryPlot'
import type { CaptionLine, WholeBodyDietPhase, WholeBodyScale } from './wholeBody'

/** Tip cards need a width of their own, or an in-flow tip wraps to its trigger's width. */
const TIP_WIDTH = 280

const INFO_ICON_SIZE = 14

/** A goal status as a resolved colour, the same one the goal chart draws its line in. */
export function useStatusColor(status: GoalLiftStatus): string {
  return getSemanticColors(useSurfaceMode())[STATUS_TOKEN[status]]
}

/**
 * One glyph per diet phase, PROPOSED (VW-455 round 4): the owner picks the set.
 * `Lab/Decisions/Diet Phase Icons` renders these and the alternates large.
 */
export const DIET_PHASE_ICON: Record<WholeBodyDietPhase, (props: IconProps) => JSX.Element> = {
  'fat-loss': TrendingDownIcon,
  gain: TrendingUpIcon,
  maintenance: EqualIcon,
  recomposition: RepeatIcon,
  unknown: EqualIcon,
}

/**
 * Below this CONTAINER width the phase tag drops its words and keeps its glyph,
 * with the words one press or hover away. It is the rule
 * `GoalCard`'s `StatusAffordance` already uses for its status pill
 * (`STATUS_COLLAPSE_WIDTH`), measured on the card's own box rather than the
 * viewport (SIZE-D01, container-driven).
 */
export const PHASE_TAG_COLLAPSE_WIDTH = 360

const TAG_ICON_SIZE = 13

/** The phase tag: glyph and words, or the glyph alone with the words in a tip. */
function PhaseTag(props: {
  phase: WholeBodyDietPhase
  text: string
  tipText: string
  collapsed: boolean
  isTipOpen?: boolean
}) {
  const Glyph = DIET_PHASE_ICON[props.phase]
  const icon = <Glyph size={TAG_ICON_SIZE} />
  if (!props.collapsed) {
    return (
      <Pill tone="neutral" variant="outline" size="sm" leading={icon} testID="phase-tag">
        {props.text}
      </Pill>
    )
  }
  const pill = (
    <Pill tone="neutral" variant="outline" size="sm" testID="phase-tag">
      {icon}
    </Pill>
  )
  const label = props.tipText
  if (props.isTipOpen) {
    return (
      <Tooltip isOpen placement="bottom-end" usePortal={false} content={<TipText text={label} />}>
        <Pressable accessibilityRole="button" accessibilityLabel={label} testID="phase-tag-tip">
          {pill}
        </Pressable>
      </Tooltip>
    )
  }
  return (
    <TipTrigger
      label={label}
      content={<TipText text={label} />}
      placement="bottom-end"
      usePortal={false}
      testID="phase-tag-tip"
    >
      {pill}
    </TipTrigger>
  )
}

/** An in-flow tip is laid out against its trigger, so a pill-width box wraps one word a line. */
const TAG_TIP_MAX_WIDTH = 190

/**
 * The tip hugs its words: a one-word phase ("Cut") in a 190 px box covered the
 * figure beside it. An in-flow tip cannot shrink-to-fit past its trigger, so the
 * width is set from the words, at the caption's average glyph advance.
 */
const CAPTION_GLYPH_ADVANCE = 7

function tagTipWidth(text: string): number {
  return Math.min(TAG_TIP_MAX_WIDTH, Math.ceil(text.length * CAPTION_GLYPH_ADVANCE) + 4)
}

function TipText({ text }: { text: string }) {
  return (
    <View style={{ width: tagTipWidth(text) }}>
      <Typography variant="caption" className="leading-normal">
        {text}
      </Typography>
    </View>
  )
}

/** Label, optional tag, and the status furthest right; wraps under the label when narrow. */
export function GoalCardHeader(props: {
  label: string
  /** The diet-phase tag, when the card has one. */
  tag?: { phase: WholeBodyDietPhase; text: string; tipText: string }
  /** True below `PHASE_TAG_COLLAPSE_WIDTH`: the tag keeps its glyph and tips its words. */
  tagCollapsed?: boolean
  /** Pins the tag's tip open, for review frames and tests. */
  isTagTipOpen?: boolean
  status: GoalLiftStatus
  testID: string
}) {
  return (
    <View
      // Above the figure row, which is itself raised over the track: the tag's tip
      // opens downward across both, and a later sibling would otherwise win.
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', zIndex: 20 }}
      className="justify-between gap-x-inline-md gap-y-stack-sm"
      testID={props.testID}
    >
      <Typography variant="overline" color="tertiary">
        {props.label}
      </Typography>
      {/* The tag sits with the status at the right, not beside the label (owner, round 2). */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-sm">
        {props.tag !== undefined && (
          <PhaseTag
            phase={props.tag.phase}
            text={props.tag.text}
            tipText={props.tag.tipText}
            collapsed={props.tagCollapsed === true}
            isTipOpen={props.isTagTipOpen}
          />
        )}
        <Pill tone={GOAL_STATUS_TONE[props.status]} variant="subtle" size="sm" leading="dot">
          {GOAL_STATUS_LABEL[props.status]}
        </Pill>
      </View>
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
 * The row template both cards' bodies use: a fixed track box and a fixed label row
 * under it, per scale. Fixed heights are what make two cards in one grid row line
 * their tracks up and end level, whatever text sits above them (owner, round 2:
 * "ideally the two cards are the same height as one another").
 */
export const TRACK_ROW = {
  wall: { track: 34, labels: 26, font: 13 },
  phone: { track: 22, labels: 20, font: 11 },
} as const

/** One label under the track, placed at its own fraction of the track's width. */
export interface TrackLabel {
  /** 0..1 along the track. */
  fraction: number
  text: string
}

export function CardTrackRow(props: {
  scale: WholeBodyScale
  labels: TrackLabel[]
  children: ReactNode
  testID?: string
}) {
  const row = TRACK_ROW[props.scale]
  return (
    <View style={{ marginTop: 'auto' }} testID={props.testID}>
      <View style={{ height: row.track, justifyContent: 'center' }}>{props.children}</View>
      <View style={{ height: row.labels }}>
        {props.labels.map((label) => (
          <View
            key={`${label.fraction}-${label.text}`}
            style={{
              position: 'absolute',
              left: `${label.fraction * 100}%`,
              transform: [{ translateX: '-50%' }],
            }}
          >
            <Typography
              variant="caption"
              color="tertiary"
              className="leading-normal"
              style={{ fontSize: row.font }}
            >
              {label.text}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  )
}

/**
 * The one text size for the figure's label line: the label under the figure
 * ("Weighed Sep 18") and the lead beside it share it at every width and in every
 * rendering (owner, round 5). `Metric` sizes its own label by the figure's size
 * (14 px at wall scale, 12 px at phone), so the line pins it rather than inherit.
 */
export const FIGURE_LINE_TEXT = 'text-sm'

/** The lead's word, with the colon the owner locked in round 6: "Rate: -0.6%/wk", "Rate: N/A". */
export function leadWord(label: string): string {
  return `${label}:`
}

/** A muted word and its figure, the figure bold and bright: `GoalMilestoneSummary`'s `Fact`. */
function FactCaption(props: { label: string; value: string; testID: string }) {
  return (
    <Typography
      variant="body2"
      color="tertiary"
      align="right"
      className={`${FIGURE_LINE_TEXT} leading-normal`}
      maxLines={1}
      testID={props.testID}
    >
      {`${props.label} `}
      <Typography
        variant="body2"
        color="primary"
        className={`${FIGURE_LINE_TEXT} font-bold leading-normal`}
      >
        {props.value}
      </Typography>
    </Typography>
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
        labelClassName={FIGURE_LINE_TEXT}
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

function LeadText(props: { lead: CaptionLine; testID: string }) {
  const { lead } = props
  if (lead.label && lead.value) {
    return <FactCaption label={leadWord(lead.label)} value={lead.value} testID={props.testID} />
  }
  return (
    <Typography
      variant="body2"
      color="secondary"
      className={`${FIGURE_LINE_TEXT} leading-normal text-right`}
      testID={props.testID}
    >
      {lead.text}
    </Typography>
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
          <LeadText lead={props.lead} testID={props.testID} />
        </View>
      )}
      {props.tip}
    </View>
  )
}
