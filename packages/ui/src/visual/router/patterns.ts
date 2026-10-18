// Semantic patterns: pick one when behaviour, risk or enforcement is the point of the
// picture, then draw it with the pattern's nearest type. The idea of routing by pattern
// before type comes from cathrynlavery/diagram-design (MIT, (c) 2025 Cathryn Lavery);
// every trigger, primitive list and budget here is titan's own wording.
import type { PatternId, VisualPattern } from './types'

export const PATTERNS: readonly VisualPattern[] = [
  {
    id: 'fan-in-queue',
    name: 'Fan-in queue',
    trigger:
      'Several producers feed one constrained resource, so waiting and capacity tell the story.',
    primitives: [
      'named sources',
      'a queue showing its depth',
      'a capacity figure with units',
      'the single constrained service',
      'accepted and turned-away outcomes',
    ],
    budget: 'Up to 5 sources and 5 queued items; group extra sources into one cohort.',
    nearestType: 'data-flow',
  },
  {
    id: 'stage-framework',
    name: 'Stage framework',
    trigger: 'Every stage answers the same set of questions, and comparing stages matters most.',
    primitives: [
      'stage headers in order',
      'one slot row per question, labelled',
      'a visible marker for an empty slot',
      'handoffs between stages',
    ],
    budget: '3 to 6 stages, at most 4 slot rows, about 20 filled cells.',
    nearestType: 'process',
  },
  {
    id: 'input-to-artifact',
    name: 'Input to artifact',
    trigger: 'Loose input such as a chat or notes is turned into a lasting structured record.',
    primitives: [
      'a short excerpt of the input',
      'the transformation step, named',
      'the finished record with its fields',
      'links from statements to the fields they fill',
      'fields still unknown',
    ],
    budget: 'At most 4 input excerpts, 6 record fields and 3 provenance links.',
    nearestType: 'data-flow',
  },
  {
    id: 'paired-traces',
    name: 'Paired traces',
    trigger: 'Two similar requests end differently and the reader must find where they split.',
    primitives: [
      'one shared ordered rule list',
      'a worded status per rule on each side',
      'the first point of divergence, marked',
      'an outcome per trace',
    ],
    budget: 'Two traces, 3 to 6 rules, one marked divergence.',
    nearestType: 'flowchart',
  },
  {
    id: 'paved-road',
    name: 'Paved road',
    trigger:
      'A supported route crosses trust boundaries, and some routes must be shown as blocked.',
    primitives: [
      'labelled trust zones',
      'allowed routes with a text label',
      'blocked routes that end at the zone edge',
      'the privileged gate',
      'where audit records land',
    ],
    budget: 'Up to 3 zones, 8 components and 2 blocked routes.',
    nearestType: 'architecture',
  },
  {
    id: 'control-catalog',
    name: 'Control catalogue',
    trigger: 'Controls only make sense grouped by the surface that enforces them.',
    primitives: [
      'one group per enforcement surface',
      'named controls',
      'who or what enforces each',
      'when it runs',
      'gaps and exception routes',
    ],
    budget: '3 to 5 surfaces, about 24 controls in all.',
    nearestType: 'layer-stack',
  },
  {
    id: 'compensating-layers',
    name: 'Compensating layers',
    trigger: 'Each defence catches some of what the previous one missed, and some risk survives.',
    primitives: [
      'the incoming risk',
      'layers in order, each with what it stops',
      'what slips past each layer',
      'the residual risk at the end, stated in words',
    ],
    budget: '3 to 5 layers following one risk thread.',
    nearestType: 'layer-stack',
  },
  {
    id: 'block-decomposition',
    name: 'Block decomposition',
    trigger: 'A system breaks into parts that each carry a stable id someone can cite.',
    primitives: [
      'an id badge per block',
      'a noun name per block',
      'parent to child links only',
      'detail kept in data, not on the canvas',
    ],
    budget: 'Root plus 3 levels, about 9 visible blocks; split by subsystem beyond that.',
    nearestType: 'tree',
  },
  {
    id: 'lifecycle',
    name: 'Lifecycle',
    trigger: 'One subject moves through phases, and its waits, retries and endings carry weight.',
    primitives: [
      'a main rail of phases',
      'a separate band for waiting and recovery',
      'a separate band for end states',
      'labelled transitions',
    ],
    budget: '4 or 5 main phases, at most 9 states and 10 transitions.',
    nearestType: 'state-machine',
  },
]

export const PATTERN_BY_ID: ReadonlyMap<PatternId, VisualPattern> = new Map(
  PATTERNS.map((pattern) => [pattern.id, pattern])
)
