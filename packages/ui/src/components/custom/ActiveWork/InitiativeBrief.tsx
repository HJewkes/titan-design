// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../Typography'
import { MarkdownProse, type ProseLinker } from '../Prose'
import { Eyebrow } from './Eyebrow'

/** An initiative's durable brief, as the reader consumes it. */
export interface InitiativeBriefData {
  slug: string
  title: string
  state: string
  rank?: number | null
  shipTarget?: string | null
  updated: string
  /** The brief's markdown body. */
  body: string
}

/** A brief section: an `##` heading and the prose beneath it, up to the next `##`. */
export interface BriefSection {
  heading: string
  body: string
}

export interface InitiativeBriefProps {
  brief: InitiativeBriefData
  /** Reference patterns to auto-link in the prose. */
  linkers?: ProseLinker[]
  className?: string
}

/**
 * Splits a brief into its `##` sections, dropping the leading `#` title (the
 * header already shows it). Anything before the first `##` becomes a leading
 * section with an empty heading, so a brief with no sections still renders.
 */
export function splitBriefSections(body: string): BriefSection[] {
  const withoutTitle = body.replace(/^\s*#\s+.*(?:\n|$)/, '')
  const sections: BriefSection[] = []
  let current: BriefSection | null = null
  for (const line of withoutTitle.split('\n')) {
    const heading = line.match(/^##\s+(.*)/)
    if (heading) {
      if (current) sections.push(current)
      current = { heading: heading[1]!.trim(), body: '' }
    } else if (current) {
      current.body += `${line}\n`
    } else if (line.trim()) {
      current = { heading: '', body: `${line}\n` }
    }
  }
  if (current) sections.push(current)
  return sections.map((s) => ({ ...s, body: s.body.trim() }))
}

/** A prev/next step control: a glyph in a small pressable, muted when it cannot move. */
function StepButton({
  glyph,
  label,
  disabled,
  onPress,
}: {
  glyph: string
  label: string
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      className={cn(
        'h-6 w-6 items-center justify-center rounded-md',
        disabled ? '' : 'web:hover:bg-interactive-hover active:bg-interactive-active'
      )}
    >
      <Typography
        variant="body2"
        className={cn('leading-none', disabled ? 'text-text-tertiary/40' : 'text-text-secondary')}
      >
        {glyph}
      </Typography>
    </Pressable>
  )
}

function SectionHeading({
  heading,
  open,
  onPress,
}: {
  heading: string
  open: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      testID="brief-section-heading"
      className="flex-row items-center justify-between py-1.5"
    >
      <Typography
        variant="subtitle2"
        className={cn('font-bold', open ? 'text-text-primary' : 'text-text-secondary')}
      >
        {heading}
      </Typography>
      <Typography variant="caption" className="leading-none text-text-tertiary">
        {open ? '▲' : '▼'}
      </Typography>
    </Pressable>
  )
}

/**
 * InitiativeBrief — an initiative's brief prose as a single-open accordion of
 * its `##` sections: click any heading to open it, or step through them with
 * the prev/next controls in the header, which close the current section and
 * open the next. Prose before the first `##` always shows. References
 * auto-link from `linkers`.
 *
 * Composes {@link Eyebrow}, {@link MarkdownProse} and {@link Typography}. Used
 * by the initiative reader.
 */
export function InitiativeBrief({ brief, linkers = [], className }: InitiativeBriefProps) {
  const sections = useMemo(() => splitBriefSections(brief.body), [brief.body])
  const lead = sections.filter((s) => !s.heading)
  const steps = sections.filter((s) => s.heading)
  const [open, setOpen] = useState(0)
  const clamped = Math.min(open, steps.length - 1)
  return (
    <View className={cn('gap-1', className)} testID="initiative-brief">
      <View className="flex-row items-center justify-between">
        <Eyebrow>Brief</Eyebrow>
        {steps.length > 1 ? (
          <View className="flex-row items-center gap-1">
            <Typography variant="caption" className="leading-none text-text-tertiary">
              {`${clamped + 1} / ${steps.length}`}
            </Typography>
            <StepButton
              glyph="‹"
              label="Previous section"
              disabled={clamped <= 0}
              onPress={() => setOpen(clamped - 1)}
            />
            <StepButton
              glyph="›"
              label="Next section"
              disabled={clamped >= steps.length - 1}
              onPress={() => setOpen(clamped + 1)}
            />
          </View>
        ) : null}
      </View>
      {lead.map((section, i) => (
        <MarkdownProse key={`lead-${i}`} body={section.body} linkers={linkers} />
      ))}
      {steps.map((section, i) => (
        <View key={section.heading}>
          <SectionHeading
            heading={section.heading}
            open={i === clamped}
            onPress={() => setOpen(i)}
          />
          {i === clamped ? (
            <View className="pb-1">
              <MarkdownProse body={section.body} linkers={linkers} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}
