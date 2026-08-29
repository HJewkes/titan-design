// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { Card } from '../../ui/card'
import { Metric } from '../Metric'
import { Typography } from '../Typography'
import { Eyebrow } from './Eyebrow'
import { InitiativeCard, type InitiativeCardProps } from './InitiativeCard'

export interface PortfolioOverviewStat {
  value: string
  label: string
}

export interface PortfolioOverviewSection {
  /** Section eyebrow, e.g. "Focused · by rank" or "Backburner". */
  heading: string
  items: InitiativeCardProps[]
}

export interface PortfolioOverviewProps extends ViewProps {
  title: string
  subtitle?: string
  /** KPI tiles rendered above the sections, e.g. Focused / Open tasks / Initiatives. */
  stats: PortfolioOverviewStat[]
  /** Initiative groups, rendered top-to-bottom in the order given. */
  sections: PortfolioOverviewSection[]
  className?: string
}

/**
 * PortfolioOverview — at-a-glance status across every tracked initiative: a
 * KPI row followed by initiative groups (typically Focused, then Backburner).
 * Composes Card / Metric / Eyebrow / {@link InitiativeCard} — presentational
 * only, all data supplied by props.
 *
 * Data plan: the caller is responsible for computing `stats` and `sections`
 * from its own source of truth (e.g. the active-work session-mining export).
 * This component has no fetch/store dependency, so wiring it to a live data
 * source is a caller-side concern — flagged here as the integration's only
 * open gap.
 */
export function PortfolioOverview({
  title,
  subtitle,
  stats,
  sections,
  className,
  ...props
}: PortfolioOverviewProps) {
  return (
    <View className={`gap-5 ${className ?? ''}`} {...props}>
      <View>
        <Typography variant="h4" className="text-text-primary">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" className="text-text-tertiary">
            {subtitle}
          </Typography>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} variant="filled" className="min-w-[150px] flex-1 p-4">
            <Metric value={stat.value} label={stat.label} />
          </Card>
        ))}
      </View>

      {sections.map((section) => (
        <View key={section.heading} className="gap-2.5">
          <Eyebrow>{section.heading}</Eyebrow>
          <View className="flex-row flex-wrap gap-3">
            {section.items.map((item) => (
              <InitiativeCard key={item.slug} {...item} />
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}
