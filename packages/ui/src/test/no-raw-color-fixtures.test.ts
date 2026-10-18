import path from 'node:path'
import { ESLint } from 'eslint'

// Story fixtures take their colours from the ramp (TD-962): the `*-fixture.ts` exemption is gone,
// so a raw colour in a fixture fails like one anywhere else, past `raw-color-baseline.json`.
const pkgDir = path.resolve(__dirname, '../..')

async function rawColorRules(filePath: string, code: string) {
  const [result] = await new ESLint({ cwd: pkgDir }).lintText(code, { filePath })
  return result.messages.filter((m) => m.ruleId === 'titan/no-raw-color').map((m) => m.ruleId)
}

describe('titan/no-raw-color on story fixtures', () => {
  it('fails a new raw hex in a promoted fixture', async () => {
    const file = path.join(pkgDir, 'src/components/custom/Demo/fills-fixture.ts')
    const code = "export const fills = [{ id: 'a', colour: '#3a7bd5' }]\n"
    expect(await rawColorRules(file, code)).toEqual(['titan/no-raw-color'])
  })
})
