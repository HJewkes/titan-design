import { describe, expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { collectLiterals, compare, diffLiterals } from './compare-classnames.mjs'

const SCRIPT = resolve('scripts/compare-classnames.mjs')

const BEFORE = `
import { cn } from '@/utils/cn'
export const Label = ({ on }) => (
  <Text className={cn('text-[10px] font-bold', on && \`px-2 \${on}\`)}>x</Text>
)
`

describe('collectLiterals', () => {
  it('finds literals inside cn(), JSX attributes and template static parts', () => {
    const src = `${BEFORE}\nconst a = <View className="flex gap-2" />`
    expect(collectLiterals(src)).toEqual(['text-[10px] font-bold', 'px-2', 'flex gap-2'])
  })

  it('ignores import specifiers and type literals', () => {
    expect(collectLiterals(`import x from './x'\ntype T = 'a' | 'b'`)).toEqual([])
  })
})

describe('diffLiterals', () => {
  it('fails a text-[10px] to text-[11px] mutation', () => {
    const after = BEFORE.replace('text-[10px]', 'text-[11px]')
    const changes = diffLiterals(collectLiterals(BEFORE), collectLiterals(after))
    expect(changes).toEqual([
      { text: 'text-[10px] font-bold', before: 1, after: 0 },
      { text: 'text-[11px] font-bold', before: 0, after: 1 },
    ])
  })

  it('reports a literal whose count changes', () => {
    expect(diffLiterals(['a'], ['a', 'a'])).toEqual([{ text: 'a', before: 1, after: 2 }])
  })

  it('ignores order and whitespace', () => {
    const one = collectLiterals(`x('a  b'); y('c')`)
    const two = collectLiterals(`y('c'); x('a b')`)
    expect(diffLiterals(one, two)).toEqual([])
  })
})

describe('compare against a git ref', () => {
  const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' })
  const setup = () => {
    const dir = mkdtempSync(join(tmpdir(), 'compare-classnames-'))
    run(dir, 'init', '-q')
    run(dir, 'config', 'user.email', 't@example.com')
    run(dir, 'config', 'user.name', 't')
    mkdirSync(join(dir, 'Comp'))
    writeFileSync(
      join(dir, 'Comp', 'Comp.tsx'),
      `export const A = () => <View className="p-2" />\nexport const B = () => <Text className="text-[10px]" />\n`
    )
    run(dir, 'add', '.')
    run(dir, 'commit', '-qm', 'base')
    return dir
  }

  it('passes when a component moves into a sibling file unchanged', () => {
    const dir = setup()
    try {
      writeFileSync(
        join(dir, 'Comp', 'Comp.tsx'),
        `export const A = () => <View className="p-2" />\n`
      )
      writeFileSync(
        join(dir, 'Comp', 'CompText.tsx'),
        `export const B = () => <Text className="text-[10px]" />\n`
      )
      expect(compare('HEAD', ['Comp'], dir)).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('fails when the moved component changes a class', () => {
    const dir = setup()
    try {
      writeFileSync(
        join(dir, 'Comp', 'Comp.tsx'),
        `export const A = () => <View className="p-2" />\n`
      )
      writeFileSync(
        join(dir, 'Comp', 'CompText.tsx'),
        `export const B = () => <Text className="text-[11px]" />\n`
      )
      expect(compare('HEAD', ['Comp'], dir).map((c) => c.text)).toEqual([
        'text-[10px]',
        'text-[11px]',
      ])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('failure guards', () => {
  const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' })
  const withRepo = (files, fn) => {
    const dir = mkdtempSync(join(tmpdir(), 'compare-classnames-'))
    try {
      run(dir, 'init', '-q')
      run(dir, 'config', 'user.email', 't@example.com')
      run(dir, 'config', 'user.name', 't')
      mkdirSync(join(dir, 'Comp'))
      for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text)
      run(dir, 'add', '.')
      run(dir, 'commit', '-qm', 'base')
      fn(dir)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }
  const cli = (cwd, ...args) => spawnSync('node', [SCRIPT, ...args], { cwd, encoding: 'utf8' })
  const expectOneLineFailure = (result, message) => {
    expect(result.status).not.toBe(0)
    expect(result.status).not.toBe(1)
    expect(result.stderr).toMatch(message)
    expect(result.stderr.trim().split('\n')).toHaveLength(1)
    expect(result.stderr).not.toMatch(/\n\s+at /)
  }
  const GOOD = { 'Comp/Comp.tsx': `export const A = () => <View className="p-2" />\n` }

  it('fails with one line when a named path matches no file on either side', () => {
    withRepo(GOOD, (dir) => {
      expect(() => compare('HEAD', ['Comp/Typo.tsx'], dir)).toThrow(/no file matches/)
      expectOneLineFailure(cli(dir, 'HEAD', 'Comp/Typo.tsx'), /no file matches.*Comp\/Typo\.tsx/)
    })
  })

  it('accepts a path that exists only in the working tree', () => {
    withRepo(GOOD, (dir) => {
      writeFileSync(
        join(dir, 'Comp', 'New.tsx'),
        `export const B = () => <View className="p-2" />\n`
      )
      expect(() => compare('HEAD', ['Comp/New.tsx'], dir)).not.toThrow()
    })
  })

  it('accepts a path that exists only at the base ref', () => {
    withRepo(GOOD, (dir) => {
      rmSync(join(dir, 'Comp', 'Comp.tsx'))
      expect(() => compare('HEAD', ['Comp/Comp.tsx'], dir)).not.toThrow()
    })
  })

  it('fails with one line when the base ref does not resolve', () => {
    withRepo(GOOD, (dir) => {
      expect(() => compare('no-such-ref', ['Comp'], dir)).toThrow(/does not resolve/)
      expectOneLineFailure(cli(dir, 'no-such-ref', 'Comp'), /no-such-ref.*does not resolve/)
    })
  })

  it('fails with one line when a file has a syntax error', () => {
    withRepo(GOOD, (dir) => {
      writeFileSync(join(dir, 'Comp', 'Comp.tsx'), `export const A = () => <View className="p-2"\n`)
      expect(() => compare('HEAD', ['Comp'], dir)).toThrow(/syntax error/)
      expectOneLineFailure(cli(dir, 'HEAD', 'Comp'), /syntax error.*Comp\.tsx/)
    })
  })

  it('skips test and stories files even when their strings change', () => {
    withRepo(
      {
        ...GOOD,
        'Comp/Comp.test.tsx': `it('a', () => x('one'))\n`,
        'Comp/Comp.stories.tsx': `export const S = () => <View className="m-1" />\n`,
      },
      (dir) => {
        writeFileSync(join(dir, 'Comp', 'Comp.test.tsx'), `it('a', () => x('two'))\n`)
        writeFileSync(
          join(dir, 'Comp', 'Comp.stories.tsx'),
          `export const S = () => <View className="m-2" />\n`
        )
        expect(compare('HEAD', ['Comp'], dir)).toEqual([])
      }
    )
  })
})
