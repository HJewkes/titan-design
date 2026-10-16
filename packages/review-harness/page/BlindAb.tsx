import { useRef, type Dispatch } from 'react'
import { BLIND_CHOICES, type BlindAbQuestion, type BlindPair } from '@titan-design/review-schema'
import { blindTakeKey, type BlindReveal } from '../src/blind-ab.ts'
import type { AnswerDraft } from '../src/feedback.ts'
import { audioUrl, playBackToBack } from './audio.ts'
import { AudioPlayer } from './AudioPlayer.tsx'
import type { Action } from './state.ts'

interface PairProps {
  questionId: string
  pair: BlindPair
  number: number
  count: number
  choice?: string
  dispatch: Dispatch<Action>
}

/**
 * One pair: its line, take A and take B, a button that plays them back to back, and the pick.
 * The page knows a take only by its position; the server serves it at that position's URL.
 */
function BlindPairItem({ questionId, pair, number, count, choice, dispatch }: PairProps) {
  const takes = { A: useRef<HTMLAudioElement>(null), B: useRef<HTMLAudioElement>(null) }
  return (
    <li className="blind-pair" data-testid={`pair-${questionId}-${pair.id}`}>
      <p className="blind-pair-head">
        Pair {number} of {count}
      </p>
      <blockquote className="transcript">{pair.transcript}</blockquote>
      <div className="blind-takes">
        {BLIND_CHOICES.map((c, i) => (
          <div key={c} className="blind-take">
            <span className="blind-take-label">{c}</span>
            <AudioPlayer
              src={audioUrl(blindTakeKey(questionId, pair.id, c))}
              label={`Take ${c} of pair ${number}`}
              testId={`take-${questionId}-${pair.id}-${c}`}
              durationMs={pair.takes[i].durationMs}
              audioRef={takes[c]}
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => playBackToBack(takes.A.current, takes.B.current)}>
        Play A then B
      </button>
      <div className="choices" role="radiogroup" aria-label={`Pair ${number}: which take?`}>
        {BLIND_CHOICES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            tabIndex={-1}
            aria-checked={choice === c}
            className="choice"
            onClick={() =>
              dispatch({ type: 'blindPick', id: questionId, pair: pair.id, choice: c })
            }
          >
            {c}
          </button>
        ))}
      </div>
    </li>
  )
}

/** Every pair of a blind-ab question, in the order the round plays them. */
export function BlindAbPairs({
  question,
  draft,
  dispatch,
}: {
  question: BlindAbQuestion
  draft: AnswerDraft
  dispatch: Dispatch<Action>
}) {
  return (
    <ol className="blind-pairs" aria-label={question.prompt}>
      {question.pairs.map((pair, i) => (
        <BlindPairItem
          key={pair.id}
          questionId={question.id}
          pair={pair}
          number={i + 1}
          count={question.pairs.length}
          choice={draft.blind?.[pair.id]}
          dispatch={dispatch}
        />
      ))}
    </ol>
  )
}

/** After the send: which engine played at A and B in each pair, what was picked, and the tally. */
export function BlindRevealTable({ reveal }: { reveal: BlindReveal }) {
  return (
    <section className="blind-reveal" data-testid={`reveal-${reveal.questionId}`}>
      <h2>Revealed: {reveal.questionId}</h2>
      <p className="blind-tally">
        {Object.entries(reveal.tally)
          .map(([engine, wins]) => `${engine} ${wins}`)
          .join(' · ')}
      </p>
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>A</th>
            <th>B</th>
            <th>You picked</th>
          </tr>
        </thead>
        <tbody>
          {reveal.pairs.map((p) => (
            <tr key={p.pair}>
              <td>{p.pair}</td>
              <td>{p.A}</td>
              <td>{p.B}</td>
              <td>{p.choice ? `${p.choice}: ${p[p.choice]}` : 'no pick'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
