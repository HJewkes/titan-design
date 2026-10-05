/**
 * The first-sentence rule shared by an entry's `purpose` and each prop's `description`. Only the
 * first sentence is kept so a long JSDoc block stays small in the catalog and an edit past the
 * first sentence does not churn it.
 */

const ABBREVIATION = /\b(?:e\.g|i\.e|etc|vs)\.$/i
const SENTENCE_END = /[.!?](?=\s|$)/g

/** The first sentence of a JSDoc description, whitespace collapsed; '' when there is none. */
export function firstSentence(description) {
  const paragraph = (description ?? '').trim().split(/\n\s*\n/)[0]
  const text = paragraph.replace(/\s+/g, ' ').trim()
  for (const match of text.matchAll(SENTENCE_END)) {
    const sentence = text.slice(0, match.index + 1)
    if (!ABBREVIATION.test(sentence)) return sentence
  }
  return text
}
