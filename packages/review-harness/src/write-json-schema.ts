import { writeFile } from 'node:fs/promises'
import { feedbackJsonSchema, manifestJsonSchema } from './schema.ts'

const dir = new URL('../schema/', import.meta.url)
const write = (name: string, schema: unknown) =>
  writeFile(new URL(name, dir), `${JSON.stringify(schema, null, 2)}\n`)

await write('round.schema.json', manifestJsonSchema())
await write('feedback.schema.json', feedbackJsonSchema())
