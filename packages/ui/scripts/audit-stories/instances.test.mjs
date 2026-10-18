// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { inInstance, instanceRoots, isPageScope, isSpecimen } from './instances.mjs'

const BOX = [0, 0, 10, 10]
const node = (id, parent, ink = BOX) => ({ id, parent, ink })
// A wrapper (0) around a wrapper (0.0) around a grid (0.0.0) of three inked cells and one empty one.
const gridTree = {
  nodes: [
    node('0', null),
    node('0.0', '0'),
    node('0.0.0', '0.0'),
    node('0.0.0.0', '0.0.0'),
    node('0.0.0.1', '0.0.0'),
    node('0.0.0.2', '0.0.0'),
    node('0.0.0.3', '0.0.0', null),
  ],
}
const story = (id, title = 'Components/Atoms/Chip') => ({ id, title })

describe('instanceRoots', () => {
  it.each([
    'components-atoms-chip--all-sizes',
    'components-atoms-chip--variants',
    'components-atoms-chip--colors',
    'components-atoms-chip--colours',
    'components-atoms-chip--states',
    'components-atoms-chip--icon-gallery',
  ])('treats each inked cell under the wrappers of %s as one instance', (id) => {
    expect(instanceRoots(gridTree, story(id))).toEqual(['0.0.0.0', '0.0.0.1', '0.0.0.2'])
  })

  it.each(['components-atoms-chip--default', 'components-atoms-chip--install', 'a--smallest'])(
    'treats the whole root of %s as one instance',
    (id) => {
      expect(instanceRoots(gridTree, story(id))).toEqual([null])
    }
  )

  it('matches the export name only, not the title part of the id', () => {
    expect(instanceRoots(gridTree, story('foundations-all-colours--default'))).toEqual([null])
  })

  it('stops at several inked top-level nodes and splits a grid story there', () => {
    const flat = { nodes: [node('0', null), node('1', null), node('2', null, null)] }

    expect(instanceRoots(flat, story('x--all-variants'))).toEqual(['0', '1'])
  })

  it('gives the whole root for a grid story with a single leaf', () => {
    const single = { nodes: [node('0', null), node('0.0', '0')] }

    expect(instanceRoots(single, story('x--sizes'))).toEqual([null])
  })

  it('gives the whole root for an empty layout', () => {
    expect(instanceRoots({ nodes: [] }, story('x--matrix'))).toEqual([null])
  })
})

describe('inInstance', () => {
  it('holds a node, its descendants and nothing beside them', () => {
    expect(inInstance('0.1', '0.1')).toBe(true)
    expect(inInstance('0.1.4', '0.1')).toBe(true)
    expect(inInstance('0.10', '0.1')).toBe(false)
    expect(inInstance('0.2', '0.1')).toBe(false)
  })

  it('puts every node in the whole-root instance', () => {
    expect(inInstance('3.2.1', null)).toBe(true)
  })
})

describe('story scope', () => {
  it.each([
    ['Pages/Training Status', true, false],
    ['Shell/Workout/SessionStatePill', true, false],
    ['Foundations/Typography', false, true],
    ['Components/Atoms/Chip', false, false],
    ['Custom/Workout/SetRow', false, false],
  ])('classifies %s', (title, page, specimen) => {
    const s = story('x--default', title)

    expect(isPageScope(s)).toBe(page)
    expect(isSpecimen(s)).toBe(specimen)
  })

  it('does not match a title that only contains the group name', () => {
    expect(isPageScope(story('x--y', 'Components/Pages'))).toBe(false)
    expect(isSpecimen(story('x--y', 'Lab/Foundations'))).toBe(false)
  })
})
