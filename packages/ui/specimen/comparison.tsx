import React from 'react'
import { View } from 'react-native'
import { createRoot } from 'react-dom/client'
import '../src/theme/global.css'

import {
  WeightBadge,
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
  SetRow,
  InputBar,
  RestTimer,
  ExerciseCard,
  SupersetWrapper,
} from '../src/components/custom/Workout'

/* ─────────────────────────────────────────────
   HTML Ground Truth CSS (verbatim from component-demo.html lines 218-720)
   Scoped under .html-scope to avoid leaking into React components.
   ───────────────────────────────────────────── */
const HTML_CSS = `
  .html-scope {
    --brand-primary: #FF7900;
    --brand-primary-light: #FF9630;
    --brand-primary-subtle: rgba(255, 121, 0, 0.12);
    --brand-secondary: #307B9B;
    --bg-base: #101010;
    --surface-elevated: #191919;
    --surface-raised: #1C1C1C;
    --text-primary: #F3F4F6;
    --text-secondary: #9CA3AF;
    --text-tertiary: #6B7280;
    --border-default: #1F1F1F;
    --border-strong: #2C2C2C;
    --status-success: #2ED573;
    --status-error: #D14343;
    --status-warning: #F9B415;
    --result-improve: #4caf50;
    --result-degrade: #ef5350;
    --vel-red: #d14343;
    --vel-orange: #ff7900;
    --vel-yellow: #f9b415;
    --vel-green: #2ed573;
    --font-heading: 'Space Grotesk', sans-serif;
    --font-ui: 'Nunito Sans', sans-serif;
    --font-body: 'Inter', sans-serif;
  }

  /* 1. WeightBadge */
  .html-scope .weight-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: 2px;
    font-family: var(--font-heading);
    font-weight: 600;
    color: var(--text-secondary);
  }
  .html-scope .weight-icon {
    display: inline-flex;
    align-items: center;
    margin-top: -1px;
  }
  .html-scope .weight-icon svg {
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    display: block;
  }
  .html-scope .weight-badge.sm .weight-icon svg { width: 10px; height: 10px; }
  .html-scope .weight-badge.md .weight-icon svg { width: 12px; height: 12px; }
  .html-scope .weight-badge.lg .weight-icon svg { width: 14px; height: 14px; }
  .html-scope .weight-badge.sm { font-size: 9px; padding: 2px 6px; }
  .html-scope .weight-badge.md { font-size: 10px; padding: 2px 8px; }
  .html-scope .weight-badge.lg { font-size: 12px; padding: 4px 10px; }
  .html-scope .weight-badge.pr {
    background: var(--brand-primary-subtle);
    border-color: rgba(255, 121, 0, 0.3);
    color: var(--brand-primary);
  }
  .html-scope .weight-delta {
    margin-left: 4px;
  }
  .html-scope .weight-delta.positive { color: var(--result-improve); }
  .html-scope .weight-delta.negative { color: var(--result-degrade); }

  /* 2. PrBadge */
  .html-scope .pr-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: var(--brand-primary-subtle);
    border: 1px solid rgba(255, 121, 0, 0.3);
    border-radius: 2px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-primary);
    font-family: var(--font-body);
  }
  .html-scope .pr-badge-compact {
    display: inline-flex;
    align-items: center;
  }

  /* 3. StatusDot */
  .html-scope .status-dot {
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .html-scope .status-dot.sm { width: 8px; height: 8px; }
  .html-scope .status-dot.md { width: 18px; height: 18px; }
  .html-scope .status-dot.success { background: var(--status-success); }
  .html-scope .status-dot.warning { background: var(--status-warning); }
  .html-scope .status-dot.error { background: var(--status-error); }
  .html-scope .status-dot.neutral { background: var(--text-tertiary); }
  .html-scope .status-dot.on-track {
    background: rgba(46,213,115,0.15);
    border: 1px solid rgba(46,213,115,0.3);
  }
  .html-scope .status-dot.deviation {
    background: rgba(245,158,11,0.15);
    border: 1px solid rgba(245,158,11,0.25);
  }
  .html-scope .status-dot.future {
    background: rgba(107,114,128,0.1);
    border: 1px dashed rgba(107,114,128,0.2);
  }
  .html-scope .status-dot .dot-icon {
    font-size: 11px;
    line-height: 1;
    font-weight: 900;
  }
  .html-scope .status-dot.success .dot-icon { color: #0A5C52; }
  .html-scope .status-dot.warning .dot-icon { color: #6B4000; }
  .html-scope .status-dot.error .dot-icon { color: #5C1A1A; }
  .html-scope .status-dot.neutral .dot-icon { color: #D1D5DB; }
  .html-scope .status-dot.on-track .dot-icon { color: var(--status-success); }
  .html-scope .status-dot.deviation .dot-icon { color: var(--status-warning); }
  .html-scope .status-dot.future .dot-icon { color: var(--text-tertiary); }
  .html-scope .glow-success { box-shadow: 0 0 4px rgba(46,213,115,0.4); }
  .html-scope .glow-warning { box-shadow: 0 0 4px rgba(245,158,11,0.4); }
  .html-scope .glow-error { box-shadow: 0 0 4px rgba(239,68,68,0.4); }

  /* 4. PlaceholderStrip */
  .html-scope .placeholder-strip-single {
    height: 3px;
    background: #3A3A3A;
    border-radius: 2px;
    opacity: 0.5;
  }
  .html-scope .placeholder-strip-segmented {
    display: flex;
    gap: 2px;
    height: 3px;
    opacity: 0.5;
  }
  .html-scope .placeholder-segment {
    flex: 1;
    height: 3px;
    background: #3A3A3A;
    border-radius: 1px;
    min-width: 4px;
  }

  /* 5. VelocityStrip (collapsed mini only for static comparison) */
  .html-scope .velocity-mini {
    display: flex;
    gap: 2px;
    height: 3px;
    border-radius: 2px;
    width: 100%;
  }
  .html-scope .velocity-mini .vel-bar { flex: 1; border-radius: 1px; min-width: 4px; }
  .html-scope .vel-bar.green { background: var(--vel-green); }
  .html-scope .vel-bar.yellow { background: var(--vel-yellow); }
  .html-scope .vel-bar.orange { background: var(--vel-orange); }
  .html-scope .vel-bar.red { background: var(--vel-red); }

  /* 6. TempoDisplay */
  .html-scope .tempo-display {
    display: inline-flex;
    align-items: center;
    background: var(--surface-raised);
    border-radius: 4px;
    font-family: var(--font-ui);
    position: relative;
    cursor: pointer;
  }
  .html-scope .tempo-display.md-size { padding: 3px 8px; }
  .html-scope .tempo-display.sm-size { padding: 3px 6px; }
  .html-scope .tempo-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-tertiary);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-right: 6px;
  }
  .html-scope .tempo-value {
    font-weight: 600;
    letter-spacing: 1px;
  }
  .html-scope .tempo-display.md-size .tempo-value { font-size: 11px; }
  .html-scope .tempo-display.sm-size .tempo-value { font-size: 9px; }
  .html-scope .tempo-value.mono { color: #6B7280; }
  .html-scope .tempo-colored .t-con { color: var(--brand-primary); }
  .html-scope .tempo-colored .t-hold { color: #2196F3; }
  .html-scope .tempo-colored .t-ecc { color: var(--status-success); }
  .html-scope .tempo-colored .t-idle { color: var(--text-secondary); }
  .html-scope .tempo-colored .t-dash { color: var(--text-secondary); }

  /* 7. DeviationBar */
  .html-scope .deviation-bar {
    position: relative;
    height: 10px;
    display: flex;
    align-items: center;
  }
  .html-scope .deviation-track {
    width: 100%;
    height: 4px;
    background: #333333;
    border-radius: 100px;
  }
  .html-scope .deviation-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    top: 2px;
  }
  .html-scope .deviation-dot.success { background: var(--status-success); }
  .html-scope .deviation-dot.neutral { background: var(--text-tertiary); }
  .html-scope .deviation-dot.warning { background: var(--status-warning); }
  .html-scope .deviation-dot.error { background: var(--status-error); }

  /* 8. IntensityBar */
  .html-scope .intensity-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: fit-content;
  }
  .html-scope .intensity-track {
    width: 6px;
    background: #333333;
    border-radius: 3px;
    overflow: visible;
    position: relative;
  }
  .html-scope .intensity-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 3px;
    transition: height 0.3s ease;
    z-index: 2;
  }
  .html-scope .intensity-fill.building { background: var(--status-success); }
  .html-scope .intensity-fill.approaching { background: var(--status-warning); }
  .html-scope .intensity-fill.target {
    background: linear-gradient(to top, var(--status-warning) 0%, var(--brand-primary) 50%, var(--status-error) 100%);
  }
  .html-scope .intensity-fill.over-1 { background: var(--status-error); height: 100% !important; }
  .html-scope .intensity-fill.over-2 { background: #A4221C; height: 100% !important; }
  .html-scope .intensity-fill.over-3 { background: #7E1002; height: 100% !important; }
  .html-scope .intensity-fill.at-target {
    box-shadow: 0 0 5px 1px rgba(33, 150, 243, 0.35), 0 0 10px 3px rgba(33, 150, 243, 0.15);
  }
  .html-scope .intensity-bulge {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 50%;
    z-index: 1;
  }
  .html-scope .intensity-bulge.over-1 { background: var(--status-error); }
  .html-scope .intensity-bulge.over-2 { background: #A4221C; }
  .html-scope .intensity-bulge.over-3 { background: #7E1002; }
  .html-scope .intensity-line-target {
    position: absolute;
    left: -3px;
    right: -3px;
    height: 1.5px;
    background: rgba(33, 150, 243, 0.5);
    z-index: 4;
  }
  .html-scope .intensity-label {
    font-size: 8px;
    color: var(--text-tertiary);
    font-family: var(--font-ui);
    margin-top: 6px;
  }

  /* 9. WorkoutPill */
  .html-scope .workout-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-ui);
  }
  .html-scope .workout-pill.completed {
    background: rgba(46,213,115,0.15);
    border: 1px solid rgba(46,213,115,0.3);
    color: var(--status-success);
  }
  .html-scope .workout-pill.active {
    background: rgba(255,121,0,0.15);
    border: 1px solid rgba(255,121,0,0.3);
    color: var(--brand-primary);
  }
  .html-scope .workout-pill.next {
    background: transparent;
    border: 1px solid rgba(255,121,0,0.4);
    color: var(--brand-primary);
  }
  .html-scope .workout-pill.upcoming {
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    color: var(--text-tertiary);
  }
  .html-scope .workout-pill.missed {
    background: rgba(209,67,67,0.1);
    border: 1px solid rgba(209,67,67,0.25);
    color: rgba(209,67,67,0.7);
  }

  /* 10. MuscleGroupChip */
  .html-scope .muscle-chip {
    display: inline-flex;
    align-items: center;
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: 100px;
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-secondary);
    font-family: var(--font-body);
  }
  .html-scope .muscle-chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    flex-shrink: 0;
  }
  .html-scope .muscle-chip-dot.ontrack { background: var(--status-success); }
  .html-scope .muscle-chip-dot.target { background: var(--brand-primary); }
  .html-scope .muscle-chip-dot.behind { background: var(--brand-secondary); }
  .html-scope .muscle-chip-dot.untrained { background: var(--border-strong); }
  .html-scope .muscle-chip-dot.over { background: var(--status-error); }

  /* WorkoutPill deload */
  .html-scope .workout-pill.deload {
    background: rgba(186,41,150,0.15);
    border: 1px solid rgba(186,41,150,0.3);
    color: #ba2996;
  }

  /* 12. SetRow */
  .html-scope .set-row {
    display: flex;
    align-items: center;
    padding: 7px 8px;
    gap: 8px;
    border-radius: 8px;
  }
  .html-scope .set-row .col-set {
    width: 36px;
    text-align: center;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .html-scope .set-row .col-prev {
    flex: 1;
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--text-secondary);
  }
  .html-scope .set-row .col-reps {
    width: 44px;
    text-align: center;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .html-scope .set-row .col-weight {
    width: 56px;
    text-align: center;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .html-scope .set-row .col-rpe {
    width: 36px;
    text-align: center;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-tertiary);
  }
  .html-scope .set-row.completed-dim { opacity: 0.55; }
  .html-scope .set-row.next-set {
    background: rgba(255, 121, 0, 0.06);
    border: 1px solid rgba(255, 121, 0, 0.15);
  }
  .html-scope .set-row .set-type-badge {
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 700;
    color: var(--vel-orange);
    background: rgba(255, 165, 2, 0.12);
    padding: 1px 5px;
    border-radius: 3px;
  }

  /* 13. InputBar */
  .html-scope .input-bar-comparison {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface-elevated);
    border-top: 1px solid var(--border-default);
    padding: 10px 16px 12px;
  }
  .html-scope .input-bar-comparison .ib-info {
    min-width: 80px;
    display: flex;
    flex-direction: column;
  }
  .html-scope .input-bar-comparison .ib-exercise {
    font-family: var(--font-heading);
    font-size: 12px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .html-scope .input-bar-comparison .ib-set {
    font-family: var(--font-body);
    font-size: 10px;
    color: var(--text-tertiary);
  }
  .html-scope .input-bar-comparison .ib-fields {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
  }
  .html-scope .input-bar-comparison .ib-field {
    background: var(--surface-raised);
    border: 1px solid var(--border-strong);
    border-radius: 6px;
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    padding: 5px 2px;
  }
  .html-scope .input-bar-comparison .ib-field.reps { width: 36px; }
  .html-scope .input-bar-comparison .ib-field.weight { width: 52px; }
  .html-scope .input-bar-comparison .ib-x {
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--text-tertiary);
  }
  .html-scope .input-bar-comparison .ib-unit {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-tertiary);
  }
  .html-scope .input-bar-comparison .ib-record {
    background: var(--brand-primary);
    border: none;
    border-radius: 8px;
    color: white;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    padding: 10px 16px;
    cursor: pointer;
  }

  /* 14. RestTimer */
  .html-scope .rest-timer-comparison {
    background: var(--surface-raised);
    border-top: 1px solid var(--border-default);
    padding: 12px 16px;
  }
  .html-scope .rest-timer-comparison .rt-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .html-scope .rest-timer-comparison .rt-label {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
  }
  .html-scope .rest-timer-comparison .rt-context {
    font-family: var(--font-body);
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 2px;
  }
  .html-scope .rest-timer-comparison .rt-time {
    font-family: var(--font-heading);
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5px;
  }
  .html-scope .rest-timer-comparison .rt-bar {
    height: 3px;
    background: var(--border-default);
    border-radius: 2px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .html-scope .rest-timer-comparison .rt-bar-fill {
    height: 100%;
    background: var(--brand-primary);
    border-radius: 2px;
  }
  .html-scope .rest-timer-comparison .rt-actions {
    display: flex;
    gap: 8px;
  }
  .html-scope .rest-timer-comparison .rt-btn {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }
  .html-scope .rest-timer-comparison .rt-add {
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-secondary);
  }
  .html-scope .rest-timer-comparison .rt-skip {
    background: var(--brand-primary-subtle);
    color: var(--brand-primary);
  }

  /* 15. ExerciseCard */
  .html-scope .exercise-card-comparison {
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
  }
  .html-scope .exercise-card-comparison .ec-row1 {
    display: flex;
    align-items: center;
  }
  .html-scope .exercise-card-comparison .ec-name {
    font-family: var(--font-heading);
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .html-scope .exercise-card-comparison .ec-summary {
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--text-secondary);
    margin-left: 8px;
  }
  .html-scope .exercise-card-upcoming {
    background: var(--surface-elevated);
    border: 1px solid var(--border-default);
    border-radius: 12px;
    padding: 12px 14px;
    opacity: 0.6;
  }
  .html-scope .exercise-card-upcoming .ec-row1 {
    display: flex;
    align-items: center;
  }
  .html-scope .exercise-card-upcoming .ec-name {
    font-family: var(--font-heading);
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
  }
  .html-scope .exercise-card-upcoming .ec-prescription {
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--text-secondary);
    margin-left: 8px;
  }
  .html-scope .exercise-card-upcoming .ec-prev-best {
    font-family: var(--font-body);
    font-size: 11px;
    color: var(--text-tertiary);
    margin-left: auto;
  }

  /* 16. SupersetWrapper */
  .html-scope .superset-wrapper-comparison {
    position: relative;
    border-left: 3px solid var(--brand-primary);
    padding-left: 8px;
    margin: 0 12px 8px;
  }
  .html-scope .superset-wrapper-comparison .sw-label {
    position: absolute;
    top: -1px;
    left: -3px;
    font-family: var(--font-body);
    font-size: 9px;
    font-weight: 700;
    background: var(--brand-primary);
    color: var(--bg-base);
    padding: 2px 6px;
    border-radius: 0 0 4px 0;
    letter-spacing: 0.5px;
    z-index: 2;
  }
  .html-scope .superset-wrapper-comparison .sw-children {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .html-scope .sw-placeholder {
    height: 48px;
    background: var(--surface-raised);
    border: 1px solid var(--border-default);
    border-radius: 8px;
  }

  /* Sparkline (container-only comparison) */
  .html-scope .sparkline-container {
    position: relative;
  }
  .html-scope .sparkline-line {
    position: absolute;
    height: 1.5px;
    transform-origin: 0 0;
  }
  .html-scope .sparkline-dot {
    position: absolute;
    border-radius: 50%;
  }
  .html-scope .sparkline-ref-line {
    position: absolute;
    left: 0;
    right: 0;
    opacity: 0.6;
  }
`

/* ─────────────────────────────────────────────
   Comparison Pair wrapper
   ───────────────────────────────────────────── */

function ComparisonPair({
  testId,
  label,
  htmlContent,
  children,
}: {
  testId: string
  label: string
  htmlContent: string
  children: React.ReactNode
}) {
  return (
    <div
      data-testid={testId}
      style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        padding: '12px 16px',
        background: '#191919',
        border: '1px solid #1F1F1F',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: '#6B7280', marginBottom: 6, fontFamily: 'Nunito Sans, sans-serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          HTML -- {label}
        </div>
        <div
          className="html-version"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
      <div style={{ width: 1, background: '#2C2C2C', alignSelf: 'stretch' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, color: '#6B7280', marginBottom: 6, fontFamily: 'Nunito Sans, sans-serif', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          React -- {label}
        </div>
        <div className="react-version" style={{ display: 'flex', alignItems: 'flex-start' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 style={{
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 18,
      fontWeight: 700,
      color: '#F3F4F6',
      margin: '24px 0 12px',
      paddingBottom: 8,
      borderBottom: '1px solid #1F1F1F',
    }}>{title}</h2>
  )
}

/* ─────────────────────────────────────────────
   Dumbbell SVG for HTML weight badges
   (mirrors lucide-react's Dumbbell rendered by WeightBadge)
   ───────────────────────────────────────────── */
const dumbbellSvg = (w: number, h: number) =>
  `<svg viewBox="0 0 24 24" width="${w}" height="${h}" style="stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none;display:block"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/></svg>`

/* Star SVG for the compact PrBadge (mirrors lucide-react's Star rendered by PrBadge:
   size=14, fill/stroke #FF7900, strokeWidth 2). */
const starSvg = (w: number, h: number) =>
  `<svg viewBox="0 0 24 24" width="${w}" height="${h}" style="fill:#FF7900;stroke:#FF7900;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`

/* ─────────────────────────────────────────────
   App
   ───────────────────────────────────────────── */

function App() {
  return (
    <div className="html-scope" style={{ padding: '20px 32px', maxWidth: 1200 }}>
      <style dangerouslySetInnerHTML={{ __html: HTML_CSS }} />

      <h1 style={{
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 4,
      }}>HTML vs React Comparison</h1>
      <p style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 24 }}>
        Side-by-side rendering of HTML ground truth (left) vs React components (right).
      </p>

      {/* ── 1. WeightBadge ── */}
      <SectionHeader title="1. WeightBadge" />

      <ComparisonPair
        testId="compare-weight-badge-default-md"
        label="WeightBadge default md"
        htmlContent={`<div class="weight-badge md"><span class="weight-icon">${dumbbellSvg(12, 12)}</span>217 lbs</div>`}
      >
        <WeightBadge value={217} size="md" />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-weight-badge-default-sm"
        label="WeightBadge default sm"
        htmlContent={`<div class="weight-badge sm"><span class="weight-icon">${dumbbellSvg(10, 10)}</span>217 lbs</div>`}
      >
        <WeightBadge value={217} size="sm" />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-weight-badge-default-lg"
        label="WeightBadge default lg"
        htmlContent={`<div class="weight-badge lg"><span class="weight-icon">${dumbbellSvg(14, 14)}</span>217 lbs</div>`}
      >
        <WeightBadge value={217} size="lg" />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-weight-badge-pr"
        label="WeightBadge PR md"
        htmlContent={`<div class="weight-badge md pr"><span class="weight-icon">${dumbbellSvg(12, 12)}</span>\u2733 217 lbs</div>`}
      >
        <WeightBadge value={217} size="md" isPr />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-weight-badge-delta-positive"
        label="WeightBadge with +delta"
        htmlContent={`<div class="weight-badge md"><span class="weight-icon">${dumbbellSvg(12, 12)}</span>217 lbs <span class="weight-delta positive">+3%</span></div>`}
      >
        <WeightBadge value={217} delta={3} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-weight-badge-delta-negative"
        label="WeightBadge with -delta"
        htmlContent={`<div class="weight-badge md"><span class="weight-icon">${dumbbellSvg(12, 12)}</span>217 lbs <span class="weight-delta negative">-2%</span></div>`}
      >
        <WeightBadge value={217} delta={-2} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-weight-badge-no-icon"
        label="WeightBadge no icon"
        htmlContent={`<div class="weight-badge md">217 lbs</div>`}
      >
        <WeightBadge value={217} showIcon={false} />
      </ComparisonPair>

      {/* ── 2. PrBadge ── */}
      <SectionHeader title="2. PrBadge" />

      <ComparisonPair
        testId="compare-pr-badge-e1rm"
        label="PrBadge e1rm"
        htmlContent={`<div class="pr-badge">\u2605 PR e1RM</div>`}
      >
        <PrBadge type="e1rm" animate={false} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-pr-badge-reps"
        label="PrBadge reps"
        htmlContent={`<div class="pr-badge">\u2605 PR Reps</div>`}
      >
        <PrBadge type="reps" animate={false} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-pr-badge-compact"
        label="PrBadge compact"
        htmlContent={`<span class="pr-badge-compact">${starSvg(14, 14)}</span>`}
      >
        <PrBadge compact animate={false} />
      </ComparisonPair>

      {/* ── 3. StatusDot ── */}
      <SectionHeader title="3. StatusDot" />

      {(['success', 'warning', 'error', 'neutral', 'on-track', 'deviation', 'future'] as const).map((variant) => {
        const cssClass = variant
        return (
          <ComparisonPair
            key={variant}
            testId={`compare-status-dot-${variant}-md`}
            label={`StatusDot ${variant} md`}
            htmlContent={`<div class="status-dot md ${cssClass}"></div>`}
          >
            <StatusDot variant={variant} size="md" />
          </ComparisonPair>
        )
      })}

      {(['success', 'warning', 'error', 'neutral', 'on-track', 'deviation', 'future'] as const).map((variant) => {
        const cssClass = variant
        return (
          <ComparisonPair
            key={`sm-${variant}`}
            testId={`compare-status-dot-${variant}-sm`}
            label={`StatusDot ${variant} sm`}
            htmlContent={`<div class="status-dot sm ${cssClass}"></div>`}
          >
            <StatusDot variant={variant} size="sm" />
          </ComparisonPair>
        )
      })}

      {/* ── 3b. StatusDot with icons ── */}
      {([
        { variant: 'success', icon: 'check', iconChar: '\u2713' },
        { variant: 'warning', icon: 'exclamation', iconChar: '!' },
        { variant: 'error', icon: 'dash', iconChar: '\u2014' },
      ] as const).map(({ variant, icon, iconChar }) => (
        <ComparisonPair
          key={`icon-${variant}`}
          testId={`compare-status-dot-${variant}-icon`}
          label={`StatusDot ${variant} md icon=${icon}`}
          htmlContent={`<div class="status-dot md ${variant}"><span class="dot-icon">${iconChar}</span></div>`}
        >
          <StatusDot variant={variant} size="md" icon={icon} />
        </ComparisonPair>
      ))}

      {/* ── 3c. StatusDot with glow ── */}
      {(['success', 'warning', 'error'] as const).map((variant) => (
        <ComparisonPair
          key={`glow-${variant}`}
          testId={`compare-status-dot-${variant}-glow`}
          label={`StatusDot ${variant} md glow`}
          htmlContent={`<div class="status-dot md ${variant} glow-${variant}"></div>`}
        >
          <StatusDot variant={variant} size="md" glow />
        </ComparisonPair>
      ))}

      {/* ── 4. PlaceholderStrip ── */}
      <SectionHeader title="4. PlaceholderStrip" />

      <ComparisonPair
        testId="compare-placeholder-single"
        label="PlaceholderStrip single"
        htmlContent={`<div class="placeholder-strip-single" style="width:200px"></div>`}
      >
        <PlaceholderStrip width={200} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-placeholder-segmented-3"
        label="PlaceholderStrip segmented 3"
        htmlContent={`<div class="placeholder-strip-segmented" style="width:200px"><div class="placeholder-segment"></div><div class="placeholder-segment"></div><div class="placeholder-segment"></div></div>`}
      >
        <PlaceholderStrip mode="segmented" segments={3} width={200} />
      </ComparisonPair>

      {/* ── 5. VelocityStrip (mini only for static comparison) ── */}
      <SectionHeader title="5. VelocityStrip" />

      <ComparisonPair
        testId="compare-velocity-mini-fast"
        label="VelocityStrip mini (fast)"
        htmlContent={`<div class="velocity-mini" style="width:200px"><div class="vel-bar green"></div><div class="vel-bar green"></div><div class="vel-bar green"></div><div class="vel-bar green"></div><div class="vel-bar green"></div></div>`}
      >
        <VelocityStrip velocities={[1.15, 1.12, 1.10, 1.08, 1.05]} variant="mini" style={{ width: 200 }} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-velocity-mini-mixed"
        label="VelocityStrip mini (mixed)"
        htmlContent={`<div class="velocity-mini" style="width:200px"><div class="vel-bar yellow"></div><div class="vel-bar yellow"></div><div class="vel-bar orange"></div><div class="vel-bar orange"></div><div class="vel-bar orange"></div></div>`}
      >
        <VelocityStrip velocities={[0.82, 0.78, 0.74, 0.70, 0.66]} variant="mini" style={{ width: 200 }} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-velocity-mini-grinding"
        label="VelocityStrip mini (grinding)"
        htmlContent={`<div class="velocity-mini" style="width:200px"><div class="vel-bar orange"></div><div class="vel-bar red"></div><div class="vel-bar red"></div><div class="vel-bar red"></div><div class="vel-bar red"></div></div>`}
      >
        <VelocityStrip velocities={[0.52, 0.48, 0.44, 0.41, 0.37]} variant="mini" style={{ width: 200 }} />
      </ComparisonPair>

      {/* ── 5b. VelocityStrip expanded ── */}
      <ComparisonPair
        testId="compare-velocity-expanded"
        label="VelocityStrip expanded"
        htmlContent={`<div style="display:flex;flex-direction:column;align-items:center;width:200px;height:60px;gap:2px;border-radius:6px;padding:16px 6px 24px;background:#1C1C1C;position:relative;overflow:visible"><div style="display:flex;flex-direction:row;flex:1;gap:2px;align-items:flex-end;width:100%"><div style="flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end"><div class="vel-bar green" style="height:87%;border-top-left-radius:2px;border-top-right-radius:2px"></div></div><div style="flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end"><div class="vel-bar green" style="height:80%;border-top-left-radius:2px;border-top-right-radius:2px"></div></div><div style="flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end"><div class="vel-bar green" style="height:74%;border-top-left-radius:2px;border-top-right-radius:2px"></div></div></div></div>`}
      >
        <VelocityStrip velocities={[1.15, 1.06, 0.98]} variant="full" expanded showInfo={false} style={{ width: 200 }} />
      </ComparisonPair>

      {/* ── 6. TempoDisplay ── */}
      <SectionHeader title="6. TempoDisplay" />

      <ComparisonPair
        testId="compare-tempo-colored-md"
        label="TempoDisplay colored md"
        htmlContent={`<div class="tempo-display md-size tempo-colored"><span class="tempo-label">TEMPO</span><span class="tempo-value"><span class="t-con">1</span><span class="t-dash">-</span><span class="t-hold">1</span><span class="t-dash">-</span><span class="t-ecc">3</span><span class="t-dash">-</span><span class="t-idle">0</span></span></div>`}
      >
        <TempoDisplay tempo={[1, 1, 3, 0]} colored />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-tempo-mono-md"
        label="TempoDisplay mono md"
        htmlContent={`<div class="tempo-display md-size"><span class="tempo-label">TEMPO</span><span class="tempo-value mono">1-1-3-0</span></div>`}
      >
        <TempoDisplay tempo={[1, 1, 3, 0]} colored={false} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-tempo-colored-sm"
        label="TempoDisplay colored sm"
        htmlContent={`<div class="tempo-display sm-size tempo-colored"><span class="tempo-label">TEMPO</span><span class="tempo-value"><span class="t-con">1</span><span class="t-dash">-</span><span class="t-hold">1</span><span class="t-dash">-</span><span class="t-ecc">3</span><span class="t-dash">-</span><span class="t-idle">0</span></span></div>`}
      >
        <TempoDisplay tempo={[1, 1, 3, 0]} size="sm" colored />
      </ComparisonPair>

      {/* ── 7. DeviationBar ── */}
      <SectionHeader title="7. DeviationBar" />

      {[
        { dev: -1.0, dotClass: 'success', left: 0 },
        { dev: 0, dotClass: 'neutral', left: 17 },
        { dev: 0.5, dotClass: 'warning', left: 27 },
        { dev: 1.0, dotClass: 'error', left: 34 },
      ].map(({ dev, dotClass, left }) => (
        <ComparisonPair
          key={dev}
          testId={`compare-deviation-${dev.toString().replace('.', '_').replace('-', 'neg')}`}
          label={`DeviationBar ${dev >= 0 ? '+' : ''}${dev}`}
          htmlContent={`<div class="deviation-bar" style="width:40px"><div class="deviation-track"></div><div class="deviation-dot ${dotClass}" style="left:${left}px"></div></div>`}
        >
          <DeviationBar deviation={dev} width={40} />
        </ComparisonPair>
      ))}

      {/* ── 8. IntensityBar ── */}
      <SectionHeader title="8. IntensityBar" />

      <ComparisonPair
        testId="compare-intensity-20"
        label="IntensityBar 20% (building)"
        htmlContent={`<div class="intensity-bar"><div class="intensity-track" style="height:36px"><div class="intensity-fill building" style="height:20%"></div></div><span class="intensity-label">20%</span></div>`}
      >
        <IntensityBar level={0.2} size={36} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-intensity-75"
        label="IntensityBar 75% (approaching)"
        htmlContent={`<div class="intensity-bar"><div class="intensity-track" style="height:36px"><div class="intensity-fill approaching" style="height:75%"></div></div><span class="intensity-label">75%</span></div>`}
      >
        <IntensityBar level={0.75} size={36} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-intensity-100"
        label="IntensityBar 100% (target gradient)"
        htmlContent={`<div class="intensity-bar"><div class="intensity-track" style="height:36px"><div class="intensity-fill target" style="height:100%"></div></div><span class="intensity-label">100%</span></div>`}
      >
        <IntensityBar level={1} size={36} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-intensity-110"
        label="IntensityBar 110% (over + bulge)"
        htmlContent={`<div class="intensity-bar"><div class="intensity-track" style="height:36px"><div class="intensity-fill over-1" style="height:100%"></div><div class="intensity-bulge over-1" style="width:8px;height:8px"></div></div><span class="intensity-label">110%</span></div>`}
      >
        <IntensityBar level={1.1} size={36} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-intensity-50-target"
        label="IntensityBar 50% at target (blue glow)"
        htmlContent={`<div class="intensity-bar"><div class="intensity-track" style="height:36px"><div class="intensity-fill building at-target" style="height:50%"></div><div class="intensity-line-target" style="bottom:50%"></div></div><span class="intensity-label">50%</span></div>`}
      >
        <IntensityBar level={0.5} threshold={0.5} size={36} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-intensity-120"
        label="IntensityBar 120% (over-2)"
        htmlContent={`<div class="intensity-bar"><div class="intensity-track" style="height:36px"><div class="intensity-fill over-2" style="height:100%"></div><div class="intensity-bulge over-2" style="width:10px;height:10px"></div></div><span class="intensity-label">120%</span></div>`}
      >
        <IntensityBar level={1.2} size={36} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-intensity-130"
        label="IntensityBar 130% (over-3)"
        htmlContent={`<div class="intensity-bar"><div class="intensity-track" style="height:36px"><div class="intensity-fill over-3" style="height:100%"></div><div class="intensity-bulge over-3" style="width:11px;height:11px"></div></div><span class="intensity-label">130%</span></div>`}
      >
        <IntensityBar level={1.3} size={36} />
      </ComparisonPair>

      {/* ── 9. WorkoutPill ── */}
      <SectionHeader title="9. WorkoutPill" />

      {(['completed', 'active', 'next', 'upcoming', 'missed'] as const).map((status) => {
        const names: Record<string, string> = {
          completed: 'Upper A',
          active: 'Lower A',
          next: 'Upper B',
          upcoming: 'Lower B',
          missed: 'Core C',
        }
        const prefixes: Record<string, string> = {
          completed: '\u2713 ',
          missed: '\u2014 ',
        }
        const prefix = prefixes[status] ?? ''
        // The prototype's `active` state was renamed `current` in the component.
        const reactStatus = status === 'active' ? 'current' : status
        return (
          <ComparisonPair
            key={status}
            testId={`compare-workout-pill-${status}`}
            label={`WorkoutPill ${status}`}
            htmlContent={`<div class="workout-pill ${status}">${prefix}${names[status]}</div>`}
          >
            <WorkoutPill name={names[status]} status={reactStatus} />
          </ComparisonPair>
        )
      })}

      <ComparisonPair
        testId="compare-workout-pill-deload"
        label="WorkoutPill deload"
        htmlContent={`<div class="workout-pill deload">Deload A</div>`}
      >
        <WorkoutPill name="Deload A" status="deload" />
      </ComparisonPair>

      {/* ── 10. MuscleGroupChip ── */}
      <SectionHeader title="10. MuscleGroupChip" />

      {([
        { vs: 'ontrack', name: 'Chest' },
        { vs: 'target', name: 'Quads' },
        { vs: 'behind', name: 'Calves' },
        { vs: 'untrained', name: 'Abs' },
        { vs: 'over', name: 'Back' },
      ] as const).map(({ vs, name }) => (
        <ComparisonPair
          key={vs}
          testId={`compare-muscle-chip-${vs}`}
          label={`MuscleGroupChip ${vs}`}
          htmlContent={`<div class="muscle-chip"><div class="muscle-chip-dot ${vs}"></div>${name}</div>`}
        >
          <MuscleGroupChip name={name} volumeStatus={vs} />
        </ComparisonPair>
      ))}

      {/* ── 11. Sparkline ── */}
      <SectionHeader title="11. Sparkline" />
      <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' }}>
        Sparkline uses positioned divs in React -- dimension and container comparison only.
      </p>

      <ComparisonPair
        testId="compare-sparkline-ascending"
        label="Sparkline ascending"
        htmlContent={`<div class="sparkline-container" style="width:80px;height:30px;position:relative"></div>`}
      >
        <Sparkline data={[10, 20, 30, 40, 50]} width={80} height={30} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-sparkline-with-ref"
        label="Sparkline with reference line"
        htmlContent={`<div class="sparkline-container" style="width:80px;height:30px;position:relative"></div>`}
      >
        <Sparkline data={[10, 25, 15, 35, 20]} width={80} height={30} referenceLines={[{ value: 25, color: '#FFB020', dashed: true }]} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-sparkline-highlight"
        label="Sparkline highlight last"
        htmlContent={`<div class="sparkline-container" style="width:80px;height:30px;position:relative"></div>`}
      >
        <Sparkline data={[15, 20, 18, 25, 30]} width={80} height={30} highlightLast />
      </ComparisonPair>

      {/* ── 12. SetRow ── */}
      <SectionHeader title="12. SetRow" />

      <ComparisonPair
        testId="compare-set-row-completed"
        label="SetRow completed"
        htmlContent={`<div class="set-row completed-dim"><span class="col-set">1</span><span class="col-prev">6 x 175</span><span class="col-reps">6</span><span class="col-weight">175</span><span class="col-rpe">\u2014</span></div>`}
      >
        <SetRow mode="completed" setNumber={1} previous={{ reps: 6, weight: 175 }} reps={6} weight={175} unit="lbs" />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-set-row-active-next"
        label="SetRow active isNextSet"
        htmlContent={`<div class="set-row next-set"><span class="col-set">2</span><span class="col-prev">\u2014</span><span class="col-reps" style="color:var(--text-tertiary);font-style:italic;font-size:13px">8</span><span class="col-weight" style="color:var(--text-tertiary);font-style:italic;font-size:13px">185</span><span class="col-rpe">\u2014</span></div>`}
      >
        <SetRow mode="active" setNumber={2} reps={null} weight={null} unit="lbs" isNextSet targets={{ reps: 8, weight: 185 }} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-set-row-type-badge"
        label="SetRow with type badge"
        htmlContent={`<div class="set-row"><span class="col-set"><span class="set-type-badge">W</span></span><span class="col-prev">\u2014</span><span class="col-reps">10</span><span class="col-weight">95</span><span class="col-rpe">\u2014</span></div>`}
      >
        <SetRow mode="completed" setNumber={1} setType="W" reps={10} weight={95} unit="lbs" />
      </ComparisonPair>

      {/* ── 15. ExerciseCard ── */}
      <SectionHeader title="15. ExerciseCard" />

      <ComparisonPair
        testId="compare-exercise-card-collapsed"
        label="ExerciseCard collapsed"
        htmlContent={`<div class="exercise-card-comparison"><div class="ec-row1"><span class="ec-name">Bench Press</span><span style="flex:1"></span><span class="ec-summary">3\u00D76 @ 185 lbs</span></div></div>`}
      >
        <ExerciseCard name="Bench Press" state="collapsed" onToggle={() => {}} summary={{ sets: 3, reps: 6, weight: 185, unit: 'lbs' }} />
      </ComparisonPair>

      <ComparisonPair
        testId="compare-exercise-card-upcoming"
        label="ExerciseCard upcoming"
        htmlContent={`<div class="exercise-card-upcoming"><div class="ec-row1"><span class="ec-name">Overhead Press</span><span class="ec-prescription">3\u00D78-12 @ RPE 8</span><span class="ec-prev-best">135 lbs \u00D7 10</span></div></div>`}
      >
        <ExerciseCard name="Overhead Press" state="upcoming" onToggle={() => {}} prescription="3×8-12 @ RPE 8" previousBest="135 lbs × 10" />
      </ComparisonPair>

      {/* ── 16. SupersetWrapper ── */}
      <SectionHeader title="16. SupersetWrapper" />

      <ComparisonPair
        testId="compare-superset-wrapper-default"
        label="SupersetWrapper default"
        htmlContent={`<div class="superset-wrapper-comparison"><span class="sw-label">SS</span><div class="sw-children"><div class="sw-placeholder"></div><div class="sw-placeholder"></div></div></div>`}
      >
        <SupersetWrapper>
          <View style={{ height: 48, backgroundColor: '#1C1C1C', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 8 }} />
          <View style={{ height: 48, backgroundColor: '#1C1C1C', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 8 }} />
        </SupersetWrapper>
      </ComparisonPair>

      {/* ── 13. InputBar ── */}
      <SectionHeader title="13. InputBar" />

      <ComparisonPair
        testId="compare-input-bar-default"
        label="InputBar default"
        htmlContent={`<div class="input-bar-comparison"><div class="ib-info"><span class="ib-exercise">Bench Press</span><span class="ib-set">Set 3/4</span></div><div class="ib-fields"><span class="ib-field reps"></span><span class="ib-x">\u00D7</span><span class="ib-field weight"></span><span class="ib-unit">lbs</span></div><button class="ib-record">Record</button></div>`}
      >
        <InputBar exerciseName="Bench Press" setNumber={3} totalSets={4} reps="" weight="" unit="lbs" onRepsChange={() => {}} onWeightChange={() => {}} onRecord={() => {}} canRecord={false} visible />
      </ComparisonPair>

      {/* ── 14. RestTimer ── */}
      <SectionHeader title="14. RestTimer" />

      <ComparisonPair
        testId="compare-rest-timer-default"
        label="RestTimer default"
        htmlContent={`<div class="rest-timer-comparison"><div class="rt-top"><div><div class="rt-label">REST</div><div class="rt-context">Next: Set 3 \u2014 40 lbs</div></div><div class="rt-time">2:00</div></div><div class="rt-bar"><div class="rt-bar-fill" style="width:20%"></div></div><div class="rt-actions"><button class="rt-btn rt-add">+30s</button><button class="rt-btn rt-skip">Skip</button></div></div>`}
      >
        <RestTimer totalSeconds={150} elapsedMs={30000} onSkip={() => {}} onAddTime={() => {}} nextSetInfo="Next: Set 3 — 40 lbs" visible />
      </ComparisonPair>

    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
