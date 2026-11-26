// A copy of the console's reading of frames@1, so the harness test proves `packet round` writes what
// `titan-console rounds import` accepts. Copied from titan-platform main at f2a492d6
// (apps/console/server/round-frames.ts FramesIndexSchema and IMAGE_PATH; round-import.ts PACKET_FILE,
// PROSE_FILE and checkBinding). Update the copy, and that sha, when the console's reader changes.
// The `targets` field and ConsoleFrameTargetsSchema (its FrameTargetsSchema) are from 51ee4c4cf.
import { z } from 'zod'
import { THEME_MODES } from '@titan-design/review-schema'

/** review-schema's `imagePath`: a relative .png path with no `..` segment. */
export const CONSOLE_IMAGE_PATH = /^(?![/\\]|[A-Za-z]:)(?!(.*[/\\])?\.\.([/\\]|$)).+\.[Pp][Nn][Gg]$/

/** The importer refuses a sidecar named anything but these, beside round.json. */
export const CONSOLE_PACKET_FILE = 'packet.json'
export const CONSOLE_PROSE_FILE = 'prose.json'

const sha256Hex = z.string().regex(/^[0-9a-f]{64}$/)
const indexedFile = z.object({ file: z.string(), sha256: sha256Hex })

export const ConsoleFramesIndexSchema = z.object({
  schema: z.literal('titan-review/frames@1'),
  unit: z.string().optional(),
  round: z.number().int().optional(),
  manifestSha256: sha256Hex.optional(),
  packet: indexedFile.optional(),
  prose: indexedFile.optional(),
  frames: z.array(
    z.object({
      key: z.string(),
      theme: z.enum(THEME_MODES).optional(),
      file: z.string(),
      sha256: sha256Hex,
      base: indexedFile.optional(),
      diff: indexedFile.optional(),
      after: indexedFile.optional(),
      targets: indexedFile.optional().catch(undefined),
    })
  ),
})

const targetBox = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative(),
  target: z.strictObject({
    testId: z.string().optional(),
    role: z.string().optional(),
    text: z.string().optional(),
  }),
})

export const ConsoleFrameTargetsSchema = z.object({
  schema: z.literal('titan-review/frame-targets@1'),
  boxes: z.array(targetBox),
})
