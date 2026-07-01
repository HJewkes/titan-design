import React from 'react'

/* ─────────────────────────────────────────────────────────────────────────
   Specimen scaffold — Layer 1 visual-comparison tooling (TD-04.02)

   Reusable layout primitives for HTML-vs-React specimen pages. Downstream
   specimen sections (TD-04.03..08) compose these helpers: wrap each component
   family in a <Section>, place ground-truth HTML beside the React render with
   <CompareRow>, fan out sizes/states with <Variants>, and blow up sub-pixel
   atoms with <MagnifiedStrip>.

   Adapted from the brain-dashboard SpecimenView.tsx pattern to the titan-design
   DOM/react-native-web specimen convention (plain elements + inline styles,
   matching specimen/comparison.tsx) so it can host any react-native-web
   component without a StyleSheet dependency.

   ── Canonical token mapping ────────────────────────────────────────────────
   The specimen chrome hard-codes hex values so the page renders identically
   whether or not theme CSS is loaded. Each value below is the frozen twin of a
   canonical token in src/theme/global.css (:root, dark theme). Keep in sync.

     Specimen hex        Canonical token (global.css)      Role
     ----------------    ------------------------------    ------------------
     #FF7900             --color-brand-primary             brand / active
     #101010             --color-bg-base                   page background
     #191919             --color-surface-elevated          card / cell surface
     #1C1C1C             --color-surface-raised            raised surface
     #F3F4F6             --color-text-primary              primary text
     #9CA3AF             --color-text-secondary            secondary text
     #6B7280             --color-text-tertiary             labels / captions
     #1F1F1F             --color-border-default            hairline borders
     #2C2C2C             --color-border-strong             divider / strong edge
     'Space Grotesk'     --font-family-heading             headings / numerals
     'Inter'             --font-family-sans                body
     'Nunito Sans'       --font-family-body                UI labels
   ──────────────────────────────────────────────────────────────────────── */

export const specimenTokens = {
  brand: '#FF7900',
  bgBase: '#101010',
  surfaceElevated: '#191919',
  surfaceRaised: '#1C1C1C',
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  borderDefault: '#1F1F1F',
  borderStrong: '#2C2C2C',
  fontHeading: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontUi: "'Nunito Sans', sans-serif",
} as const

const captionStyle: React.CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  color: specimenTokens.textTertiary,
  fontFamily: specimenTokens.fontUi,
}

/** Titled section wrapper grouping related component specimens. */
export function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 40, scrollMarginTop: 20 }}>
      <h2
        style={{
          fontFamily: specimenTokens.fontHeading,
          fontSize: 18,
          fontWeight: 700,
          color: specimenTokens.textPrimary,
          margin: '0 0 4px',
          paddingBottom: 8,
          borderBottom: `1px solid ${specimenTokens.borderDefault}`,
        }}
      >
        {title}
      </h2>
      {desc ? (
        <p style={{ color: specimenTokens.textSecondary, fontSize: 12, margin: '0 0 16px' }}>
          {desc}
        </p>
      ) : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </section>
  )
}

/** Side-by-side row: HTML ground truth (left) vs React render (right). */
export function CompareRow({
  label,
  html,
  react,
}: {
  label: string
  html: React.ReactNode
  react: React.ReactNode
}) {
  return (
    <div
      data-testid={`compare-${label.replace(/\s+/g, '-').toLowerCase()}`}
      style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        padding: '12px 16px',
        background: specimenTokens.surfaceElevated,
        border: `1px solid ${specimenTokens.borderDefault}`,
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ ...captionStyle, marginBottom: 6 }}>HTML — {label}</div>
        <div className="html-version" style={{ display: 'flex', alignItems: 'flex-start' }}>
          {html}
        </div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: specimenTokens.borderStrong }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...captionStyle, marginBottom: 6 }}>React — {label}</div>
        <div className="react-version" style={{ display: 'flex', alignItems: 'flex-start' }}>
          {react}
        </div>
      </div>
    </div>
  )
}

/** Horizontal strip of variants, each captioned with a small label beneath. */
export function Variants({ items }: { items: Array<{ label: string; node: React.ReactNode }> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', minHeight: 24 }}>{item.node}</div>
          <span style={captionStyle}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Blows up sub-pixel atoms (dots, hairlines) to an explicit size for review. */
export function MagnifiedStrip({
  size,
  items,
}: {
  size: number
  items: Array<{ label: string; node: React.ReactNode }>
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 20,
        alignItems: 'flex-end',
        padding: '12px 16px',
        background: specimenTokens.surfaceRaised,
        border: `1px dashed ${specimenTokens.borderStrong}`,
        borderRadius: 8,
      }}
    >
      <span style={{ ...captionStyle, alignSelf: 'center' }}>magnified {size}px</span>
      {items.map((item, i) => (
        <div
          key={i}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: size,
              height: size,
            }}
          >
            {item.node}
          </div>
          <span style={captionStyle}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
