import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { View, Text } from 'react-native'
import { ToolbarButton, ToolbarButtonGroup } from './ToolbarButton'

const meta: Meta<typeof ToolbarButton> = {
  title: 'Components/ToolbarButton',
  component: ToolbarButton,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'neumorphic'],
    },
    isActive: {
      control: 'select',
      options: [undefined, true, false],
      description: 'undefined/true = pressed look, false = raised look',
    },
    isDisabled: {
      control: 'boolean',
    },
    showLabel: {
      control: 'boolean',
    },
  },
  decorators: [
    (Story) => (
      <View className="bg-surface-elevated p-6 rounded-lg">
        <Story />
      </View>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ToolbarButton>

// Icon components matching MUI icon sizing (20px for fontSize="small")
// These simulate MUI SvgIcon components at 20x20
const SettingsIcon = ({ color }: { color?: string }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: color || '#D1D1D1', fontSize: 16 }}>⚙</Text>
  </View>
)

const FilterIcon = ({ color }: { color?: string }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: color || '#D1D1D1', fontSize: 16 }}>⏣</Text>
  </View>
)

const ViewIcon = ({ color }: { color?: string }) => (
  <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: color || '#D1D1D1', fontSize: 16 }}>◉</Text>
  </View>
)

export const Default: Story = {
  args: {
    label: 'Settings',
    icon: <SettingsIcon />,
    variant: 'neumorphic',
    showLabel: true,
  },
}

export const ActiveVsInactive: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <View>
        <Text className="text-text-secondary text-xs mb-1">
          isActive=true - sunken/dark look, ORANGE icon, white text
        </Text>
        <ToolbarButton 
          label="Active (orange icon)" 
          icon={<FilterIcon />} 
          isActive={true}
        />
      </View>
      <View>
        <Text className="text-text-secondary text-xs mb-1">
          isActive=undefined - sunken/dark look, white icon (default state)
        </Text>
        <ToolbarButton 
          label="Default (white icon)" 
          icon={<FilterIcon />}
        />
      </View>
      <View>
        <Text className="text-text-secondary text-xs mb-1">
          isActive=false - elevated/light look, gray icon
        </Text>
        <ToolbarButton 
          label="Inactive (gray icon)" 
          icon={<FilterIcon />} 
          isActive={false}
        />
      </View>
    </View>
  ),
}

export const Interactive: Story = {
  render: function Render() {
    const [active, setActive] = useState(false)
    return (
      <View style={{ gap: 16 }}>
        <Text className="text-text-secondary text-xs">
          Click to toggle. When active=true, icon turns orange:
        </Text>
        <ToolbarButton 
          label="Toggle Me" 
          icon={<SettingsIcon />}
          isActive={active}
          onPress={() => setActive(!active)}
        />
        <Text className="text-text-secondary text-xs">
          isActive: {active ? 'true (sunken, orange icon)' : 'false (elevated, gray icon)'}
        </Text>
      </View>
    )
  },
}

export const IconOnly: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-text-secondary text-xs">
        Icon-only buttons. Active button has orange icon:
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ToolbarButton 
          label="Settings" 
          icon={<SettingsIcon />} 
          showLabel={false}
          isActive={false}
        />
        <ToolbarButton 
          label="Filter (active)" 
          icon={<FilterIcon />} 
          showLabel={false} 
          isActive={true}
        />
        <ToolbarButton 
          label="View" 
          icon={<ViewIcon />} 
          showLabel={false}
          isActive={false}
        />
      </View>
    </View>
  ),
}

export const Disabled: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-text-secondary text-xs">
        Disabled buttons use MUI's default dark theme styling.
      </Text>
      <Text className="text-text-secondary text-[11px]">
        Background: rgba(255,255,255,0.12) | No shadows | Colors preserved with opacity
      </Text>
      <Text className="text-text-secondary text-[11px]">
        Note: Orange icon IS shown when isActive=true (matching original XP behavior)
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ToolbarButton 
          label="Disabled Active" 
          icon={<SettingsIcon />} 
          isActive={true}
          isDisabled={true}
        />
        <ToolbarButton 
          label="Disabled Inactive" 
          icon={<SettingsIcon />} 
          isActive={false}
          isDisabled={true}
        />
      </View>
    </View>
  ),
}

export const HoverStates: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-text-secondary text-xs">
        Hover over buttons to see the hover effect (background lightens, shadows removed)
      </Text>
      <Text className="text-text-secondary text-[11px]">
        Active: #3C3C3C → #4C4C4C | Inactive: #6E6E6E → #5D5D5D | Shadows: removed
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ToolbarButton 
          label="Hover Me (Active)" 
          icon={<SettingsIcon />}
          isActive={true}
        />
        <ToolbarButton 
          label="Hover Me (Inactive)" 
          icon={<SettingsIcon />}
          isActive={false}
        />
      </View>
    </View>
  ),
}

export const WithMenu: Story = {
  render: function Render() {
    return (
      <ToolbarButton
        label="View Options"
        icon={<ViewIcon />}
        isActive={false}
        menuContent={
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#fff' }}>Grid View</Text>
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#fff' }}>List View</Text>
            <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#fff' }}>Compact View</Text>
          </View>
        }
      />
    )
  },
}

export const ButtonGroup: Story = {
  render: function Render() {
    const [activeIndex, setActiveIndex] = useState<number | null>(1)
    
    return (
      <View style={{ gap: 16 }}>
        <Text className="text-text-secondary text-xs mb-1">
          Click to select (one active at a time):
        </Text>
        <ToolbarButtonGroup gap="sm">
          <ToolbarButton 
            label="Filter" 
            icon={<FilterIcon />}
            isActive={activeIndex === 0}
            onPress={() => setActiveIndex(activeIndex === 0 ? null : 0)}
          />
          <ToolbarButton 
            label="Settings" 
            icon={<SettingsIcon />}
            isActive={activeIndex === 1}
            onPress={() => setActiveIndex(activeIndex === 1 ? null : 1)}
          />
          <ToolbarButton 
            label="View" 
            icon={<ViewIcon />}
            isActive={activeIndex === 2}
            onPress={() => setActiveIndex(activeIndex === 2 ? null : 2)}
          />
        </ToolbarButtonGroup>
      </View>
    )
  },
}

export const ToolbarExample: Story = {
  render: function Render() {
    const [filterActive, setFilterActive] = useState(true)
    const [settingsActive, setSettingsActive] = useState(false)
    
    return (
      <View>
        <Text className="text-text-secondary text-xs mb-3">
          Typical toolbar usage - filters active, settings inactive:
        </Text>
        <ToolbarButtonGroup gap="sm">
          <ToolbarButton
            label="Filters"
            icon={<FilterIcon />}
            isActive={filterActive}
            onPress={() => setFilterActive(!filterActive)}
          />
          <ToolbarButton
            label="Settings"
            icon={<SettingsIcon />}
            isActive={settingsActive}
            onPress={() => setSettingsActive(!settingsActive)}
          />
          <ToolbarButton
            label="View"
            icon={<ViewIcon />}
            isActive={false}
            menuContent={
              <View style={{ paddingVertical: 8 }}>
                <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#fff' }}>Grid</Text>
                <Text style={{ paddingHorizontal: 16, paddingVertical: 8, color: '#fff' }}>List</Text>
              </View>
            }
          />
        </ToolbarButtonGroup>
      </View>
    )
  },
}

export const CompactMode: Story = {
  render: function Render() {
    const [isCompact, setIsCompact] = useState(false)
    
    return (
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text className="text-text-secondary text-xs">
            Mode: {isCompact ? 'Compact (icon only)' : 'Full (icon + label)'}
          </Text>
          <ToolbarButton
            label="Toggle"
            icon={<ViewIcon />}
            showLabel={false}
            isActive={isCompact}
            onPress={() => setIsCompact(!isCompact)}
          />
        </View>
        <View className="h-px bg-border-default" />
        <ToolbarButtonGroup gap="sm">
          <ToolbarButton
            label="Filter"
            icon={<FilterIcon />}
            showLabel={!isCompact}
            isActive={true}
          />
          <ToolbarButton
            label="Settings"
            icon={<SettingsIcon />}
            showLabel={!isCompact}
            isActive={false}
          />
          <ToolbarButton
            label="View"
            icon={<ViewIcon />}
            showLabel={!isCompact}
            isActive={false}
          />
        </ToolbarButtonGroup>
      </View>
    )
  },
}

export const Variants: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      <View>
        <Text className="text-text-secondary text-xs mb-2">Neumorphic (with 3D inset shadows)</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ToolbarButton label="Inactive" icon={<SettingsIcon />} variant="neumorphic" isActive={false} />
          <ToolbarButton label="Active" icon={<SettingsIcon />} variant="neumorphic" isActive={true} />
        </View>
      </View>
      <View>
        <Text className="text-text-secondary text-xs mb-2">Flat (no shadows)</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ToolbarButton label="Inactive" icon={<SettingsIcon />} variant="default" isActive={false} />
          <ToolbarButton label="Active" icon={<SettingsIcon />} variant="default" isActive={true} />
        </View>
      </View>
    </View>
  ),
}

export const CSSReference: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Text className="text-text-secondary text-xs">
        Computed CSS properties (derived from original SettingsButton):
      </Text>
      <View className="bg-surface-base p-4 rounded-lg">
        <Text className="text-text-secondary text-[11px] font-mono">
          {`/* Button base */
padding: 6px 16px;
border-radius: 4px;
display: flex;
align-items: center;

/* Active (isActive !== false) - sunken look */
background-color: #3C3C3C;
box-shadow: inset -1px -1px 6px #3C3C3C,
            inset 1px 2px 1px #6E6E6E,
            1px 1px 1px #6E6E6E;
color: #FFFFFF;

/* Inactive (isActive === false) - elevated look */
background-color: #6E6E6E;
box-shadow: inset 2px 2px 2px #1F1F1F,
            inset -1px -1px 2px #6E6E6E;
color: #D1D1D1;

/* Text (Typography subtitle2 + bold) */
font-size: 14px;
font-weight: 700;
font-family: Nunito Sans;
line-height: 1.57;

/* Icon */
width: 20px;
height: 20px;
margin-right: 8px; /* when label shown */
color: #FF7900; /* when isActive=true */`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ToolbarButton label="Inactive" icon={<SettingsIcon />} isActive={false} />
        <ToolbarButton label="Active" icon={<SettingsIcon />} isActive={true} />
      </View>
    </View>
  ),
}
