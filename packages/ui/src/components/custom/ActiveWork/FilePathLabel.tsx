// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Typography } from '../Typography'

/** Split a path into its directory prefix (trailing slash kept) and basename. */
export function splitPath(path: string): { dir: string; base: string } {
  const i = path.lastIndexOf('/')
  return i === -1 ? { dir: '', base: path } : { dir: path.slice(0, i + 1), base: path.slice(i + 1) }
}

export interface FilePathLabelProps extends ViewProps {
  /** A repo-relative path, e.g. `src/commands/open.ts`. */
  path: string
  /** Font size of the basename in px; the directory renders 1.5px smaller. */
  size?: number
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
  size = 12,
  baseOnly = false,
  className,
  ...props
}: FilePathLabelProps) {
  const { dir, base } = splitPath(path)

  return (
    <View className={cn('flex-row items-center', className)} {...props}>
      {dir && !baseOnly ? (
        <Typography
          variant="mono"
          numberOfLines={1}
          style={{ fontSize: size - 1.5 }}
          className="shrink text-text-tertiary"
        >
          {dir}
        </Typography>
      ) : null}
      <Typography variant="mono" style={{ fontSize: size }} className="text-text-primary">
        {base}
      </Typography>
    </View>
  )
}
