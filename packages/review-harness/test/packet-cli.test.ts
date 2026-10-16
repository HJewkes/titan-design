import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PACKAGER_PROMPT } from '../src/packet-cli.ts'
import { runCli } from '../src/run.ts'
import { HEAD, cliIo, fakeCi, fromCiArgs, tempDir, world } from './packet-fake.ts'
import { OTHER_HEAD, packetDir, readPacket, validProse, writeJsonFile } from './packet-lint-fake.ts'

async function run(args: string[]) {
  const stdout: string[] = []
  const stderr: string[] = []
  const io = { ...cliIo(fakeCi(world()).io, stderr), stdout: (t: string) => stdout.push(t) }
  const code = await runCli(args, io)
  return { code, stdout: stdout.join(''), stderr: stderr.join('\n') }
}

const lintArgs = (dir: string, ...extra: string[]) => ['packet', 'lint', dir, ...extra]

async function cleanDir() {
  const dir = await packetDir()
  await writeJsonFile(dir, 'prose.json', await validProse(dir))
  return dir
}

describe('packet lint command', () => {
  it('exits 0 on a clean packet and prints one JSON object under --json', async () => {
    const dir = await cleanDir()

    const { code, stdout } = await run(
      lintArgs(dir, '--gate-head', HEAD, '--require', 'prose', '--json')
    )

    expect(JSON.parse(stdout)).toEqual({
      schema: 'titan-review/packet-lint@1',
      ok: true,
      packetId: (await readPacket(dir)).packetId,
      problems: [],
    })
    expect(code).toBe(0)
  })

  it('passes each listed requirement through to the lint', async () => {
    const dir = await cleanDir()

    const { code, stdout } = await run(
      lintArgs(dir, '--gate-head', HEAD, '--require', 'prose,round', '--json')
    )

    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      problems: [
        { rule: 'round-missing', message: 'round.json is required but not present' },
        {
          rule: 'frames-missing',
          message: 'frames/frames.json is required with round.json but not present',
        },
      ],
    })
    expect(code).toBe(3)
  })

  it('gives packetId null when packet.json does not parse', async () => {
    const dir = await cleanDir()
    await writeFile(join(dir, 'packet.json'), '{')

    const { code, stdout } = await run(lintArgs(dir, '--gate-head', HEAD, '--json'))

    expect(JSON.parse(stdout)).toEqual({
      schema: 'titan-review/packet-lint@1',
      ok: false,
      packetId: null,
      problems: [{ rule: 'packet-schema', message: 'packet.json is not JSON' }],
    })
    expect(code).toBe(3)
  })

  it('exits 3 with one problem per broken rule on a tampered packet', async () => {
    const dir = await cleanDir()
    await writeFile(join(dir, 'notes.txt'), 'extra')

    const { code, stdout } = await run(lintArgs(dir, '--gate-head', OTHER_HEAD, '--json'))

    const rules = JSON.parse(stdout).problems.map((p: { rule: string }) => p.rule)
    expect(rules.sort()).toEqual(['draft-head', 'file-extra', 'gate-head', 'prose-binding'])
    expect(code).toBe(3)
  })

  it('prints each problem as rule: message without --json', async () => {
    const dir = await packetDir()

    const { code, stdout } = await run(lintArgs(dir, '--gate-head', HEAD, '--require', 'prose'))

    expect(stdout).toBe('prose-missing: prose.json is required but not present\n')
    expect(code).toBe(3)
  })

  it('refuses without --gate-head rather than trusting the packet head', async () => {
    const { code, stdout, stderr } = await run(lintArgs(await cleanDir()))

    expect(code).toBe(2)
    expect(stdout).toBe('')
    expect(stderr).toContain('packet lint needs --gate-head')
    expect(stderr).toContain('titan-review packet lint <dir>')
  })

  it('refuses a short gate head and an unknown requirement', async () => {
    const dir = await cleanDir()

    expect((await run(lintArgs(dir, '--gate-head', 'abc123'))).code).toBe(2)
    const unknown = await run(lintArgs(dir, '--gate-head', HEAD, '--require', 'prose,frames'))
    expect(unknown.code).toBe(2)
    expect(unknown.stderr).toContain('--require takes prose, round')
  })

  it('re-derives from git with --clone, reading through the CLI io', async () => {
    const dir = await cleanDir()

    const { code, stdout } = await run(
      lintArgs(dir, '--gate-head', HEAD, '--clone', await tempDir(), '--json')
    )

    const rules = JSON.parse(stdout).problems.map((p: { rule: string }) => p.rule)
    expect(rules).toEqual(['before-source'])
    expect(code).toBe(3)
  })

  it('refuses a --clone that is not a directory', async () => {
    const missing = join(await tempDir(), 'absent')

    const { code, stderr } = await run(
      lintArgs(await cleanDir(), '--gate-head', HEAD, '--clone', missing)
    )

    expect(code).toBe(2)
    expect(stderr).toContain('--clone must be a directory')
  })

  it('exits 2 on a directory it cannot read', async () => {
    const missing = join(await tempDir(), 'absent')

    const { code, stderr } = await run(lintArgs(missing, '--gate-head', HEAD, '--json'))

    expect(code).toBe(2)
    expect(stderr).toContain('not a readable directory')
  })
})

describe('packet prompt command', () => {
  it('prints the prompt file byte for byte', async () => {
    const { code, stdout } = await run(['packet', 'prompt'])

    expect(code).toBe(0)
    expect(stdout).toBe(await readFile(PACKAGER_PROMPT, 'utf8'))
  })
})

describe('packet command', () => {
  it('refuses an unknown verb, naming the ones it has', async () => {
    const { code, stderr } = await run(['packet', 'serve'])

    expect(code).toBe(2)
    expect(stderr).toContain('expected: packet from-ci | lint | round | prompt')
  })

  it('puts the --side questions into the from-ci draft', async () => {
    const out = join(await tempDir(), 'packet')
    const side = join(await tempDir(), 'side.json')
    const question = {
      id: 'bundle',
      kind: 'pick-one',
      prompt: 'Accept the bundle growth?',
      options: ['Accept', 'Shrink first'],
      signsOff: 'the 2 kB growth of the ESM entry',
      decision: 'decide',
      implemented: 'Accept',
    }
    await writeFile(side, JSON.stringify([question]))

    const { code } = await run(fromCiArgs(out, ['--side', side]))

    expect(code).toBe(0)
    const draft = JSON.parse(await readFile(join(out, 'draft.json'), 'utf8'))
    expect(draft.questions.map((q: { id: string }) => q.id)).toContain('bundle')
  })
})
