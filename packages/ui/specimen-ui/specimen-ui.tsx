import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Text, View } from 'react-native'
import '../src/theme/global.css'

import { StepProgress, Step } from '../src/components/ui/step-progress'
import { StatusPill, StatusPillContent } from '../src/components/ui/status-pill'
import { Tooltip } from '../src/components/ui/tooltip'
import { Select } from '../src/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '../src/components/ui/popover'
import { Card, CardHeader, CardTitle, CardContent } from '../src/components/ui/card'
import { AudioPlayer } from '../src/components/ui/audio-player'
import {
  AppBar,
  AppBarBrand,
  AppBarNav,
  AppBarActions,
  AppBarSubHeader,
} from '../src/components/ui/app-bar'
import { DataTable } from '../src/components/ui/data-table'
import type { Column } from '../src/components/ui/data-table'
import { ToastProviderV2, useToastV2 } from '../src/components/ui/toast'

/* ─── Layout helpers ─── */

const sections = [
  { id: 'step-progress', label: '1. StepProgress' },
  { id: 'status-pill', label: '2. StatusPill' },
  { id: 'tooltip', label: '3. Tooltip' },
  { id: 'select', label: '4. Select' },
  { id: 'popover', label: '5. Popover' },
  { id: 'card', label: '6. Card' },
  { id: 'audio-player', label: '7. AudioPlayer' },
  { id: 'app-bar', label: '8. AppBar' },
  { id: 'data-table', label: '9. DataTable' },
  { id: 'toast', label: '10. ToastProvider' },
]

function VariantLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'block',
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: '#6B7280',
      marginBottom: 8,
      fontFamily: 'Nunito Sans, sans-serif',
    }}>
      {children}
    </span>
  )
}

function Variant({ label, children, style }: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: '#191919',
      border: '1px solid #1F1F1F',
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: 120,
      ...style,
    }}>
      <VariantLabel>{label}</VariantLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  )
}

function VariantColumn({ label, children, style }: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      background: '#191919',
      border: '1px solid #1F1F1F',
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: 120,
      ...style,
    }}>
      <VariantLabel>{label}</VariantLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {children}
      </div>
    </div>
  )
}

function Section({ id, title, desc, children }: {
  id: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 20 }}>
      <h2 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: '#F3F4F6',
        marginBottom: 4,
      }}>{title}</h2>
      <p style={{
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 16,
      }}>{desc}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        {children}
      </div>
    </section>
  )
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #1F1F1F', margin: '0 0 48px' }} />
}

/* ─── Sidebar ─── */

function Sidebar({ activeId }: { activeId: string }) {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      width: 220,
      height: '100vh',
      overflowY: 'auto',
      background: '#191919',
      borderRight: '1px solid #1F1F1F',
      padding: '20px 0',
      flexShrink: 0,
    }}>
      <h1 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 16,
        fontWeight: 700,
        color: '#FF7900',
        padding: '0 16px 12px',
        borderBottom: '1px solid #1F1F1F',
        marginBottom: 8,
      }}>UI Components</h1>
      <div style={{
        fontSize: 10,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        padding: '12px 16px 4px',
        fontFamily: 'Nunito Sans, sans-serif',
      }}>Components (10)</div>
      {sections.map((s) => {
        const isActive = activeId === s.id
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            style={{
              display: 'block',
              padding: '6px 16px',
              color: isActive ? '#FF7900' : '#9CA3AF',
              textDecoration: 'none',
              fontSize: 12,
              fontFamily: 'Nunito Sans, sans-serif',
              borderLeft: `2px solid ${isActive ? '#FF7900' : 'transparent'}`,
              background: isActive ? 'rgba(255, 121, 0, 0.12)' : 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
          >{s.label}</a>
        )
      })}
    </nav>
  )
}

/* ─── Toast demo (needs to be inside provider) ─── */

function ToastDemoButtons() {
  const toast = useToastV2()

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={() => toast.show({ title: 'Information', description: 'This is an info toast.', variant: 'info' })}
        style={btnStyle('#3B82F6')}
      >Info</button>
      <button
        onClick={() => toast.show({ title: 'Success', description: 'Operation completed.', variant: 'success' })}
        style={btnStyle('#22C55E')}
      >Success</button>
      <button
        onClick={() => toast.show({ title: 'Warning', description: 'Please check your input.', variant: 'warning' })}
        style={btnStyle('#EAB308')}
      >Warning</button>
      <button
        onClick={() => toast.show({ title: 'Error', description: 'Something went wrong.', variant: 'error' })}
        style={btnStyle('#EF4444')}
      >Error</button>
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    background: color,
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito Sans, sans-serif',
    padding: '6px 16px',
    cursor: 'pointer',
  }
}

/* ─── Sample data ─── */

const selectOptions = [
  { value: 'bench', label: 'Bench Press' },
  { value: 'squat', label: 'Back Squat' },
  { value: 'deadlift', label: 'Deadlift' },
  { value: 'ohp', label: 'Overhead Press' },
  { value: 'row', label: 'Barbell Row' },
]

interface TableRow {
  id: string
  exercise: string
  sets: number
  reps: string
  weight: string
  rpe: number
}

const tableData: TableRow[] = [
  { id: '1', exercise: 'Bench Press', sets: 4, reps: '8-10', weight: '185 lb', rpe: 8 },
  { id: '2', exercise: 'Incline DB Press', sets: 3, reps: '10-12', weight: '65 lb', rpe: 7 },
  { id: '3', exercise: 'Cable Fly', sets: 3, reps: '12-15', weight: '30 lb', rpe: 7 },
  { id: '4', exercise: 'Tricep Pushdown', sets: 3, reps: '12-15', weight: '50 lb', rpe: 8 },
  { id: '5', exercise: 'Lateral Raise', sets: 3, reps: '15-20', weight: '20 lb', rpe: 6 },
]

const tableColumns: Column<TableRow>[] = [
  { id: 'exercise', header: 'Exercise', width: '2fr', cell: (row) => row.exercise },
  { id: 'sets', header: 'Sets', width: '80px', align: 'center', cell: (row) => String(row.sets) },
  { id: 'reps', header: 'Reps', width: '100px', align: 'center', cell: (row) => row.reps },
  { id: 'weight', header: 'Weight', width: '120px', align: 'end', cell: (row) => row.weight },
  { id: 'rpe', header: 'RPE', width: '80px', align: 'center', cell: (row) => String(row.rpe) },
]

const alignedColumns: Column<TableRow>[] = [
  { id: 'exercise', header: 'Exercise', width: '2fr', align: 'start', cell: (row) => row.exercise },
  { id: 'reps', header: 'Reps', width: '100px', align: 'center', cell: (row) => row.reps },
  { id: 'weight', header: 'Weight', width: '120px', align: 'end', cell: (row) => row.weight },
]

/* ─── Main App ─── */

function App() {
  const [activeId, setActiveId] = useState(sections[0].id)
  const [selectValue, setSelectValue] = useState<string | null>(null)
  const [selectFilled, setSelectFilled] = useState<string | null>('squat')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <ToastProviderV2 position="top-right" maxToasts={5}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar activeId={activeId} />
        <div style={{ flex: 1, padding: '32px 40px', maxWidth: 960 }}>
          {/* Header */}
          <div style={{ marginBottom: 40, borderBottom: '1px solid #1F1F1F', paddingBottom: 20 }}>
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 4,
            }}>UI Components</h1>
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>
              Live React components from <code style={{ color: '#FF9630' }}>@titan-design/react-ui</code>. All 10 UI components rendered with real props.
            </p>
          </div>

          {/* 1. StepProgress */}
          <Section id="step-progress" title="StepProgress" desc="Multi-step progress indicator with circular rings and connectors.">
            <Variant label="Default (all pending)" style={{ minWidth: 340 }}>
              <StepProgress>
                <Step label="1" value={0} />
                <Step label="2" value={0} />
                <Step label="3" value={0} />
                <Step label="4" value={0} />
              </StepProgress>
            </Variant>
            <Variant label="Mixed progress" style={{ minWidth: 340 }}>
              <StepProgress>
                <Step label="1" value={100} isComplete />
                <Step label="2" value={60} isActive />
                <Step label="3" value={0} isLocked />
                <Step label="4" value={0} isLocked />
              </StepProgress>
            </Variant>
            <Variant label="All complete" style={{ minWidth: 340 }}>
              <StepProgress>
                <Step label="1" value={100} isComplete />
                <Step label="2" value={100} isComplete />
                <Step label="3" value={100} isComplete />
                <Step label="4" value={100} isComplete />
              </StepProgress>
            </Variant>
            <Variant label="Compact mode" style={{ minWidth: 260 }}>
              <StepProgress compact>
                <Step label="1" value={100} isComplete />
                <Step label="2" value={100} isComplete />
                <Step label="3" value={45} isActive />
                <Step label="4" value={0} isLocked />
              </StepProgress>
            </Variant>
            <Variant label="With click handlers (interactive)" style={{ minWidth: 340 }}>
              <StepProgress>
                <Step label="1" value={100} isComplete onClick={() => alert('Step 1 clicked')} />
                <Step label="2" value={60} isActive onClick={() => alert('Step 2 clicked')} />
                <Step label="3" value={0} onClick={() => alert('Step 3 clicked')} />
                <Step label="4" value={0} isLocked />
              </StepProgress>
            </Variant>
            <Variant label="Download mode" style={{ minWidth: 300 }}>
              <StepProgress>
                <Step label="D" value={80} isActive tooltip="Downloading..." />
                <Step label="2" value={0} isLocked />
                <Step label="3" value={0} isLocked />
              </StepProgress>
            </Variant>
          </Section>
          <Divider />

          {/* 2. StatusPill */}
          <Section id="status-pill" title="StatusPill" desc="Compact pill-shaped status indicator with progress ring, text, and optional hover dropdown.">
            <Variant label="Idle (no progress)" style={{ minWidth: 200 }}>
              <StatusPill progress={0} label="Idle" status="idle" />
            </Variant>
            <Variant label='Active (65%, "Processing")' style={{ minWidth: 220 }}>
              <StatusPill progress={65} label="Processing" detail="142/220" status="active" />
            </Variant>
            <Variant label='Success (100%, "Complete")' style={{ minWidth: 200 }}>
              <StatusPill progress={100} label="Complete" status="success" />
            </Variant>
            <Variant label="Error status" style={{ minWidth: 200 }}>
              <StatusPill progress={35} label="Failed" detail="Error at step 3" status="error" />
            </Variant>
            <Variant label="With detail text" style={{ minWidth: 220 }}>
              <StatusPill progress={80} label="Uploading" detail="4/5 files" status="active" />
            </Variant>
            <Variant label="With dropdown content" style={{ minWidth: 240 }}>
              <StatusPill progress={100} label="Complete" detail="5/5" status="success">
                <StatusPillContent>
                  <div style={{ color: '#9CA3AF', fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: '#F3F4F6', marginBottom: 4 }}>Job Summary</div>
                    <div>Processed: 5 files</div>
                    <div>Duration: 2m 34s</div>
                    <div>Status: All passed</div>
                  </div>
                </StatusPillContent>
              </StatusPill>
            </Variant>
          </Section>
          <Divider />

          {/* 3. Tooltip */}
          <Section id="tooltip" title="Tooltip" desc="Hover/press tooltip with placement options, arrows, rich content, and portal mode.">
            <Variant label="All 4 placements" style={{ minWidth: 420 }}>
              <div style={{ display: 'flex', gap: 24, padding: '24px 0' }}>
                {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
                  <Tooltip key={p} label={`Tooltip ${p}`} placement={p}>
                    <View className="bg-surface-elevated px-3 py-1.5 rounded border border-border">
                      <Text className="text-text-primary text-sm">{p}</Text>
                    </View>
                  </Tooltip>
                ))}
              </div>
            </Variant>
            <Variant label="Rich content (ReactNode)" style={{ minWidth: 200 }}>
              <Tooltip
                content={
                  <View>
                    <Text className="text-white text-sm font-semibold">Rich tooltip</Text>
                    <Text className="text-gray-400 text-xs">With multiple lines of detail content.</Text>
                  </View>
                }
              >
                <View className="bg-surface-elevated px-3 py-1.5 rounded border border-border">
                  <Text className="text-text-primary text-sm">Hover for rich content</Text>
                </View>
              </Tooltip>
            </Variant>
            <Variant label="With arrow vs without arrow" style={{ minWidth: 300 }}>
              <div style={{ display: 'flex', gap: 16, padding: '16px 0' }}>
                <Tooltip label="Has arrow" hasArrow placement="top">
                  <View className="bg-surface-elevated px-3 py-1.5 rounded border border-border">
                    <Text className="text-text-primary text-sm">Arrow</Text>
                  </View>
                </Tooltip>
                <Tooltip label="No arrow" hasArrow={false} placement="top">
                  <View className="bg-surface-elevated px-3 py-1.5 rounded border border-border">
                    <Text className="text-text-primary text-sm">No arrow</Text>
                  </View>
                </Tooltip>
              </div>
            </Variant>
            <Variant label="Portal mode (inside overflow:hidden)" style={{ minWidth: 300 }}>
              <div style={{ overflow: 'hidden', border: '1px dashed #6B7280', borderRadius: 4, padding: 16 }}>
                <VariantLabel>overflow: hidden container</VariantLabel>
                <Tooltip label="I escape overflow:hidden via portal!" usePortal placement="top">
                  <View className="bg-surface-elevated px-3 py-1.5 rounded border border-border">
                    <Text className="text-text-primary text-sm">Hover me (portal)</Text>
                  </View>
                </Tooltip>
              </div>
            </Variant>
            <Variant label="With open delay (300ms)" style={{ minWidth: 200 }}>
              <Tooltip label="Delayed tooltip" openDelay={300} placement="top">
                <View className="bg-surface-elevated px-3 py-1.5 rounded border border-border">
                  <Text className="text-text-primary text-sm">300ms delay</Text>
                </View>
              </Tooltip>
            </Variant>
          </Section>
          <Divider />

          {/* 4. Select */}
          <Section id="select" title="Select" desc="Single/multi-select dropdown with default and filled visual variants.">
            <VariantColumn label="Default variant" style={{ minWidth: 240 }}>
              <Select
                options={selectOptions}
                value={selectValue}
                onChange={setSelectValue}
                placeholder="Choose exercise..."
              />
            </VariantColumn>
            <VariantColumn label="Filled variant" style={{ minWidth: 240 }}>
              <Select
                options={selectOptions}
                value={selectFilled}
                onChange={setSelectFilled}
                variant="filled"
              />
            </VariantColumn>
            <VariantColumn label="With placeholder" style={{ minWidth: 240 }}>
              <Select
                options={selectOptions}
                value={null}
                onChange={() => {}}
                placeholder="Pick one..."
              />
            </VariantColumn>
            <VariantColumn label="With selected value" style={{ minWidth: 240 }}>
              <Select
                options={selectOptions}
                value="deadlift"
                onChange={() => {}}
              />
            </VariantColumn>
            <VariantColumn label="Disabled" style={{ minWidth: 240 }}>
              <Select
                options={selectOptions}
                value="bench"
                onChange={() => {}}
                isDisabled
              />
            </VariantColumn>
            <VariantColumn label="Invalid / error state" style={{ minWidth: 240 }}>
              <Select
                options={selectOptions}
                value={null}
                onChange={() => {}}
                placeholder="Required field"
                isInvalid
              />
            </VariantColumn>
          </Section>
          <Divider />

          {/* 5. Popover */}
          <Section id="popover" title="Popover" desc="Floating content panel with click and hover trigger modes.">
            <Variant label="Click mode (default)" style={{ minWidth: 200 }}>
              <Popover placement="bottom">
                <PopoverTrigger>
                  <View className="bg-brand-primary px-4 py-2 rounded">
                    <Text className="text-white text-sm font-medium">Click me</Text>
                  </View>
                </PopoverTrigger>
                <PopoverContent>
                  <Text className="text-text-primary text-sm">Popover content on click.</Text>
                </PopoverContent>
              </Popover>
            </Variant>
            <Variant label="Hover mode (default delay)" style={{ minWidth: 200 }}>
              <Popover triggerMode="hover" placement="bottom">
                <PopoverTrigger>
                  <View className="bg-surface-elevated px-4 py-2 rounded border border-border">
                    <Text className="text-text-primary text-sm">Hover me</Text>
                  </View>
                </PopoverTrigger>
                <PopoverContent>
                  <Text className="text-text-primary text-sm">Hover popover with default 150ms close delay.</Text>
                </PopoverContent>
              </Popover>
            </Variant>
            <Variant label="Hover mode (500ms close delay)" style={{ minWidth: 220 }}>
              <Popover triggerMode="hover" closeDelay={500} placement="bottom">
                <PopoverTrigger>
                  <View className="bg-surface-elevated px-4 py-2 rounded border border-border">
                    <Text className="text-text-primary text-sm">Hover (500ms)</Text>
                  </View>
                </PopoverTrigger>
                <PopoverContent>
                  <Text className="text-text-primary text-sm">Stays open 500ms after leaving.</Text>
                </PopoverContent>
              </Popover>
            </Variant>
            <Variant label="Placements" style={{ minWidth: 420 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
                  <Popover key={p} placement={p}>
                    <PopoverTrigger>
                      <View className="bg-surface-elevated px-3 py-1.5 rounded border border-border">
                        <Text className="text-text-primary text-xs">{p}</Text>
                      </View>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Text className="text-text-primary text-sm">Placed {p}</Text>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </Variant>
          </Section>
          <Divider />

          {/* 6. Card */}
          <Section id="card" title="Card" desc="Content container with elevation, variant, and interactive states.">
            <Variant label="Elevated e1" style={{ minWidth: 200 }}>
              <Card variant="elevated" elevation={1} style={{ width: 200 }}>
                <CardHeader><CardTitle>Elevation 1</CardTitle></CardHeader>
                <CardContent><Text className="text-text-secondary text-sm">Subtle shadow</Text></CardContent>
              </Card>
            </Variant>
            <Variant label="Elevated e2" style={{ minWidth: 200 }}>
              <Card variant="elevated" elevation={2} style={{ width: 200 }}>
                <CardHeader><CardTitle>Elevation 2</CardTitle></CardHeader>
                <CardContent><Text className="text-text-secondary text-sm">Standard shadow</Text></CardContent>
              </Card>
            </Variant>
            <Variant label="Elevated e3" style={{ minWidth: 200 }}>
              <Card variant="elevated" elevation={3} style={{ width: 200 }}>
                <CardHeader><CardTitle>Elevation 3</CardTitle></CardHeader>
                <CardContent><Text className="text-text-secondary text-sm">Prominent shadow</Text></CardContent>
              </Card>
            </Variant>
            <Variant label="Outline variant" style={{ minWidth: 200 }}>
              <Card variant="outline" style={{ width: 200 }}>
                <CardHeader><CardTitle>Outline</CardTitle></CardHeader>
                <CardContent><Text className="text-text-secondary text-sm">Strong border, no shadow</Text></CardContent>
              </Card>
            </Variant>
            <Variant label="Filled variant" style={{ minWidth: 200 }}>
              <Card variant="filled" style={{ width: 200 }}>
                <CardHeader><CardTitle>Filled</CardTitle></CardHeader>
                <CardContent><Text className="text-text-secondary text-sm">Elevated surface fill</Text></CardContent>
              </Card>
            </Variant>
            <Variant label="Interactive / hoverable" style={{ minWidth: 200 }}>
              <Card variant="elevated" elevation={2} isInteractive onPress={() => alert('Card pressed')} style={{ width: 200 }}>
                <CardHeader><CardTitle>Click me</CardTitle></CardHeader>
                <CardContent><Text className="text-text-secondary text-sm">Hover to lift</Text></CardContent>
              </Card>
            </Variant>
            <Variant label="Overflow content (borderRadius fix)" style={{ minWidth: 220 }}>
              <Card variant="elevated" elevation={2} style={{ width: 220 }}>
                <div style={{ height: 60, background: 'linear-gradient(135deg, #FF7900, #FF3D00)', width: '100%' }} />
                <CardContent>
                  <Text className="text-text-secondary text-sm">Image above should clip to card border radius.</Text>
                </CardContent>
              </Card>
            </Variant>
          </Section>
          <Divider />

          {/* 7. AudioPlayer */}
          <Section id="audio-player" title="AudioPlayer" desc="Audio playback component with play/pause, seek bar, and time display.">
            <VariantColumn label="Default variant" style={{ minWidth: 360 }}>
              <AudioPlayer src="" />
            </VariantColumn>
            <VariantColumn label="Compact variant" style={{ minWidth: 360 }}>
              <AudioPlayer src="" variant="compact" title="Episode 12 -- Periodization" />
            </VariantColumn>
            <VariantColumn label="With title" style={{ minWidth: 360 }}>
              <AudioPlayer src="" title="Training Block Overview" />
            </VariantColumn>
            <VariantColumn label="Another compact" style={{ minWidth: 360 }}>
              <AudioPlayer src="" variant="compact" title="Rest day notes" />
            </VariantColumn>
          </Section>
          <Divider />

          {/* 8. AppBar */}
          <Section id="app-bar" title="AppBar" desc="Top-level navigation bar with glass, solid, and transparent variants.">
            <VariantColumn label="Glass variant with brand + actions" style={{ minWidth: 600 }}>
              <AppBar variant="glass" position="static">
                <AppBarBrand>
                  <Text className="text-brand-primary font-heading text-lg font-bold">Titan</Text>
                </AppBarBrand>
                <AppBarActions>
                  <View className="bg-surface-elevated px-3 py-1 rounded border border-border">
                    <Text className="text-text-secondary text-sm">Profile</Text>
                  </View>
                </AppBarActions>
              </AppBar>
            </VariantColumn>
            <VariantColumn label="Solid variant" style={{ minWidth: 600 }}>
              <AppBar variant="solid" position="static">
                <AppBarBrand>
                  <Text className="text-text-primary font-heading text-lg font-bold">Dashboard</Text>
                </AppBarBrand>
                <AppBarActions>
                  <View className="bg-brand-primary px-3 py-1 rounded">
                    <Text className="text-white text-sm">New</Text>
                  </View>
                </AppBarActions>
              </AppBar>
            </VariantColumn>
            <VariantColumn label="Transparent variant" style={{ minWidth: 600 }}>
              <AppBar variant="transparent" position="static">
                <AppBarBrand>
                  <Text className="text-text-primary font-heading text-lg font-bold">Landing</Text>
                </AppBarBrand>
                <AppBarNav>
                  <Text className="text-text-secondary text-sm">Features</Text>
                  <Text className="text-text-secondary text-sm">Pricing</Text>
                  <Text className="text-text-secondary text-sm">Docs</Text>
                </AppBarNav>
                <AppBarActions>
                  <Text className="text-brand-primary text-sm font-medium">Sign In</Text>
                </AppBarActions>
              </AppBar>
            </VariantColumn>
            <VariantColumn label="With nav items" style={{ minWidth: 600 }}>
              <AppBar variant="solid" position="static">
                <AppBarBrand>
                  <Text className="text-brand-primary font-heading text-lg font-bold">Titan</Text>
                </AppBarBrand>
                <AppBarNav>
                  <Text className="text-text-primary text-sm font-medium">Programs</Text>
                  <Text className="text-text-secondary text-sm">Analytics</Text>
                  <Text className="text-text-secondary text-sm">Settings</Text>
                </AppBarNav>
                <AppBarActions>
                  <View className="w-8 h-8 rounded-full bg-brand-primary items-center justify-center">
                    <Text className="text-white text-xs font-bold">HJ</Text>
                  </View>
                </AppBarActions>
              </AppBar>
            </VariantColumn>
            <VariantColumn label="With sub-header" style={{ minWidth: 600 }}>
              <div>
                <AppBar variant="solid" position="static">
                  <AppBarBrand>
                    <Text className="text-brand-primary font-heading text-lg font-bold">Titan</Text>
                  </AppBarBrand>
                  <AppBarActions>
                    <Text className="text-text-secondary text-sm">Settings</Text>
                  </AppBarActions>
                </AppBar>
                <AppBarSubHeader>
                  <Text className="text-text-secondary text-xs">Week 3 of 8 -- Upper/Lower Split</Text>
                </AppBarSubHeader>
              </div>
            </VariantColumn>
            <VariantColumn label="Sizes: sm / md / lg" style={{ minWidth: 600 }}>
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <div key={size} style={{ marginBottom: 8 }}>
                  <VariantLabel>{size}</VariantLabel>
                  <AppBar variant="solid" position="static" size={size}>
                    <AppBarBrand>
                      <Text className="text-text-primary font-heading font-bold">{size.toUpperCase()}</Text>
                    </AppBarBrand>
                    <AppBarActions>
                      <Text className="text-text-secondary text-xs">Action</Text>
                    </AppBarActions>
                  </AppBar>
                </div>
              ))}
            </VariantColumn>
          </Section>
          <Divider />

          {/* 9. DataTable */}
          <Section id="data-table" title="DataTable" desc="Grid-based tabular data display with typed columns, sticky header, and row interactions.">
            <VariantColumn label="Basic table (5 rows, 5 columns)" style={{ minWidth: 600 }}>
              <DataTable
                data={tableData}
                columns={tableColumns}
                rowKey={(row) => row.id}
              />
            </VariantColumn>
            <VariantColumn label="Column alignment (start, center, end)" style={{ minWidth: 500 }}>
              <DataTable
                data={tableData.slice(0, 3)}
                columns={alignedColumns}
                rowKey={(row) => row.id}
              />
            </VariantColumn>
            <VariantColumn label="With row click handler" style={{ minWidth: 600 }}>
              <DataTable
                data={tableData.slice(0, 3)}
                columns={tableColumns.slice(0, 3)}
                rowKey={(row) => row.id}
                onRowClick={(row) => alert(`Clicked: ${row.exercise}`)}
              />
            </VariantColumn>
            <VariantColumn label="Custom row className (alternating)" style={{ minWidth: 600 }}>
              <DataTable
                data={tableData}
                columns={tableColumns.slice(0, 4)}
                rowKey={(row) => row.id}
                rowClassName={(_row, index) => index % 2 === 0 ? 'bg-white/[0.02]' : ''}
              />
            </VariantColumn>
            <VariantColumn label="Empty state" style={{ minWidth: 400 }}>
              <DataTable
                data={[]}
                columns={tableColumns.slice(0, 3)}
                rowKey={(row: TableRow) => row.id}
                emptyMessage="No exercises programmed yet."
              />
            </VariantColumn>
            <VariantColumn label="Sticky header (scrollable)" style={{ minWidth: 600 }}>
              <div style={{ maxHeight: 160, overflow: 'auto', border: '1px solid #1F1F1F', borderRadius: 4 }}>
                <DataTable
                  data={[...tableData, ...tableData]}
                  columns={tableColumns}
                  rowKey={(row, idx) => `${row.id}-${idx}`}
                  stickyHeader
                />
              </div>
            </VariantColumn>
          </Section>
          <Divider />

          {/* 10. Toast */}
          <Section id="toast" title="ToastProviderV2" desc="Imperative toast notification system with enter/exit animations and auto-dismiss.">
            <Variant label="Trigger toasts by variant" style={{ minWidth: 400 }}>
              <ToastDemoButtons />
            </Variant>
          </Section>

          {/* Footer */}
          <div style={{
            marginTop: 60,
            paddingTop: 20,
            borderTop: '1px solid #1F1F1F',
            color: '#6B7280',
            fontSize: 11,
            fontFamily: 'Nunito Sans, sans-serif',
          }}>
            Titan Design Specimen Page -- rendered with real React components from <code style={{ color: '#FF9630' }}>@titan-design/react-ui</code>
          </div>
        </div>
      </div>
    </ToastProviderV2>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
