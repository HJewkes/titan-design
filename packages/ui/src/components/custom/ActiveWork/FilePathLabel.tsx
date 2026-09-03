// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../Typography'

/** Split a path into its directory prefix (trailing slash kept) and basename. */
export function splitPath(path: string): { dir: string; base: string } {
  const i = path.lastIndexOf('/')
  return i === -1 ? { dir: '', base: path } : { dir: path.slice(0, i + 1), base: path.slice(i + 1) }
}

/** Basename size on the type scale, with the directory one step quieter. */
export type FilePathLabelSize = 'sm' | 'md'

const SIZE_CLASS: Record<FilePathLabelSize, { base: string; dir: string }> = {
  sm: { base: 'text-xs', dir: 'text-xs' },
  md: { base: 'text-sm', dir: 'text-xs' },
}

export interface FilePathLabelProps extends ViewProps {
  /** A repo-relative path, e.g. `src/commands/open.ts`. */
  path: string
  /** `md` for standalone rows, `sm` for dense contexts like chips. */
  size?: FilePathLabelSize
  /** Render only the basename, dropping the directory prefix. */
  baseOnly?: boolean
  className?: string
}

/**
 * FilePathLabel — a file path with the directory dimmed and the basename bright.
 *
 * In a list of paths the basename is the identifier and the directory is
 * disambiguation, so they get different weight rather than one flat string. The
 * directory shrinks first under width pressure; the basename never truncates.
 */
export function FilePathLabel({
  path,
  size = 'md',
  baseOnly = false,
  className,
  ...props
}: FilePathLabelProps) {
  const { dir, base } = splitPath(path)
  const cls = SIZE_CLASS[size]

  return (
    <View className={cn('flex-row items-center', className)} {...props}>
      {dir && !baseOnly ? (
        <Typography
          variant="mono"
          numberOfLines={1}
          className={cn('shrink text-text-tertiary', cls.dir)}
        >
          {dir}
        </Typography>
      ) : null}
      <Typography variant="mono" className={cn('text-text-primary', cls.base)}>
        {base}
      </Typography>
    </View>
  )
}
