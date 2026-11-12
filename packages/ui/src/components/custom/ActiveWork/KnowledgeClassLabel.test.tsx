import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { KnowledgeClassLabel } from './KnowledgeClassLabel'
import { KNOWLEDGE_CLASS_ORDER } from './knowledge-class'

describe('KnowledgeClassLabel', () => {
  it('names the class beside its dot', () => {
    render(<KnowledgeClassLabel knowledgeClass="note" />)
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByTestId('knowledge-class-dot-note')).toBeInTheDocument()
  })

  it('reads a plural wire name as its class', () => {
    render(<KnowledgeClassLabel knowledgeClass="nested_sources" />)
    expect(screen.getByText('Nested source')).toBeInTheDocument()
    expect(screen.getByTestId('knowledge-class-dot-nested_source')).toBeInTheDocument()
  })

  it('reads the plural label when asked', () => {
    render(<KnowledgeClassLabel knowledgeClass="session" isPlural />)
    expect(screen.getByText('Sessions')).toBeInTheDocument()
  })

  it('shows an unknown class by its raw name beside a neutral dot', () => {
    render(<KnowledgeClassLabel knowledgeClass="artifact" />)
    expect(screen.getByText('artifact')).toBeInTheDocument()
    expect(screen.getByTestId('knowledge-class-dot-unknown')).toBeInTheDocument()
  })

  it('keeps the name as an accessible label when only the dot shows', () => {
    render(<KnowledgeClassLabel knowledgeClass="task" dotOnly />)
    expect(screen.queryByText('Task')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Task' })).toBeInTheDocument()
  })

  it('renders every class', () => {
    for (const knowledgeClass of KNOWLEDGE_CLASS_ORDER) {
      const { unmount } = render(<KnowledgeClassLabel knowledgeClass={knowledgeClass} />)
      expect(screen.getByTestId(`knowledge-class-dot-${knowledgeClass}`)).toBeInTheDocument()
      unmount()
    }
  })

  it('has no a11y violations', async () => {
    const { container } = render(
      <>
        <KnowledgeClassLabel knowledgeClass="source" />
        <KnowledgeClassLabel knowledgeClass="artifact" />
        <KnowledgeClassLabel knowledgeClass="transcript" dotOnly />
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
