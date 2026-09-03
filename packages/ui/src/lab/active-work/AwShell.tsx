/**
 * AwShell — a lightweight active-work dashboard frame for the Lab specimens: a
 * labeled left nav rail + a titled, scrolling content region. Presentational
 * (the specimens set `active`); read-only. Composes titan primitives only.
 */
import type { ReactNode } from 'react'
import { View, ScrollView, Pressable } from 'react-native'
import { cn } from '../../utils/cn'
import { Typography } from '../../components/custom/Typography'
import { Indicator } from '../../components/ui/indicator'
import {
  ActivityIcon,
  LayersIcon,
  HistoryIcon,
  AwardIcon,
  ScaleIcon,
} from '../../components/icons'

export type AwNavKey = 'overview' | 'tasks' | 'sessions' | 'initiative' | 'files'

const NAV: { key: AwNavKey; label: string; Icon: typeof ActivityIcon }[] = [
  { key: 'overview', label: 'Overview', Icon: ActivityIcon },
  { key: 'tasks', label: 'Tasks', Icon: LayersIcon },
  { key: 'sessions', label: 'Sessions', Icon: HistoryIcon },
  { key: 'initiative', label: 'Initiative', Icon: AwardIcon },
  { key: 'files', label: 'Files', Icon: ScaleIcon },
]

function NavRow({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  const { Icon, label } = item
  const color = active ? 'text-brand-primary' : 'text-text-tertiary'
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      className={cn(
        'relative h-[38px] flex-row items-center gap-[11px] rounded-[9px] pl-[14px] pr-[10px]',
        active ? 'bg-surface-raised' : '',
      )}
    >
      {active ? (
        <View
          testID="aw-nav-accent"
          className="absolute left-0 top-[9px] bottom-[9px] w-[3px] rounded-r-[3px] bg-brand-primary"
        />
      ) : null}
      <View className={color}>
        <Icon size={17} />
      </View>
      <Typography
        variant="button"
        color="inherit"
        className={cn('text-[13px] font-semibold tracking-[0.1px]', color)}
      >
        {label}
      </Typography>
    </Pressable>
  )
}

export interface AwShellProps {
  active: AwNavKey
  title: string
  subtitle?: string
  /** Right-aligned header slot (e.g. filters, counts). */
  headerRight?: ReactNode
  children: ReactNode
}

export function AwShell({ active, title, subtitle, headerRight, children }: AwShellProps) {
  return (
    <View className="min-h-screen flex-row bg-background-base">
      {/* Rail */}
      <View className="w-[214px] border-r border-border-prominent bg-surface-base">
        <View className="h-[54px] justify-center border-b border-border-subtle px-[16px]">
          <Typography variant="subtitle2" className="text-[15px] font-bold text-text-primary">
            active-work
          </Typography>
          <Typography variant="caption" className="text-[10.5px] text-text-tertiary">
            read-only dashboard
          </Typography>
        </View>
        <View className="gap-[3px] p-[10px]">
          {NAV.map((item) => (
            <NavRow key={item.key} item={item} active={item.key === active} />
          ))}
        </View>
        <View className="mt-auto flex-row items-center gap-[7px] border-t border-border-subtle px-[16px] py-[12px]">
          <Indicator size="sm" color="live" pulse="opacity" />
          <Typography variant="caption" className="text-[11px] text-text-tertiary">
            live · watching root
          </Typography>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="h-[54px] flex-row items-center justify-between border-b border-border-prominent px-[24px]">
          <View className="flex-row items-baseline gap-[10px]">
            <Typography variant="h5" className="text-[17px] font-bold text-text-primary">
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" className="text-[13px] text-text-tertiary">
                {subtitle}
              </Typography>
            ) : null}
          </View>
          {headerRight ?? null}
        </View>
        <ScrollView className="flex-1">
          <View className="gap-[18px] p-[24px]">{children}</View>
        </ScrollView>
      </View>
    </View>
  )
}
