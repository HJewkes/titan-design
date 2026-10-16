import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

/**
 * Structure of the decision records in `docs/decisions/` (TD-229, TD-30 S1). Every numbered record
 * keeps the template's headings and a valid status, numbers run 1..n with no gap or duplicate, and
 * the index lists every file.
 */

const DECISIONS_DIR = path.resolve(__dirname, '../../../../docs/decisions')
const TEMPLATE = '0000-template.md'
const RECORD_NAME = /^(\d{4})-[a-z0-9-]+\.md$/

const REQUIRED_HEADINGS = [
  'Status',
  'Need',
  'Why existing tokens or primitives cannot serve it',
  'Options',
  'Rendered evidence',
  'Checks',
  'Decision',
  'Rejected alternatives',
  'Consequences',
]
const STATUSES = ['proposed', 'accepted', 'rejected', 'superseded']

interface DecisionFile {
  name: string
  text: string
}

function headings(text: string): string[] {
  return [...text.matchAll(/^## (.+)$/gm)].map((match) => match[1].trim())
}

function statusOf(text: string): string | undefined {
  const afterHeading = text.split(/^## Status$/m)[1]
  const firstLine = afterHeading?.split('\n').find((line) => line.trim() !== '')
  return firstLine?.trim().split(/\s+/)[0].toLowerCase()
}

function recordProblems({ name, text }: DecisionFile): string[] {
  const present = new Set(headings(text))
  const missing = REQUIRED_HEADINGS.filter((heading) => !present.has(heading))
  const problems = missing.map((heading) => `${name}: missing heading "## ${heading}"`)
  const status = statusOf(text)
  if (!status || !STATUSES.includes(status)) {
    problems.push(`${name}: status "${status ?? ''}" is not one of ${STATUSES.join(', ')}`)
  }
  return problems
}

function numberingProblems(records: DecisionFile[]): string[] {
  const numbers = records.map(({ name }) => Number(RECORD_NAME.exec(name)?.[1]))
  const problems = numbers
    .filter((n, i) => numbers.indexOf(n) !== i)
    .map((n) => `number ${String(n).padStart(4, '0')} is used more than once`)
  const highest = Math.max(0, ...numbers)
  for (let n = 1; n <= highest; n++) {
    if (!numbers.includes(n)) problems.push(`number ${String(n).padStart(4, '0')} is missing`)
  }
  return problems
}

function indexProblems(records: DecisionFile[], index: string): string[] {
  return records
    .filter(({ name }) => !index.includes(`](./${name})`))
    .map(({ name }) => `README.md does not list ${name}`)
}

function decisionProblems(files: DecisionFile[], index: string): string[] {
  const others = files.filter(({ name }) => name !== TEMPLATE)
  const records = others.filter(({ name }) => RECORD_NAME.test(name))
  const misnamed = others
    .filter(({ name }) => !RECORD_NAME.test(name))
    .map(({ name }) => `${name}: name is not NNNN-lowercase-slug.md`)
  return [
    ...misnamed,
    ...records.flatMap(recordProblems),
    ...numberingProblems(records),
    ...indexProblems(records, index),
  ]
}

function readDecisions(): { files: DecisionFile[]; index: string } {
  const files = fs
    .readdirSync(DECISIONS_DIR)
    .filter((name) => name !== 'README.md')
    .map((name) => ({ name, text: fs.readFileSync(path.join(DECISIONS_DIR, name), 'utf8') }))
  const index = fs.readFileSync(path.join(DECISIONS_DIR, 'README.md'), 'utf8')
  return { files, index }
}

const COMPLETE_RECORD = REQUIRED_HEADINGS.map((heading) =>
  heading === 'Status' ? '## Status\n\naccepted\n' : `## ${heading}\n\nText.\n`
).join('\n')

const fixture = (name: string, text = COMPLETE_RECORD): DecisionFile => ({ name, text })

describe('decision records', () => {
  it('every record in docs/decisions is well formed and indexed', () => {
    const { files, index } = readDecisions()

    const problems = decisionProblems(files, index)

    expect(problems).toEqual([])
  })

  it('the template keeps every required heading', () => {
    const { files } = readDecisions()
    const template = files.find(({ name }) => name === TEMPLATE)

    expect(template && headings(template.text)).toEqual(REQUIRED_HEADINGS)
  })

  it('the index and REJECTED.md link each other', () => {
    const { index } = readDecisions()
    const rejected = fs.readFileSync(path.resolve(__dirname, '../../REJECTED.md'), 'utf8')

    expect(index).toContain('](../../packages/ui/REJECTED.md)')
    expect(rejected).toContain('](../../docs/decisions/README.md)')
  })

  it('fails a record missing "Rejected alternatives"', () => {
    const text = COMPLETE_RECORD.replace('## Rejected alternatives', '## Alternatives')

    const problems = decisionProblems([fixture('0001-a.md', text)], '](./0001-a.md)')

    expect(problems).toEqual(['0001-a.md: missing heading "## Rejected alternatives"'])
  })

  it('fails a record whose status is not a known one', () => {
    const text = COMPLETE_RECORD.replace('accepted', 'approved')

    const problems = decisionProblems([fixture('0001-a.md', text)], '](./0001-a.md)')

    expect(problems).toEqual([
      '0001-a.md: status "approved" is not one of proposed, accepted, rejected, superseded',
    ])
  })

  it('fails a duplicate number and a gap', () => {
    const files = [fixture('0001-a.md'), fixture('0001-b.md'), fixture('0003-c.md')]
    const index = '](./0001-a.md) ](./0001-b.md) ](./0003-c.md)'

    const problems = decisionProblems(files, index)

    expect(problems).toEqual(['number 0001 is used more than once', 'number 0002 is missing'])
  })

  it('fails a file that is not named NNNN-slug.md', () => {
    const problems = decisionProblems([fixture('2-colour.md')], '')

    expect(problems).toEqual(['2-colour.md: name is not NNNN-lowercase-slug.md'])
  })

  it('fails a record the index does not list', () => {
    const problems = decisionProblems(
      [fixture('0001-a.md'), fixture('0002-b.md')],
      '](./0001-a.md)'
    )

    expect(problems).toEqual(['README.md does not list 0002-b.md'])
  })
})
