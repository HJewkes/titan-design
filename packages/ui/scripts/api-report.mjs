/**
 * Public API reports, one per tsup entry, from the d.ts the build emitted.
 *
 *   node scripts/api-report.mjs           check: fails when a report differs or is missing
 *   node scripts/api-report.mjs --local   update: rewrites api/<entry>.api.md and the
 *                                         undocumented baseline (growth needs --allow-increase)
 *
 * Reads dist/, so run it after `pnpm build`. The reports in api/ are committed
 * and stay outside package.json `files`, so they never ship.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'
import { updateBaseline } from './api-undocumented.mjs'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Mirrors `entry` in tsup.config.ts: report name -> emitted declaration file.
const ENTRIES = {
  index: 'dist/index.d.ts',
  bodymap: 'dist/bodymap.d.ts',
  pages: 'dist/pages.d.ts',
  'theme-index': 'dist/theme/index.d.ts',
  'theme-tokens': 'dist/theme/tokens.d.ts',
  'theme-tokens-css': 'dist/theme/tokens-css.d.ts',
}

function prepareConfig(baseConfigPath, reportName, dtsPath) {
  const configObject = ExtractorConfig.loadFile(baseConfigPath)
  configObject.mainEntryPointFilePath = `<projectFolder>/${dtsPath}`
  configObject.apiReport.reportFileName = reportName
  configObject.compiler.overrideTsconfig.files = [path.join(pkgRoot, dtsPath)]
  return ExtractorConfig.prepare({
    configObject,
    configObjectFullPath: baseConfigPath,
    packageJsonFullPath: path.join(pkgRoot, 'package.json'),
  })
}

// CI keeps no artifacts of the temp folder, so the log is the only place a reviewer sees the change.
function printReportDiff(config, report) {
  const generated = path.relative(
    pkgRoot,
    path.join(config.reportTempFolder, path.basename(report))
  )
  if (!fs.existsSync(path.join(pkgRoot, report))) return
  spawnSync('git', ['--no-pager', 'diff', '--no-index', '--', report, generated], {
    cwd: pkgRoot,
    stdio: 'inherit',
  })
}

function runEntry(reportName, dtsPath, localBuild) {
  const config = prepareConfig(path.join(pkgRoot, 'api-extractor.json'), reportName, dtsPath)
  const result = Extractor.invoke(config, { localBuild })
  if (result.succeeded) return true
  const report = `api/${reportName}.api.md`
  const state = fs.existsSync(path.join(pkgRoot, report)) ? 'is out of date' : 'is missing'
  const reason = result.apiReportChanged
    ? `${report} ${state}; run \`pnpm api:update\` and commit the report`
    : `${result.errorCount} error(s), ${result.warningCount} warning(s)`
  console.error(`api-report: ${reportName}: ${reason}`)
  if (result.apiReportChanged) printReportDiff(config, report)
  return false
}

const localBuild = process.argv.includes('--local')
fs.mkdirSync(path.join(pkgRoot, 'api'), { recursive: true })
const failed = Object.entries(ENTRIES).filter(
  ([reportName, dtsPath]) => !runEntry(reportName, dtsPath, localBuild)
)
if (failed.length > 0) process.exit(1)
if (localBuild) {
  try {
    updateBaseline({ allowIncrease: process.argv.includes('--allow-increase') })
  } catch (error) {
    console.error(`api-report: ${error.message}`)
    process.exit(1)
  }
}
