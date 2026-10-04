import { describe, it, expect } from 'vitest'
import {
  checkReleaseBump,
  classifyApiDiff,
  requiredBump,
  versionBump,
} from '../../scripts/check-release-bump.mjs'

const BASE_INDEX = [
  '## API Report File for "@titan-design/react-ui"',
  '',
  'export function Button(props: ButtonProps): JSX.Element;',
  '',
  'export function Card(props: CardProps): JSX.Element;',
  '',
].join('\n')

const WITH_CHIP = BASE_INDEX.replace(
  'export function Card',
  'export function Chip(props: ChipProps): JSX.Element;\n\nexport function Card'
)
const WITHOUT_CARD = BASE_INDEX.replace(
  'export function Card(props: CardProps): JSX.Element;\n',
  ''
)
const CARD_RESIGNED = BASE_INDEX.replace(
  'Card(props: CardProps)',
  'Card(props: CardProps, ref: Ref)'
)

function check(headIndex: string, headVersion: string, baseReports = { index: BASE_INDEX }) {
  return checkReleaseBump({
    baseRef: 'v0.22.0',
    baseReports,
    headReports: { index: headIndex },
    baseVersion: '0.22.0',
    headVersion,
  })
}

describe('classifyApiDiff', () => {
  it('reads identical reports as no change', () => {
    expect(classifyApiDiff({ index: BASE_INDEX }, { index: BASE_INDEX })).toBe('none')
  })

  it('reads a new export as additive', () => {
    expect(classifyApiDiff({ index: BASE_INDEX }, { index: WITH_CHIP })).toBe('additive')
  })

  it('reads a new report as additive', () => {
    const head = { index: BASE_INDEX, pages: 'export function Page(): JSX.Element;\n' }
    expect(classifyApiDiff({ index: BASE_INDEX }, head)).toBe('additive')
  })

  it('reads a removed export as breaking', () => {
    expect(classifyApiDiff({ index: BASE_INDEX }, { index: WITHOUT_CARD })).toBe('breaking')
  })

  it('reads a changed signature as breaking even when other lines are added', () => {
    const head = CARD_RESIGNED.replace(
      'export function Button',
      'export const Badge: FC;\n\nexport function Button'
    )
    expect(classifyApiDiff({ index: BASE_INDEX }, { index: head })).toBe('breaking')
  })

  it('reads a removed report as breaking', () => {
    const base = { index: BASE_INDEX, pages: 'export function Page(): JSX.Element;\n' }
    expect(classifyApiDiff(base, { index: BASE_INDEX })).toBe('breaking')
  })
})

describe('requiredBump', () => {
  it('asks a minor for breaking and a patch for additive in 0.x', () => {
    expect(requiredBump('breaking', '0.21.2')).toBe('minor')
    expect(requiredBump('additive', '0.21.2')).toBe('patch')
  })

  it('asks a major for breaking from 1.0 on', () => {
    expect(requiredBump('breaking', '1.0.0')).toBe('major')
    expect(requiredBump('additive', '1.4.2')).toBe('minor')
  })

  it('asks nothing when the API is unchanged', () => {
    expect(requiredBump('none', '0.21.2')).toBe('none')
  })
})

describe('versionBump', () => {
  it('names the highest level that grew', () => {
    expect(versionBump('0.21.2', '0.21.3')).toBe('patch')
    expect(versionBump('0.21.2', '0.22.0')).toBe('minor')
    expect(versionBump('0.21.2', '1.0.0')).toBe('major')
    expect(versionBump('0.21.2', '0.21.2')).toBe('none')
    expect(versionBump('0.21.2', '0.20.9')).toBe('downgrade')
  })
})

describe('checkReleaseBump', () => {
  it('fails a removed export released as a patch', () => {
    const result = check(WITHOUT_CARD, '0.22.1')
    expect(result.status).toBe('fail')
    expect(result.message).toContain('breaking in index')
    expect(result.message).toContain('needs at least a minor bump from 0.22.0')
  })

  it('passes a changed signature released as a minor in 0.x', () => {
    expect(check(CARD_RESIGNED, '0.23.0').status).toBe('pass')
  })

  it('passes an additions-only diff released as a patch', () => {
    expect(check(WITH_CHIP, '0.22.1').status).toBe('pass')
  })

  it('skips with a message when the base has no reports', () => {
    const result = check(WITH_CHIP, '0.22.1', {})
    expect(result).toEqual({ status: 'skip', message: 'v0.22.0 has no API reports in api/' })
  })

  it('skips when the version is unchanged', () => {
    expect(check(WITHOUT_CARD, '0.22.0').status).toBe('skip')
  })

  it('fails a version downgrade', () => {
    expect(check(BASE_INDEX, '0.21.9').status).toBe('fail')
  })
})
