// The packager prompt must name exactly the fields ProseSchema has, with its caps, and its example
// must pass the lint: renaming a field on either side fails here.
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { PACKAGER_PROMPT } from '../src/packet-cli.ts'
import { PACKET_LINT_RULES } from '../src/packet-lint.ts'
import { PROSE_LIMITS, ProseSchema } from '../src/packet-prose.ts'
import { lint, packetDir, readPacket, writeJsonFile } from './packet-lint-fake.ts'

const prompt = await readFile(PACKAGER_PROMPT, 'utf8')

/** The body of the `##`/`###` section titled `title`, up to the next heading of that level or higher. */
function section(text: string, title: string): string {
  const level = title.match(/^#+/)![0].length
  const lines = text.split('\n')
  const start = lines.indexOf(title)
  expect(start, `prompt has a "${title}" heading`).toBeGreaterThanOrEqual(0)
  const end = lines.findIndex(
    (l, i) => i > start && /^#+ /.test(l) && l.match(/^#+/)![0].length <= level
  )
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n')
}

const fieldsSection = section(prompt, '## Fields')
const headings = [...fieldsSection.matchAll(/^### (\S+)$/gm)].map((m) => m[1])
const ticked = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1])

/** The keys of a field's object, or of its array's item object; none for a scalar field. */
function nestedKeys(schema: z.ZodType): string[] {
  const inner = schema instanceof z.ZodArray ? schema.element : schema
  return inner instanceof z.ZodObject ? Object.keys(inner.shape) : []
}

describe('review-packager prompt', () => {
  it('has one field heading per ProseSchema key, and none the schema lacks', () => {
    expect(headings).toEqual(Object.keys(ProseSchema.shape))
  })

  it("lists each object field's own keys and no others", () => {
    for (const [key, schema] of Object.entries(ProseSchema.shape)) {
      const fields = section(fieldsSection, `### ${key}`).match(/^Fields: (.*)$/m)
      expect(fields ? ticked(fields[1]) : [], key).toEqual(nestedKeys(schema as z.ZodType))
    }
  })

  it('states every cap of PROSE_LIMITS in the section it applies to', () => {
    const L = PROSE_LIMITS
    const caps: Record<string, string[]> = {
      intent: [`${L.intent} characters`, `${L.pointer} characters`],
      delta: [`${L.deltaItems.min} to ${L.deltaItems.max} items`, `${L.delta} characters`],
      cause: [`${L.cause} characters`],
      recommend: [`${L.flip} characters`, 'from 0 to 1'],
      followUps: [
        `${L.followUps.min} to ${L.followUps.max} items`,
        `${L.question} characters`,
        `${L.answer} characters`,
        `${L.pointer} characters`,
      ],
    }
    for (const [key, phrases] of Object.entries(caps))
      for (const phrase of phrases)
        expect(section(fieldsSection, `### ${key}`), key).toContain(phrase)
  })

  it('names only real lint rules, and every rule prose.json can trip', () => {
    const listed = [
      ...section(prompt, '## What the lint refuses in prose.json').matchAll(/^- `([^`]+)`/gm),
    ]
      .map((m) => m[1])
      .sort()
    const proseRules = PACKET_LINT_RULES.filter((r) => /^(prose|cause)-/.test(r)).sort()

    expect(listed).toEqual(proseRules)
  })

  it('ends with the lint the packager must pass', () => {
    expect(section(prompt, '## Steps')).toContain(
      'titan-review packet lint <dir> --gate-head <head> --require prose'
    )
  })

  it("gives an example that passes the lint once bound to a packet's id and head", async () => {
    const dir = await packetDir()
    const packet = await readPacket(dir)
    const example = JSON.parse(section(prompt, '## Example').match(/```json\n([\s\S]*?)```/)![1])
    const bound = { ...example, packetId: packet.packetId, headSha: packet.headSha }
    await writeJsonFile(dir, 'prose.json', bound)

    expect(Object.keys(example.cause)).toEqual(packet.images.map((i) => i.key))
    expect(await lint(dir, { require: ['prose'] })).toEqual([])
  })

  it("asks the owner's four visual follow-ups in the guide and the example alike", () => {
    const asked = [...section(fieldsSection, '### followUps').matchAll(/^- "(.+)"$/gm)].map(
      (m) => m[1]
    )
    const example = JSON.parse(section(prompt, '## Example').match(/```json\n([\s\S]*?)```/)![1])

    expect(asked).toHaveLength(4)
    expect(example.followUps.map((f: { question: string }) => f.question)).toEqual(asked)
  })
})
