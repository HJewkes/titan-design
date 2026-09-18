import { MANIFEST_SCHEMA_ID, type ManifestInput } from './schema.ts'

/** A round over real Lab/Decisions stories, for `titan-review --example`. */
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
