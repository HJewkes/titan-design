import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedByNode } from '../../../test/classname-capture'
import { MenuGroup } from '../menu'
import { StatCardHeader } from '../stat-card'
import { Table, TableHeader, TableHeaderCell, TableRow } from '../table'
import { Eyebrow } from './Eyebrow'

const classesOf = (text: string) => (capturedByNode.get(screen.getByText(text)) ?? '').split(/\s+/)

const OVERLINE = ['font-body', 'text-xs', 'font-semibold', 'uppercase', 'tracking-widest']

function renderHeaderCell(label: string) {
  return render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>{label}</TableHeaderCell>
        </TableRow>
      </TableHeader>
    </Table>
  )
}

/**
 * One eyebrow treatment (TD-783, owner D2): every uppercase label is `overline` on
 * `text-secondary` with the variant's own tracking. Tile's 10px `microLabel` is pinned in its own test.
 */
describe('uppercase labels share one eyebrow treatment', () => {
  it.each([
    ['Eyebrow', () => render(<Eyebrow>Focused</Eyebrow>), 'Focused'],
    ['StatCardHeader', () => render(<StatCardHeader title="Velocity" />), 'Velocity'],
    ['MenuGroup', () => render(<MenuGroup label="Actions" />), 'Actions'],
    ['TableHeaderCell', () => renderHeaderCell('Load'), 'Load'],
  ] as const)('%s renders its label on text-secondary', (_name, renderSite, label) => {
    renderSite()
    const classes = classesOf(label)
    expect(classes).toEqual(expect.arrayContaining([...OVERLINE, 'text-text-secondary']))
    expect(classes).not.toContain('text-text-tertiary')
    expect(classes).not.toContain('tracking-wider')
  })

  it('keeps a sorted column header on text-primary', () => {
    render(
      <Table sortColumn="load" sortDirection="asc" onSort={() => {}}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell sortKey="load">Load</TableHeaderCell>
          </TableRow>
        </TableHeader>
      </Table>
    )
    expect(classesOf('Load')).toContain('text-text-primary')
    expect(classesOf('Load')).not.toContain('text-text-secondary')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<StatCardHeader title="Velocity" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
