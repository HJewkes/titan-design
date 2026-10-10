// The only words a Session fixture may contain: an invented orchard-inventory app, plus the tool
// names (product vocabulary) and the schema's own enum values. The leak guard in
// session-fixture.test.ts fails on any word outside these lists, so pasted real text cannot land.
// Not exported from any barrel.

/** Words the generator draws prose from. */
export const PROSE_WORDS = `
  apple apples pear pears plum plums cherry cherries tree trees row rows block blocks crate
  crates bin bins basket baskets ledger ledgers tally harvest picked pickers north south
  east west stock shelf shelves cold store weight kilos grade graded sorted label labels
  season week field gate cart carts ripe bruised pruned graft saplings count counts counted
  check update add fix list show find sum total totals the and of in for with from each
  every then next before after more two three four ten
`
  .trim()
  .split(/\s+/)

/** Words a fixture writes on purpose, kept out of the prose pool so a search can target them. */
export const SEARCH_WORDS = {
  /** Appears in exactly one prompt of `SESSION_DEFAULT`. */
  inOnePrompt: 'quince',
  /** Appears only in error messages. */
  onlyInErrors: 'mildew',
} as const

/** Words in paths, commands, markup and fixed phrases, plus two Hebrew words (apple, tree) for right-to-left text. */
const STRUCTURE_WORDS = `
  call quince mildew orchard inventory src ts tsx md docs test tests index pnpm git status diff
  run found missing file not command exited code session cli large small summary earlier
  context reminder channel note please can you we i will here is are a to it this all const
  return function import export type script alert b bold heading cut long line lines reply
  prompt kept תפוח עץ
`
  .trim()
  .split(/\s+/)

/** Every tool name a fixture may use; a call's `name` must be one of these exactly. */
export const TOOL_NAMES = [
  'Read',
  'Grep',
  'Glob',
  'Bash',
  'Edit',
  'Write',
  'Task',
  'WebFetch',
  'WebSearch',
  'AskUserQuestion',
  'ScheduleWakeup',
  'Skill',
  'ToolSearch',
  'mcp__agent-chat__chat_send',
  'mcp__ledger__lookup',
  'OrchardSync',
] as const

/** The schema's enum values, which appear as strings in every fixture. */
const SCHEMA_WORDS = `
  none mcp agentchat other fs read bash write ask user subagent web scheduling skill
  toolsearch tool success error unknown pending prompt injected compaction assistant delta
  snapshot unreported future family cancelled
`
  .trim()
  .split(/\s+/)

function toolNameWords(): string[] {
  return TOOL_NAMES.flatMap((name) => name.toLowerCase().match(/\p{L}+/gu) ?? [])
}

/** Lower-case words the leak guard accepts. */
export const ALLOWED_WORDS: ReadonlySet<string> = new Set([
  ...PROSE_WORDS,
  ...STRUCTURE_WORDS,
  ...SCHEMA_WORDS,
  ...toolNameWords(),
])
