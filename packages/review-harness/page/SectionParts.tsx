import type { Part } from '@titan-design/review-schema'
import { Markdown } from './Markdown.tsx'

/** What the Current pane shows for a part that adds something. */
export const NO_CURRENT = 'none (new)'

interface CodePaneProps {
  heading: 'Current' | 'Proposed'
  code: string
  lang?: string
}

/** The same markup a fenced block renders to, so one stylesheet rule covers both. */
function CodePane({ heading, code, lang }: CodePaneProps) {
  return (
    <div className="part-pane" data-testid={`part-pane-${heading.toLowerCase()}`}>
      <p className="section-text-label">{heading}</p>
      <pre>
        <code className={lang ? `language-${lang}` : undefined}>{code}</code>
      </pre>
    </div>
  )
}

function PartHeading({ part }: { part: Part }) {
  return (
    <p className="part-heading">
      <strong>{part.id}</strong> · <Markdown inline>{part.label}</Markdown>
    </p>
  )
}

/** One part the owner decides: what it is now beside what it would become. */
function OpenPart({ part }: { part: Part }) {
  return (
    <div className="section-part" data-testid={`part-${part.id}`}>
      <PartHeading part={part} />
      <div className="part-panes">
        <CodePane heading="Current" code={part.current ?? NO_CURRENT} lang={part.lang} />
        <CodePane heading="Proposed" code={part.proposed} lang={part.lang} />
      </div>
    </div>
  )
}

/** The parts the seat settled, folded away with the cite that settles each. */
function SettledParts({ parts }: { parts: Part[] }) {
  return (
    <details className="settled-parts" data-testid="settled-parts">
      <summary>
        {parts.length} settled {parts.length === 1 ? 'part' : 'parts'}, FYI
      </summary>
      <ul>
        {parts.map((part) => (
          <li key={part.id} data-testid={`part-${part.id}`}>
            <PartHeading part={part} />
            <pre>
              <code className={part.lang ? `language-${part.lang}` : undefined}>
                {part.proposed}
              </code>
            </pre>
            <p className="part-cite">
              Cite: <Markdown inline>{part.settled?.cite ?? ''}</Markdown>
            </p>
          </li>
        ))}
      </ul>
    </details>
  )
}

/** A section's parts: each unsettled one as Current/Proposed panes, the settled ones in one list. */
export function SectionParts({ parts }: { parts?: Part[] }) {
  if (!parts?.length) return null
  const settled = parts.filter((p) => p.settled)
  return (
    <div className="section-parts" data-testid="section-parts">
      {parts
        .filter((p) => !p.settled)
        .map((p) => (
          <OpenPart key={p.id} part={p} />
        ))}
      {settled.length > 0 && <SettledParts parts={settled} />}
    </div>
  )
}
