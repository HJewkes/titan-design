/** One-line titles and subtitles for replay events, cut at a word boundary. */

export const TITLE_MAX_LENGTH = 80
export const EMPTY_MESSAGE_TITLE = 'Empty message'

const LINE_BREAK = new RegExp('\\r\\n|[\\r\\n\\u2028\\u2029]')

function firstLine(text: string): string {
  const line = text.split(LINE_BREAK).find((l) => l.trim() !== '')
  return (line ?? '').replace(/\s+/g, ' ').trim()
}

function cutAtWord(line: string, max: number): string {
  if (line.length <= max) return line
  let cut = line.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  if (space > 0) cut = cut.slice(0, space)
  if (/[\ud800-\udbff]$/.test(cut)) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

/** One line of at most 80 characters, never empty: the first non-empty line, else the fallback. */
export function eventTitle(text: string, fallback = EMPTY_MESSAGE_TITLE): string {
  const line = cutAtWord(firstLine(text), TITLE_MAX_LENGTH)
  if (line !== '') return line
  return cutAtWord(firstLine(fallback), TITLE_MAX_LENGTH) || EMPTY_MESSAGE_TITLE
}

export function subtitleOf(text: string | null | undefined): string | null {
  const line = cutAtWord(firstLine(text ?? ''), TITLE_MAX_LENGTH)
  return line === '' ? null : line
}
