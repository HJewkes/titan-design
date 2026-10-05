import { MANIFEST_SCHEMA_ID, type ManifestInput } from './schema.ts'

/** The frames and questions of the example round, before they are grouped into sections. */
export function exampleManifest(storybookUrl: string): ManifestInput {
  return {
    schema: MANIFEST_SCHEMA_ID,
    unit: 'vw-385-goal-card',
    round: 1,
    storybookUrl,
    context: 'Which goal summary reads best at wall distance and still works on a phone?',
    widths: [1920, 360],
    height: 900,
    variants: [
      {
        key: 'A',
        storyId: 'lab-decisions-primary-goal-card--responsive',
        label: 'Primary goal card',
      },
      {
        key: 'B',
        storyId: 'lab-decisions-goal-milestone-tiles--wall',
        label: 'Milestone tiles',
        args: { frame: 'wall' },
      },
      {
        key: 'C',
        storyId: 'lab-decisions-compact-goal-chart--lift-card-width',
        label: 'Compact goal chart',
      },
    ],
    questions: [
      {
        id: 'q1',
        kind: 'pick-one',
        prompt: 'Which one leads the page?',
        options: ['A', 'B', 'C', 'none'],
        revisionOption: 'none',
        required: true,
      },
      {
        id: 'q2',
        kind: 'pick-many',
        prompt: 'Which have a legibility problem at 360?',
        options: ['A', 'B', 'C'],
      },
      { id: 'q3', kind: 'scale', prompt: 'How close is the pick to done?', min: 1, max: 5 },
      { id: 'q4', kind: 'text', prompt: 'Anything to carry into the next round?' },
    ],
  }
}

/**
 * The example round under the review contract, for `titan-review --example`: one CHOICE strip
 * whose frames share every frame setting, and a pick-one that names what it signs off.
 */
export function sectionedExampleManifest(storybookUrl: string): ManifestInput {
  const base = exampleManifest(storybookUrl)
  return {
    ...base,
    height: 'auto',
    maxHeight: 1200,
    questions: base.questions.map((q) =>
      q.kind === 'pick-one' ? { ...q, signsOff: 'which goal card leads the page' } : q
    ),
    sections: [
      {
        id: 'lead',
        title: 'Which card leads the page?',
        deciding: 'Pick the goal card that leads the page, and flag any that fail at 360px.',
        changed: 'Three candidate goal cards; none has been approved yet.',
        context: 'All three show the same data, so judge weight and legibility, not content.',
        kind: 'CHOICE',
        questionIds: ['q1', 'q2'],
        variantKeys: ['A', 'B', 'C'],
      },
    ],
  }
}
