/**
 * Purpose and props for catalog entries, read by react-docgen-typescript from one TypeScript
 * program over every entry file. Output is normalised so the catalog is the same on any machine:
 * props sorted by name, only `name`, `type`, `required`, `default` and `description`, and never
 * docgen's cwd-relative `parent` or `declarations`.
 */
import path from 'node:path'

import { withCompilerOptions } from 'react-docgen-typescript'
import ts from 'typescript'

import { firstSentence } from './jsdoc.mjs'

const TSCONFIG = 'packages/ui/tsconfig.json'
const OPTIONAL_UNDEFINED = / \| undefined$/

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

function compilerOptions(repoRoot) {
  const configPath = path.join(repoRoot, TSCONFIG)
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile)
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'))
  return ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath)).options
}

/** A compiler host that serves `overlay` (absolute path to source text) in place of the disk. */
function overlayHost(options, overlay) {
  const host = ts.createCompilerHost(options, true)
  const { getSourceFile, readFile, fileExists } = host
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    overlay.has(fileName)
      ? ts.createSourceFile(fileName, overlay.get(fileName), languageVersion, true)
      : getSourceFile.call(host, fileName, languageVersion, ...rest)
  host.readFile = (fileName) => overlay.get(fileName) ?? readFile.call(host, fileName)
  host.fileExists = (fileName) => overlay.has(fileName) || fileExists.call(host, fileName)
  return host
}

const fromNodeModules = (prop) => prop.parent?.fileName.includes('node_modules') ?? false

function normaliseProp(prop) {
  const type = prop.type.raw ?? prop.type.name
  return {
    name: prop.name,
    type: prop.required ? type : type.replace(OPTIONAL_UNDEFINED, ''),
    required: prop.required,
    default: prop.defaultValue?.value ?? null,
    description: firstSentence(prop.description),
  }
}

/**
 * Docgen over `files` (repo-relative) in one program. Returns a map from repo-relative file to
 * its component docs. `overlay` maps a repo-relative path to source text read instead of disk.
 */
export function docgen(repoRoot, files, overlay = {}) {
  const options = compilerOptions(repoRoot)
  const absolute = (rel) => path.join(repoRoot, rel)
  const texts = new Map(Object.entries(overlay).map(([rel, text]) => [absolute(rel), text]))
  const roots = files.map(absolute)
  const program = ts.createProgram(roots, options, overlayHost(options, texts))
  const parser = withCompilerOptions(options, {
    savePropValueAsString: true,
    propFilter: (prop) => !fromNodeModules(prop),
  })
  const byFile = new Map(files.map((file) => [file, []]))
  for (const doc of parser.parseWithProgramProvider(roots, () => program)) {
    byFile.get(path.relative(repoRoot, doc.filePath).split(path.sep).join('/'))?.push(doc)
  }
  return byFile
}

/** The entry's `purpose` and `props` from its file's docs, or empty when docgen found no match. */
export function propsFor(component, docsByFile) {
  const doc = (docsByFile.get(component.file) ?? []).find((d) => d.displayName === component.name)
  if (!doc) return { purpose: '', props: [], source: null }
  const props = Object.values(doc.props).map(normaliseProp)
  return {
    purpose: firstSentence(doc.description),
    props: props.sort((a, b) => byCodeUnit(a.name, b.name)),
    source: component.file,
  }
}
