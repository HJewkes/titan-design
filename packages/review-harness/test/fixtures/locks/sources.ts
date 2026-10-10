import { readFileSync } from 'node:fs'

const UI = 'packages/ui/src/components/ui'
const SHELL = 'packages/ui/src/components/shell'

export const SELECT = `${UI}/select/Select.tsx`
export const ALERT = `${UI}/alert/Alert.tsx`
export const TOAST = `${UI}/toast/Toast.tsx`
export const FRAME = `${SHELL}/Frame.tsx`
export const BADGE = `${UI}/badge/Badge.tsx`
export const UI_EYEBROW = `${UI}/eyebrow/Eyebrow.tsx`
export const SHELL_EYEBROW = `${SHELL}/Eyebrow.tsx`
export const HEADER = `${SHELL}/Header.tsx`
export const CARD = `${UI}/card/Card.tsx`
export const TASK_TABLE = 'packages/ui/src/components/custom/ActiveWork/TaskTable.tsx'

/**
 * A small head tree shaped like the #800 case: Select reads the two moved tokens through class
 * strings with variant prefixes, Card reads one by name through resolveColor, Alert is edited,
 * Toast imports Alert, Frame imports Toast on one line and TaskTable imports it in a wrapped
 * clause. Badge reads look-alike classes only. Two files are both named Eyebrow and only the
 * shell one is imported by Header.
 */
export const sources = (): Map<string, string> =>
  new Map([
    [
      CARD,
      [
        "import { resolveColor } from '../../../theme/resolve-color'",
        "export const Card = () => <View style={{ borderColor: resolveColor('surface-raised') }} />",
      ].join('\n'),
    ],
    [
      TASK_TABLE,
      [
        'import {',
        '  Toast,',
        '  type ToastProps,',
        "} from '../../ui/toast/Toast'",
        'export const TaskTable = () => <Toast />',
      ].join('\n'),
    ],
    [
      SELECT,
      [
        "import { cn } from '../../../utils/cn'",
        "export const Select = () => <Text className={cn('web:hover:bg-surface-raised', open && 'text-text-secondary')}>×</Text>",
      ].join('\n'),
    ],
    [
      ALERT,
      'export const Alert = () => <View className="bg-brand-primary [.light_&]:text-text-primary" />',
    ],
    [TOAST, "import { Alert } from '../alert/Alert'\nexport const Toast = () => <Alert />"],
    [FRAME, "import { Toast } from '../ui/toast/Toast'\nexport const Frame = () => <Toast />"],
    [
      BADGE,
      'export const Badge = () => <View className="text-brand-secondary bg-surface-raised-ish" />',
    ],
    [UI_EYEBROW, 'export const Eyebrow = () => null'],
    [SHELL_EYEBROW, 'export const Eyebrow = () => null'],
    [HEADER, "import { Eyebrow } from './Eyebrow'\nexport const Header = () => <Eyebrow />"],
  ])

export const css = (name: 'base' | 'head') =>
  readFileSync(new URL(`./global.${name}.css`, import.meta.url), 'utf8')
