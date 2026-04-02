import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/theme/global.css'

import {
  E1rmBadge,
  PrBadge,
  StatusDot,
  PlaceholderStrip,
  VelocityStrip,
  TempoDisplay,
  DeviationBar,
  IntensityBar,
  WorkoutPill,
  MuscleGroupChip,
  Sparkline,
  getVelocityZoneColor,
  calculateVelocityLoss,
  calculateMeanVelocity,
} from '../src/components/custom/Workout'

import type { StatusDotVariant } from '../src/components/custom/Workout'
import type { PRType } from '../src/components/custom/Workout'
import type { WorkoutPillStatus } from '../src/components/custom/Workout'
import type { VolumeStatus } from '../src/components/custom/Workout'

/* ─── Layout helpers ─── */

const sections = [
  { id: 'e1rm-badge', label: '1. E1rmBadge' },
  { id: 'pr-badge', label: '2. PrBadge' },
  { id: 'status-dot', label: '3. StatusDot' },
  { id: 'placeholder-strip', label: '4. PlaceholderStrip' },
  { id: 'velocity-strip', label: '5. VelocityStrip' },
  { id: 'tempo-display', label: '6. TempoDisplay' },
  { id: 'deviation-bar', label: '7. DeviationBar' },
  { id: 'intensity-bar', label: '8. IntensityBar' },
  { id: 'workout-pill', label: '9. WorkoutPill' },
  { id: 'muscle-group-chip', label: '10. MuscleGroupChip' },
  { id: 'sparkline', label: '11. Sparkline' },
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
      }}>Workout Atoms</h1>
      <div style={{
        fontSize: 10,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        padding: '12px 16px 4px',
        fontFamily: 'Nunito Sans, sans-serif',
      }}>Components (11)</div>
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

/* ─── VelocityStrip interactive wrapper ─── */

function VelocityStripInteractive({ velocities, startExpanded = false, label }: {
  velocities: number[]
  startExpanded?: boolean
  label: string
}) {
  const [expanded, setExpanded] = useState(startExpanded)
  return (
    <div style={{ width: '100%' }}>
      <VariantLabel>{label}</VariantLabel>
      <VelocityStrip
        velocities={velocities}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        style={{ width: '100%' }}
      />
    </div>
  )
}

/* ─── PrBadge replay wrapper ─── */

function PrBadgeSection() {
  const [key, setKey] = useState(0)
  return (
    <Section
      id="pr-badge"
      title="PrBadge"
      desc="Star badge indicating a personal record. Pop-in animation on mount."
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, width: '100%' }}>
        {(['e1rm', 'reps', 'volume', 'weight', 'velocity'] as PRType[]).map((type) => (
          <Variant key={`${type}-${key}`} label={`${type} type`}>
            <PrBadge type={type} animate />
          </Variant>
        ))}
        <Variant key={`compact-${key}`} label="Compact (star only)">
          <PrBadge compact animate />
        </Variant>
        <Variant key={`no-anim-${key}`} label="No animation">
          <PrBadge type="e1rm" animate={false} />
        </Variant>
      </div>
      <button
        onClick={() => setKey((k) => k + 1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: '#1C1C1C',
          border: '1px solid #2C2C2C',
          borderRadius: 4,
          color: '#6B7280',
          fontSize: 9,
          fontFamily: 'Nunito Sans, sans-serif',
          padding: '2px 8px',
          cursor: 'pointer',
          marginTop: 8,
        }}
      >&#8635; Replay animations</button>
    </Section>
  )
}

/* ─── Main App ─── */

function App() {
  const [activeId, setActiveId] = useState(sections[0].id)

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

  const allVariants: StatusDotVariant[] = ['success', 'warning', 'error', 'neutral', 'on-track', 'deviation', 'future']
  const dotIcons: Record<string, 'check' | 'exclamation' | 'dash'> = {
    success: 'check',
    warning: 'exclamation',
    error: 'exclamation',
    neutral: 'dash',
    'on-track': 'check',
    deviation: 'exclamation',
    future: 'dash',
  }

  const deviationValues = [-1.0, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0]
  const deviationLabels: Record<number, string> = {
    '-1': 'Much lighter',
    '-0.75': 'Lighter',
    '0': 'On track',
    '0.5': 'Harder',
    '1': 'Much harder',
  }

  const intensityLevels = [20, 50, 75, 95, 100, 110, 120, 130]
  const workoutStatuses: WorkoutPillStatus[] = ['completed', 'active', 'next', 'upcoming', 'missed', 'deload']
  const workoutNames: Record<WorkoutPillStatus, string> = {
    completed: 'Upper A',
    active: 'Lower A',
    next: 'Upper B',
    upcoming: 'Lower B',
    missed: 'Core C',
    deload: 'Deload D',
  }

  const volumeStatuses: VolumeStatus[] = ['ontrack', 'target', 'behind', 'untrained', 'over']
  const muscleNames: Record<VolumeStatus, string> = {
    ontrack: 'Chest',
    target: 'Quads',
    behind: 'Calves',
    untrained: 'Abs',
    over: 'Back',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeId={activeId} />
      <div style={{ flex: 1, padding: '32px 40px', maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 40, borderBottom: '1px solid #1F1F1F', paddingBottom: 20 }}>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 4,
          }}>Workout Atom Components</h1>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>
            Live React components from <code style={{ color: '#FF9630' }}>@titan-design/react-ui</code>. All 11 workout atoms rendered with real props.
          </p>
        </div>

        {/* 1. E1rmBadge */}
        <Section id="e1rm-badge" title="E1rmBadge" desc="Squared-off pill showing estimated 1RM. Right-aligned, tappable for PR history.">
          <Variant label="With crown icon (default)" style={{ minWidth: 260 }}>
            <E1rmBadge value={217} size="sm" />
            <E1rmBadge value={217} size="md" />
            <E1rmBadge value={217} size="lg" />
          </Variant>
          <Variant label="Without icon">
            <E1rmBadge value={217} showIcon={false} size="sm" />
            <E1rmBadge value={217} showIcon={false} size="md" />
            <E1rmBadge value={217} showIcon={false} size="lg" />
          </Variant>
          <Variant label="PR state">
            <E1rmBadge value={217} isPr size="sm" />
            <E1rmBadge value={217} isPr size="md" />
            <E1rmBadge value={217} isPr size="lg" />
          </Variant>
          <Variant label="With delta">
            <E1rmBadge value={217} delta={3} />
            <E1rmBadge value={217} delta={-2} />
          </Variant>
          <Variant label="PR + delta (full badge)">
            <E1rmBadge value={217} isPr delta={3} size="lg" />
          </Variant>
        </Section>
        <Divider />

        {/* 2. PrBadge */}
        <PrBadgeSection />
        <Divider />

        {/* 3. StatusDot */}
        <Section id="status-dot" title="StatusDot" desc="Semantic status indicator with 7 variants, 2 sizes, optional icon and label.">
          <Variant label="All variants (sm)" style={{ minWidth: 300 }}>
            {allVariants.map((v) => (
              <StatusDot key={v} variant={v} size="sm" label={v} />
            ))}
          </Variant>
          <Variant label="All variants (md) with icons" style={{ minWidth: 350 }}>
            {allVariants.map((v) => (
              <StatusDot key={v} variant={v} size="md" icon={dotIcons[v]} />
            ))}
          </Variant>
          <Variant label="md without icons" style={{ minWidth: 350 }}>
            {allVariants.map((v) => (
              <StatusDot key={v} variant={v} size="md" />
            ))}
          </Variant>
          <Variant label="With labels" style={{ minWidth: 350 }}>
            <StatusDot variant="success" glow label="Strong" />
            <StatusDot variant="warning" glow label="Deviation" />
            <StatusDot variant="error" glow label="Failed" />
            <StatusDot variant="neutral" label="Rest" />
            <StatusDot variant="on-track" label="On Track" />
            <StatusDot variant="deviation" label="Adjusting" />
            <StatusDot variant="future" label="Future" />
          </Variant>
          <Variant label="With glow">
            <StatusDot variant="success" size="md" glow icon="check" />
            <StatusDot variant="warning" size="md" glow icon="exclamation" />
            <StatusDot variant="error" size="md" glow icon="exclamation" />
          </Variant>
        </Section>
        <Divider />

        {/* 4. PlaceholderStrip */}
        <Section id="placeholder-strip" title="PlaceholderStrip" desc="Dashed placeholder for planned but not-yet-completed sets. Pairs with VelocityStrip.">
          <VariantColumn label="Single (full width)" style={{ minWidth: 260 }}>
            <PlaceholderStrip style={{ width: '100%' }} />
          </VariantColumn>
          <VariantColumn label="Segmented (3 segments)" style={{ minWidth: 260 }}>
            <PlaceholderStrip mode="segmented" segments={3} style={{ width: '100%' }} />
          </VariantColumn>
          <VariantColumn label="Segmented (6 segments)" style={{ minWidth: 260 }}>
            <PlaceholderStrip mode="segmented" segments={6} style={{ width: '100%' }} />
          </VariantColumn>
          <VariantColumn label="Paired with VelocityStrip" style={{ minWidth: 260 }}>
            <VelocityStrip
              velocities={[1.15, 1.12, 1.10, 1.08, 1.05]}
              variant="mini"
              style={{ width: '100%' }}
            />
            <PlaceholderStrip mode="segmented" segments={5} style={{ width: '100%' }} />
            <PlaceholderStrip style={{ width: '100%' }} />
          </VariantColumn>
        </Section>
        <Divider />

        {/* 5. VelocityStrip */}
        <Section id="velocity-strip" title="VelocityStrip" desc="THE signature interaction. Per-rep velocity visualization that expands from 3px strip to 60px bar chart on tap.">
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 280,
            width: '100%',
          }}>
            <VelocityStripInteractive
              label="Fast set -- click to toggle"
              velocities={[1.15, 1.12, 1.10, 1.08, 1.05]}
            />
          </div>
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 280,
            width: '100%',
          }}>
            <VelocityStripInteractive
              label="Moderate set -- click to toggle"
              velocities={[0.82, 0.78, 0.74, 0.70, 0.66]}
            />
          </div>
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 280,
            width: '100%',
          }}>
            <VelocityStripInteractive
              label="Grinding set -- click to toggle"
              velocities={[0.52, 0.48, 0.44, 0.41, 0.37]}
            />
          </div>
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 280,
            width: '100%',
          }}>
            <VelocityStripInteractive
              label="Pre-expanded (starts open)"
              velocities={[0.62, 0.60, 0.58, 0.56, 0.54, 0.52]}
              startExpanded
            />
          </div>
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 400,
            width: '100%',
          }}>
            <VariantLabel>Mini (non-interactive) -- 3 sets side by side</VariantLabel>
            <div style={{ display: 'flex', gap: 16, width: '100%' }}>
              {[
                { label: 'Set 1', vels: [1.15, 1.12, 1.10, 1.08, 1.05] },
                { label: 'Set 2', vels: [0.82, 0.78, 0.74, 0.70, 0.66] },
                { label: 'Set 3', vels: [0.52, 0.48, 0.44, 0.41, 0.37] },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Nunito Sans, sans-serif' }}>{s.label}</span>
                  <VelocityStrip velocities={s.vels} variant="mini" style={{ width: '100%' }} />
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Divider />

        {/* 6. TempoDisplay */}
        <Section id="tempo-display" title="TempoDisplay" desc="Tempo prescription display: concentric-hold-eccentric-idle. Click any tempo to see phase breakdown.">
          <Variant label="Colored -- Standard (md)">
            <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} colored />
          </Variant>
          <Variant label="Mono -- Standard (md)">
            <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} colored={false} />
          </Variant>
          <Variant label="Colored -- Explosive (md)">
            <TempoDisplay concentric={1} hold={0} eccentric={1} idle={0} colored />
          </Variant>
          <Variant label="Mono -- Explosive (md)">
            <TempoDisplay concentric={1} hold={0} eccentric={1} idle={0} colored={false} />
          </Variant>
          <Variant label="Colored -- Slow eccentric (md)">
            <TempoDisplay concentric={1} hold={2} eccentric={5} idle={1} colored />
          </Variant>
          <Variant label="Mono -- Slow eccentric (md)">
            <TempoDisplay concentric={1} hold={2} eccentric={5} idle={1} colored={false} />
          </Variant>
          <Variant label="Colored (sm)">
            <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} size="sm" colored />
            <TempoDisplay concentric={1} hold={0} eccentric={1} idle={0} size="sm" colored />
          </Variant>
          <Variant label="Mono (sm)">
            <TempoDisplay concentric={1} hold={1} eccentric={3} idle={0} size="sm" colored={false} />
            <TempoDisplay concentric={1} hold={0} eccentric={1} idle={0} size="sm" colored={false} />
          </Variant>
        </Section>
        <Divider />

        {/* 7. DeviationBar */}
        <Section id="deviation-bar" title="DeviationBar" desc="Session deviation indicator. Dot slides from -1 (lighter) to +1 (harder) on a track.">
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 500,
          }}>
            <VariantLabel>Full range: -1.0 to +1.0</VariantLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 56px)', gap: 8, alignItems: 'start' }}>
              {deviationValues.map((d) => (
                <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <DeviationBar deviation={d} width={40} />
                  <span style={{ fontSize: 8, color: '#6B7280', fontFamily: 'Nunito Sans, sans-serif' }}>
                    {d >= 0 ? `+${d}` : d}
                  </span>
                  {deviationLabels[String(d) as unknown as number] && (
                    <span style={{ fontSize: 7, color: '#9CA3AF', fontFamily: 'Nunito Sans, sans-serif' }}>
                      {deviationLabels[d]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Divider />

        {/* 8. IntensityBar */}
        <Section id="intensity-bar" title="IntensityBar" desc="Vertical fill bar showing 0-130%+ of target. Solid zone colors below 100%, gradient reward at 100%, deepening reds beyond.">
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 520,
          }}>
            <VariantLabel>Progression: 20% to 130%</VariantLabel>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', paddingTop: 16 }}>
              {intensityLevels.map((level) => (
                <IntensityBar key={level} level={level} height={36} showLabel />
              ))}
            </div>
          </div>
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 300,
          }}>
            <VariantLabel>With target at 50% -- blue glow when within +/-2%</VariantLabel>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end' }}>
              <IntensityBar level={30} target={50} height={36} showLabel />
              <IntensityBar level={50} target={50} height={36} showLabel />
              <IntensityBar level={70} target={50} height={36} showLabel />
            </div>
          </div>
          <div style={{
            background: '#191919',
            border: '1px solid #1F1F1F',
            borderRadius: 8,
            padding: '12px 16px',
          }}>
            <VariantLabel>Compact (no labels)</VariantLabel>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', paddingTop: 12 }}>
              <IntensityBar level={25} height={24} />
              <IntensityBar level={60} height={24} />
              <IntensityBar level={100} height={24} />
              <IntensityBar level={110} height={24} />
            </div>
          </div>
        </Section>
        <Divider />

        {/* 9. WorkoutPill */}
        <Section id="workout-pill" title="WorkoutPill" desc="Workout session pill with status indication. Only the active pill pulses.">
          <Variant label="All statuses" style={{ minWidth: 500 }}>
            {workoutStatuses.map((status) => (
              <WorkoutPill
                key={status}
                name={workoutNames[status]}
                status={status}
                pulse={status === 'active'}
              />
            ))}
          </Variant>
          {workoutStatuses.map((status) => (
            <Variant key={status} label={`${status}${status === 'active' ? ' (with pulse)' : ''}`}>
              <WorkoutPill
                name={workoutNames[status]}
                status={status}
                pulse={status === 'active'}
              />
            </Variant>
          ))}
          <Variant label="Active (no pulse)">
            <WorkoutPill name="Lower A" status="active" />
          </Variant>
          <Variant label="Next (with pulse)">
            <WorkoutPill name="Upper B" status="next" pulse />
          </Variant>
        </Section>
        <p style={{
          fontSize: 11,
          color: '#6B7280',
          fontFamily: 'Nunito Sans, sans-serif',
          fontStyle: 'italic',
          marginTop: -40,
          marginBottom: 48,
          padding: '8px 12px',
          borderLeft: '2px solid #2C2C2C',
          background: 'rgba(255,255,255,0.02)',
        }}>
          Pulse is a prop, not tied to status. Only one pill should pulse at a time.
        </p>
        <Divider />

        {/* 10. MuscleGroupChip */}
        <Section id="muscle-group-chip" title="MuscleGroupChip" desc="Compact chip showing muscle group with volume status dot.">
          <Variant label="All volume statuses" style={{ minWidth: 420 }}>
            {volumeStatuses.map((vs) => (
              <MuscleGroupChip key={vs} name={muscleNames[vs]} volumeStatus={vs} />
            ))}
          </Variant>
          <VariantColumn label="Color legend" style={{ minWidth: 300 }}>
            {volumeStatuses.map((vs) => (
              <div key={vs} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MuscleGroupChip name={muscleNames[vs]} volumeStatus={vs} />
                <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'Nunito Sans, sans-serif' }}>
                  {vs}
                </span>
              </div>
            ))}
          </VariantColumn>
        </Section>
        <Divider />

        {/* 11. Sparkline */}
        <Section id="sparkline" title="Sparkline" desc="Compact inline chart for trend visualization. Line with optional reference lines and highlighted endpoints.">
          <Variant label="Ascending (weight progression)">
            <Sparkline data={[100, 110, 120, 130, 140]} highlightLast />
          </Variant>
          <Variant label="U-curve (deload recovery)">
            <Sparkline data={[140, 120, 100, 120, 140]} highlightLast />
          </Variant>
          <Variant label="Plateau">
            <Sparkline data={[120, 120, 140, 120, 120]} highlightLast />
          </Variant>
          <Variant label="With reference lines (MEV / MRV)" style={{ minWidth: 200 }}>
            <Sparkline
              data={[100, 108, 116, 124, 130, 134]}
              width={120}
              height={40}
              showDots
              highlightLast
              referenceLines={[
                { value: 105, color: '#14B8A6', dashed: true, label: 'MEV' },
                { value: 135, color: '#D14343', dashed: true, label: 'MRV' },
              ]}
            />
          </Variant>
          <Variant label="With all dots">
            <Sparkline data={[100, 115, 110, 125, 120, 135]} showDots highlightLast />
          </Variant>
          <Variant label="Descending (fatigue)">
            <Sparkline data={[140, 132, 125, 118, 110]} color="#D14343" highlightLast />
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
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
