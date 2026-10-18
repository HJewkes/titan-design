// Maps each finding kind to the design rule it enforces (docs/design-rules.md). A kind with no
// rule row stays unmapped and its findings carry no `rule` field.
export const RULE_BY_KIND = Object.freeze({
  'truncated-text': 'DR-DD-05',
  'hit-target': 'DR-IX-01',
  contrast: 'DR-CO-01',
  'contrast-token': 'DR-CO-01',
  'small-text': 'DR-TY-06',
  'off-scale-spacing': 'DR-LA-07',
  'theme-geometry-shift': 'DR-CO-16',
  'stacked-inset': 'DR-LA-04',
  'edge-clearance': 'DR-LA-06',
  'inset-asymmetry': 'DR-LA-09',
  'alignment-near-miss': 'DR-LA-10',
  'gap-outlier': 'DR-LA-08',
  'proximity-inversion': 'DR-LA-01',
  'font-size-near-miss': 'DR-TY-05',
  'font-size-drift': 'DR-TY-05',
})

const tag = (finding) => {
  const rule = RULE_BY_KIND[finding.kind]
  return rule ? { ...finding, rule } : finding
}

/** A dom.json frame entry whose blockers, warnings and token-contrast findings name their rule. */
export function withRules(entry) {
  const tagged = { ...entry }
  for (const field of ['blockers', 'warnings', 'contrast_token'])
    if (Array.isArray(entry[field])) tagged[field] = entry[field].map(tag)
  return tagged
}
