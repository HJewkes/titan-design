import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import { Surface } from '../ui/surface'
import { Pill } from '../ui/pill'
import { Typography } from '../ui/typography'
import { Page, PageHeader } from '../ui/page'
import { BotIcon, BrainIcon, HeadphonesIcon, LayersIcon, StarIcon } from '../icons'
import { AppShell } from './AppShell'
import { brandKeys } from './brands'
import { type SideNavItem } from './SideNav'

const brainNav: SideNavItem[] = [
  { key: 'notes', label: 'Notes', icon: <LayersIcon size={20} color="currentColor" /> },
  { key: 'graph', label: 'Graph', icon: <BrainIcon size={20} color="currentColor" /> },
  { key: 'agents', label: 'Agents', icon: <BotIcon size={20} color="currentColor" /> },
]

const audiobookNav: SideNavItem[] = [
  { key: 'library', label: 'Library', icon: <HeadphonesIcon size={20} color="currentColor" /> },
  { key: 'saved', label: 'Saved', icon: <StarIcon size={20} color="currentColor" /> },
]

function Content({ title }: { title: string }) {
  return (
    <Page
      header={
        <PageHeader
          title={title}
          description="A page mounts its content here; the shell keeps the nav + top-bar chrome persistent."
        />
      }
    />
  )
}

/**
 * `Pages/AppShell` — the generic dashboard chrome as one registered surface.
 * The app supplies its brand, its nav categories and its own top-bar chrome.
 */
const meta: Meta<typeof AppShell> = {
  title: 'Pages/AppShell',
  component: AppShell,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Page shell (generic).** Composes ' +
          '[SideNav](?path=/docs/shell-sidenav--docs) + ' +
          '[TopBar](?path=/docs/shell-topbar--docs) over a `children` content slot.\n\n' +
          '**Composition (AW-132).** It knows nothing about any one app. Chrome arrives ' +
          'through `topBarTrailing`; categories through `navItems`; `topBar` and `nav` ' +
          'replace those regions outright. An app builds its own shell by composing this one ' +
          '— see [WorkoutShell](?path=/docs/pages-workoutshell--docs).\n\n' +
          '**Content padding (TD-795).** The content region is padded `p-gutter-sm` below `md` ' +
          'and `p-gutter-md` from it. `contentPadding="none"` drops it for a child that owns ' +
          'its gutter (a `Page`) or bleeds to the edge; use the viewport toolbar ' +
          'on Default to see 16px below 768px and 24px from it.',
      },
    },
  },
  argTypes: {
    brand: { control: 'select', options: brandKeys },
    contentPadding: { control: 'inline-radio', options: ['default', 'none'] },
    onNavigate: { control: false },
    topBar: { control: false },
    nav: { control: false },
    topBarTrailing: { control: false },
    navItems: { control: false },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen">
        <Story />
      </Surface>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AppShell>

function PaddedBody() {
  return (
    <View className="flex-1 border border-dashed border-border-default">
      <Typography variant="body2" color="primary">
        Content sits one gutter in from the rail and the bar.
      </Typography>
    </View>
  )
}

/** No app chrome at all — the frame on its own. `contentPadding` is the control. */
export const Default: Story = {
  args: { brand: 'voltras', navItems: brainNav, activeKey: 'notes', contentPadding: 'default' },
  render: (args) => (
    <AppShell {...args}>
      <PaddedBody />
    </AppShell>
  ),
}

/** The brain app: its own brand, categories, top-bar chrome and page. */
export const BrainApp: Story = {
  args: {
    brand: 'brain',
    navItems: brainNav,
    activeKey: 'graph',
    topBarTrailing: [
      <Pill key="index" tone="success" leading="dot" size="xs">
        indexed
      </Pill>,
      <Pill key="vaults" tone="neutral" size="xs">
        4 vaults
      </Pill>,
    ],
  },
  render: (args) => (
    <AppShell {...args} contentPadding="none">
      <Content title="Graph" />
    </AppShell>
  ),
}

/** The audiobook app in the same frame — different brand, categories and chrome. */
export const AudiobookApp: Story = {
  args: {
    brand: 'audiobook',
    navItems: audiobookNav,
    activeKey: 'library',
    liveKey: 'saved',
    topBarTrailing: (
      <Pill tone="brand-secondary" leading="dot" size="xs">
        3 downloading
      </Pill>
    ),
  },
  render: (args) => (
    <AppShell {...args} contentPadding="none">
      <Content title="Library" />
    </AppShell>
  ),
}

/** Both slots replaced: the app brings its own bar and its own rail. */
export const ReplacedRegions: Story = {
  args: { brand: 'voltras', navItems: brainNav, activeKey: 'notes' },
  render: (args) => (
    <AppShell
      {...args}
      contentPadding="none"
      topBar={
        <Surface level="elevated" className="h-[46px] justify-center border-b border-hairline px-4">
          <Text className="font-heading text-sm text-text-secondary">an app-owned bar</Text>
        </Surface>
      }
      nav={
        <Surface
          level="base"
          className="w-[60px] items-center justify-center border-r border-hairline"
        >
          <Typography variant="microLabel" color="tertiary">
            rail
          </Typography>
        </Surface>
      }
    >
      <Content title="Anything" />
    </AppShell>
  ),
}
