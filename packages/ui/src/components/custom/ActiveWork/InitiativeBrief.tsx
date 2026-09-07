// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { useMemo } from 'react'
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Collapse, CollapseButton, CollapseContent } from '../../ui/collapse'
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

function Section({
  section,
  linkers,
  defaultOpen,
}: {
  section: BriefSection
  linkers: ProseLinker[]
  defaultOpen: boolean
}) {
  if (!section.heading) {
    return <MarkdownProse body={section.body} linkers={linkers} />
  }
  return (
    <Collapse defaultIsOpen={defaultOpen}>
      <CollapseButton className="justify-between px-0 py-1.5">
        <Typography variant="subtitle2" className="font-bold text-text-primary">
          {section.heading}
        </Typography>
      </CollapseButton>
      <CollapseContent className="pb-1">
        <MarkdownProse body={section.body} linkers={linkers} />
      </CollapseContent>
    </Collapse>
  )
}

/**
 * InitiativeBrief — an initiative's brief prose, its `##` sections each a
 * collapsible block with the first open. The prose auto-links whatever the
 * caller's `linkers` describe.
 *
 * Composes {@link Collapse}, {@link Eyebrow}, {@link MarkdownProse} and
 * {@link Typography}. Used by the initiative reader.
 */
export function InitiativeBrief({ brief, linkers = [], className }: InitiativeBriefProps) {
  const sections = useMemo(() => splitBriefSections(brief.body), [brief.body])
  return (
    <View className={cn('gap-1', className)} testID="initiative-brief">
      <Eyebrow>Brief</Eyebrow>
      {sections.map((section, i) => (
        <Section
          key={section.heading || `lead-${i}`}
          section={section}
          linkers={linkers}
          defaultOpen={i === 0}
        />
      ))}
    </View>
  )
}
