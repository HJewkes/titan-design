import React from 'react'
import { createRoot } from 'react-dom/client'
import '../src/theme/global.css'

import { StatusDot } from '../src/components/custom/Workout/StatusDot'
import type { StatusDotVariant } from '../src/components/custom/Workout/StatusDot'
import { WeightBadge } from '../src/components/custom/Workout/WeightBadge'

import { CompareRow, MagnifiedStrip, Section, Variants, specimenTokens } from './scaffold'

/* HTML ground-truth primitives — raw DOM matching the prototype exactly. */

function HtmlDot({ size, color }: { size: number; color: string }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
      }}
    />
  )
}

const STATUS_DOT_VARIANTS: StatusDotVariant[] = [
  'success',
  'warning',
  'error',
  'neutral',
  'on-track',
  'deviation',
  'future',
]

const STATUS_DOT_HEX: Record<StatusDotVariant, string> = {
  success: '#14B8A6',
  warning: '#FFB020',
  error: '#D14343',
  neutral: '#6B7280',
  'on-track': '#14B8A6',
  deviation: '#FFB020',
  future: '#2C2C2C',
}

/**
 * Scaffold demo page. Proves the Section / CompareRow / Variants /
 * MagnifiedStrip helpers render real react-native-web components beside their
 * HTML ground truth. Downstream tickets (TD-04.03..08) extend this file with
 * one <Section> per component family.
 */
function App() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <h1
        style={{
          fontFamily: specimenTokens.fontHeading,
          fontSize: 24,
          fontWeight: 700,
          color: specimenTokens.textPrimary,
          margin: '0 0 4px',
        }}
      >
        Titan Design — Specimen
      </h1>
      <p style={{ color: specimenTokens.textSecondary, fontSize: 12, margin: '0 0 28px' }}>
        Layer 1 visual comparison scaffold. HTML ground truth (left) vs React (right).
      </p>

      <Section title="StatusDot" desc="Status indicator dot across every variant.">
        <CompareRow
          label="all variants"
          html={
            <Variants
              items={STATUS_DOT_VARIANTS.map((v) => ({
                label: v,
                node: <HtmlDot size={8} color={STATUS_DOT_HEX[v]} />,
              }))}
            />
          }
          react={
            <Variants
              items={STATUS_DOT_VARIANTS.map((v) => ({
                label: v,
                node: <StatusDot variant={v} />,
              }))}
            />
          }
        />
        <div style={{ marginTop: 12 }}>
          <MagnifiedStrip
            size={40}
            items={STATUS_DOT_VARIANTS.map((v) => ({
              label: v,
              node: <StatusDot variant={v} size="md" />,
            }))}
          />
        </div>
      </Section>

      <Section title="WeightBadge" desc="Estimated 1RM / N-rep-max load badge.">
        <CompareRow
          label="sizes"
          html={
            <Variants
              items={(['sm', 'md', 'lg'] as const).map((size) => ({
                label: size,
                node: (
                  <span
                    style={{
                      fontFamily: specimenTokens.fontHeading,
                      fontSize: size === 'sm' ? 9 : size === 'md' ? 10 : 12,
                      fontWeight: 600,
                      color: specimenTokens.textSecondary,
                      border: `1px solid ${specimenTokens.borderDefault}`,
                      borderRadius: 2,
                      padding: '2px 8px',
                      background: specimenTokens.surfaceRaised,
                    }}
                  >
                    217 lbs
                  </span>
                ),
              }))}
            />
          }
          react={
            <Variants
              items={(['sm', 'md', 'lg'] as const).map((size) => ({
                label: size,
                node: <WeightBadge value={217} size={size} />,
              }))}
            />
          }
        />
      </Section>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<App />)
}
