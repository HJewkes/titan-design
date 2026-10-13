import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { EvidenceChip } from './EvidenceChip'
import { EVIDENCE_KINDS, type EvidenceKind } from './evidence'
import { beatFixture } from './__fixtures__/evidence-chips'
import { capturedClassNames } from '../../../test/classname-capture'

const LONG = beatFixture('a7-9-machine').chips[0].text
const classesOf = (testID: string) => (capturedClassNames.get(testID) ?? '').split(/\s+/)

describe('EvidenceChip', () => {
  it.each<[EvidenceKind, string]>([
    ['verified', 'bg-status-success-subtle'],
    ['measured', 'bg-status-success-subtle'],
    ['computed', 'bg-status-success-subtle'],
    ['docs-claim', 'bg-status-info-subtle'],
    ['estimated', 'bg-status-info-subtle'],
    ['target', 'bg-status-info-subtle'],
    ['our-framing', 'bg-hairline-subtle'],
    ['reconstructed', 'bg-status-warning-subtle'],
    ['illustrative', 'bg-status-warning-subtle'],
  ])('paints a %s chip with %s', (kind, fill) => {
    render(<EvidenceChip kind={kind} text="notes.md:12" />)
    expect(classesOf('evidence-chip-kind')).toContain(fill)
  })

  it('names the kind in words, so colour is never the only signal', () => {
    render(<EvidenceChip kind="docs-claim" text="notes.md:12" />)
    expect(screen.getByText('docs claim')).toBeInTheDocument()
  })

  it('elides the visible citation but keeps the full one in the accessible name', () => {
    render(<EvidenceChip kind="verified" text={LONG} maxChars={46} />)
    expect(screen.getByText('ab@3f9c21e:…/stop-rules.ts:361-385 +2')).toBeInTheDocument()
    expect(screen.getByLabelText(`verified: ${LONG}`)).toBeInTheDocument()
  })

  it('sets the citation in the mono face, which turns ligatures off', () => {
    render(<EvidenceChip kind="verified" text="notes.md:12" />)
    expect(classesOf('evidence-chip-source')).toContain('font-mono')
  })

  it('scales label, citation and padding to a video font size', () => {
    render(<EvidenceChip kind="verified" text="notes.md:12" fontPx={40} />)
    expect(screen.getByText('verified').style.fontSize).toBe('40px')
    expect(screen.getByText('notes.md:12').style.fontSize).toBe('40px')
    expect(screen.getByTestId('evidence-chip-kind').style.paddingLeft).toBe(`${(16 * 40) / 14}px`)
  })

  it.each(['dark', 'light'])('has no accessibility violations for any kind in %s', async (theme) => {
    const { container } = render(
      <div className={theme === 'light' ? 'light' : undefined}>
        {EVIDENCE_KINDS.map((kind) => (
          <EvidenceChip key={kind} kind={kind} text={LONG} fontPx={40} maxChars={60} />
        ))}
      </div>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
