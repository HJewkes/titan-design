import { View, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'
import { Typography } from '../custom/Typography'
import { VoltrasMark } from '../icons'

export interface BrandLockupProps extends ViewProps {
  /** The "/ subtitle" that follows the wordmark. Default "wall dashboard". */
  subtitle?: string
  /** Show the subtitle. Hidden at tablet width and below (S1-Q4 responsive). */
  showSubtitle?: boolean
  className?: string
}

/**
 * Product identity lockup for the top bar: ◇ mark + VOLTRAS wordmark + optional
 * subtitle. Composes the VoltrasMark icon + Typography. S1 · BrandLockup.
 */
export function BrandLockup({
  subtitle = 'wall dashboard',
  showSubtitle = true,
  className,
  ...props
}: BrandLockupProps) {
  return (
    <View className={cn('flex-row items-center gap-[7px]', className)} {...props}>
      <View className="text-brand-primary">
        <VoltrasMark size={14} color="currentColor" />
      </View>
      <Typography
        variant="button"
        color="primary"
        className="text-[12px] font-extrabold tracking-[1.5px]"
      >
        VOLTRAS
      </Typography>
      {showSubtitle && subtitle ? (
        <Typography
          variant="button"
          color="tertiary"
          className="text-[10px] font-semibold tracking-[0.4px]"
        >
          / {subtitle}
        </Typography>
      ) : null}
    </View>
  )
}
