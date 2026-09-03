/**
 * S3 · Session Rail — SPECIMEN (rapid-prototype, not yet a hardened component).
 *
 * A faithful React port of the R2/C3 converged rail
 * (sources/design/drilldown-pass/r2-synthesis/gallery.html), brought into
 * titan Storybook so we can iterate with the token system + real titan components + side-by-side.
 * Raw hex lives here on purpose — it mirrors the gallery 1:1; tokenization happens at harden.
 *
 * Stories:
 *  - R2Baseline    — the converged rail exactly as designed (live-session context)
 *  - ContextSwap   — the same rail across live / historical / idle (NAV-D02)
 *  - Directions    — DIRECTION A (this faithful rail) vs DIRECTION B (real titan ExerciseCard)
 *                    rendered at the real rail width, to ground the "what is a rail item?" call.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ExerciseCard, type ExerciseCardProps } from '../custom/Workout/ExerciseCard'
import type { SetRowProps } from '../custom/Workout/SetRow'

// ----------------------------------------------------------------------------- specimen data
// Transcribed from the r2-synthesis gallery `EX` model (cable pull/push session, "Pull A").
type SpecSet = { reps: number; meanV: number; loss: number; live?: boolean }
type SpecExercise = {
  id: string
  name: string
  wt: number
  e1rm: number
  pr?: boolean
  cat: string
  sets: SpecSet[]
}

const SESSION: SpecExercise[] = [
  {
    id: 'cable-row',
    name: 'Seated Cable Row',
    wt: 145,
    e1rm: 205,
    pr: true,
    cat: 'Back',
    sets: [
      { reps: 8, meanV: 0.56, loss: 11 },
      { reps: 8, meanV: 0.54, loss: 15 },
      { reps: 8, meanV: 0.51, loss: 19 },
      { reps: 8, meanV: 0.49, loss: 0, live: true },
      { reps: 7, meanV: 0.47, loss: 26 },
    ],
  },
  {
    id: 'lat-pull',
    name: 'Lat Pulldown',
    wt: 130,
    e1rm: 188,
    cat: 'Back',
    sets: [
      { reps: 10, meanV: 0.64, loss: 9 },
      { reps: 10, meanV: 0.61, loss: 14 },
      { reps: 9, meanV: 0.58, loss: 17 },
      { reps: 8, meanV: 0.55, loss: 22 },
    ],
  },
  {
    id: 'cable-press',
    name: 'Cable Chest Press',
    wt: 90,
    e1rm: 150,
    cat: 'Chest',
    sets: [
      { reps: 10, meanV: 0.58, loss: 10 },
      { reps: 9, meanV: 0.55, loss: 15 },
      { reps: 8, meanV: 0.51, loss: 20 },
      { reps: 8, meanV: 0.48, loss: 24 },
    ],
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    wt: 45,
    e1rm: 78,
    cat: 'Chest',
    sets: [
      { reps: 12, meanV: 0.74, loss: 8 },
      { reps: 12, meanV: 0.71, loss: 12 },
      { reps: 11, meanV: 0.68, loss: 16 },
    ],
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    wt: 35,
    e1rm: 60,
    cat: 'Rear Delt',
    sets: [
      { reps: 15, meanV: 0.78, loss: 6 },
      { reps: 15, meanV: 0.74, loss: 10 },
      { reps: 14, meanV: 0.7, loss: 14 },
    ],
  },
]

const LIVE_EX = 'cable-row'
const LIVE_SET_IDX = 3
const LIVE_TARGET = 8
const LIVE_REP = 5 // current rep of the running set

type RailContext = 'live' | 'historical' | 'idle'

// ----------------------------------------------------------------------------- helpers (gallery)
const velColor = (v: number): string =>
  v < 0.5 ? '#ff4757' : v < 0.75 ? '#ffa502' : v < 1.0 ? '#ffd43b' : '#2ed573'
const f2 = (v: number): string => v.toFixed(2)
const lossClass = (l: number): string => (l >= 25 ? 'bad' : l >= 18 ? 'warn' : 'ok')

// ----------------------------------------------------------------------------- faithful CSS
// All selectors scoped under `.s3spec` so short class names never leak into the RNW canvas.
const RAIL_CSS = `
.s3spec{--brand:#FF7900;--brand-soft:rgba(255,121,0,.14);--spine:#131418;--stage:#0f1012;
  --surface:#17181c;--raised:#1e2025;--border:#24262d;--border-strong:#31343d;
  --hover:rgba(255,255,255,.04);--text:#E8EAED;--muted:#8D95A3;--dim:#5b616d;
  --amber:#FFB020;--sky:#2196F3;--v-green:#2ed573;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--ease:cubic-bezier(.22,1,.36,1);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--text)}
.s3spec .rail{width:246px;flex:0 0 246px;background:var(--spine);border-right:1px solid var(--border);
  display:flex;flex-direction:column;min-height:0;height:100%}
.s3spec .railhead{padding:11px 13px 9px;border-bottom:1px solid var(--border)}
.s3spec .railctx{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:5px}
.s3spec .railctx .d{width:6px;height:6px;border-radius:50%;background:var(--v-green)}
.s3spec .railctx.hist .d{background:var(--sky)}
.s3spec .railtitle{font-size:14px;font-weight:800;margin-top:3px;letter-spacing:-.2px}
.s3spec .railmeta{font-size:10px;color:var(--muted);margin-top:2px;font-family:var(--mono)}
.s3spec .railscroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:6px 8px}
.s3spec .railscroll::-webkit-scrollbar{width:6px}
.s3spec .railscroll::-webkit-scrollbar-thumb{background:#2a2d34;border-radius:3px}
.s3spec .rex{border-radius:9px;margin-bottom:3px;border:1px solid transparent;transition:background .15s}
.s3spec .rex.active{background:var(--brand-soft);border-color:rgba(255,121,0,.28)}
.s3spec .rexhead{padding:8px 9px;cursor:pointer;display:flex;flex-direction:column;gap:6px;border-radius:9px;transition:background .15s}
.s3spec .rexhead:hover{background:var(--hover)}
.s3spec .rextop{display:flex;align-items:center;gap:6px}
.s3spec .rexidx{font-family:var(--mono);font-size:10px;color:var(--dim);width:13px;flex:0 0 auto}
.s3spec .rexname{font-size:12px;font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s3spec .rextag{font-size:8px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.5px;color:var(--v-green)}
.s3spec .rexe1{font-family:var(--mono);font-size:10px;color:var(--dim)}
.s3spec .rexchev{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid var(--dim);transition:transform .3s var(--ease)}
.s3spec .rex.open .rexchev{transform:rotate(180deg)}
.s3spec .rticks{display:flex;gap:3px;padding-left:19px}
.s3spec .rtick{flex:1;height:15px;border-radius:3px;background:#22252c;position:relative;overflow:hidden;transition:transform .12s}
.s3spec .rtick.up{background:none;border:1px dashed #3a3d44;opacity:.5}
.s3spec .rtick.live{box-shadow:0 0 0 2px var(--brand),0 0 10px rgba(255,121,0,.5);animation:s3tickpulse 1.6s infinite}
@keyframes s3tickpulse{0%,100%{box-shadow:0 0 0 2px var(--brand),0 0 3px rgba(255,121,0,.3)}50%{box-shadow:0 0 0 2px var(--brand),0 0 14px rgba(255,121,0,.7)}}
.s3spec .rtick .rf{position:absolute;left:0;right:0;bottom:0;border-radius:3px}
.s3spec .rtlbl{position:absolute;top:1px;left:0;right:0;text-align:center;font-family:var(--mono);font-size:7px;color:rgba(255,255,255,.6);z-index:2}
.s3spec .rexbody{overflow:hidden;transition:max-height .4s var(--ease),opacity .3s}
.s3spec .rsrow{display:flex;align-items:center;gap:7px;padding:6px 9px 6px 22px;font-family:var(--mono);font-size:11px;border-radius:7px}
.s3spec .rsrow .sn{color:var(--muted);width:30px}
.s3spec .rsrow .sv{font-weight:800}
.s3spec .rsrow .sl{margin-left:auto;font-size:10px}
.s3spec .rsrow .sl.ok{color:var(--v-green)}
.s3spec .rsrow .sl.warn{color:var(--amber)}
.s3spec .rsrow .sl.bad{color:#ff4757}
.s3spec .rsrow.livenow{color:var(--v-green)}
.s3spec .pace{border-top:1px solid var(--border);padding:11px 13px;background:linear-gradient(180deg,#141519,#101113)}
.s3spec .pacehead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.s3spec .pacetitle{font-size:10px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--brand)}
.s3spec .pacetoggle{font-size:8px;font-family:var(--mono);color:var(--dim);border:1px solid var(--border-strong);border-radius:5px;padding:2px 5px;cursor:pointer;letter-spacing:.3px}
.s3spec .pacetime{display:flex;align-items:baseline;gap:6px;font-family:var(--mono)}
.s3spec .pacetime .big{font-size:20px;font-weight:800;letter-spacing:-.5px}
.s3spec .pacetime .of{font-size:11px;color:var(--muted)}
.s3spec .pacebar{height:6px;border-radius:3px;background:#22252c;margin:7px 0 3px;overflow:hidden;position:relative}
.s3spec .pacebar .pf{position:absolute;left:0;top:0;bottom:0;border-radius:3px}
.s3spec .pacebar .budget{position:absolute;top:-2px;bottom:-2px;width:2px;background:var(--text);opacity:.7}
.s3spec .pacemetrics{display:flex;gap:4px;margin:8px 0}
.s3spec .pm{flex:1;text-align:center;background:var(--raised);border-radius:7px;padding:6px 3px}
.s3spec .pm .k{font-size:8px;text-transform:uppercase;letter-spacing:.4px;color:var(--dim);font-weight:800}
.s3spec .pm .v{font-family:var(--mono);font-size:13px;font-weight:800;margin-top:2px}
.s3spec .pacesuggest{font-size:10.5px;line-height:1.4;border-radius:8px;padding:8px 9px;display:flex;gap:7px;align-items:flex-start}
.s3spec .pacesuggest.behind{background:rgba(255,176,32,.12);border:1px solid rgba(255,176,32,.35);color:var(--amber)}
.s3spec .pacesuggest.ahead{background:rgba(46,213,115,.1);border:1px solid rgba(46,213,115,.3);color:var(--v-green)}
.s3spec .pacesuggest .ic{flex:0 0 auto;font-size:12px}
.s3spec .pacesuggest b{color:var(--text)}
.s3spec .speccol{display:flex;flex-direction:column;height:100vh}
/* Inside a flex-COLUMN the rail flex-basis would set HEIGHT; override to fill height, keep 246 width. */
.s3spec .speccol > .rail{flex:1 1 auto;min-height:0}
.s3spec .speclabel{font-family:var(--mono);font-size:10px;color:var(--dim);letter-spacing:.4px;padding:6px 0 8px 2px;flex:0 0 auto}
`

// ----------------------------------------------------------------------------- render pieces
function TickRow({ ex, live }: { ex: SpecExercise; live: boolean }) {
  const isLiveEx = live && ex.id === LIVE_EX
  return (
    <div className="rticks">
      {ex.sets.map((st, s) => {
        if (isLiveEx && s > LIVE_SET_IDX) return <div key={s} className="rtick up" />
        if (isLiveEx && s === LIVE_SET_IDX && st.live) {
          const pct = Math.round((LIVE_REP / LIVE_TARGET) * 100)
          return (
            <div key={s} className="rtick live">
              <span className="rtlbl">
                {LIVE_REP}/{LIVE_TARGET}
              </span>
              <div className="rf" style={{ height: `${pct}%`, background: 'var(--brand)' }} />
            </div>
          )
        }
        return (
          <div key={s} className="rtick">
            <span className="rtlbl">{f2(st.meanV)}</span>
            <div
              className="rf"
              style={{ height: '100%', background: velColor(st.meanV), opacity: 0.85 }}
            />
          </div>
        )
      })}
    </div>
  )
}

function SetRows({ ex, live }: { ex: SpecExercise; live: boolean }) {
  const isLiveEx = live && ex.id === LIVE_EX
  return (
    <>
      {ex.sets.map((s, i) => {
        if (isLiveEx && i > LIVE_SET_IDX)
          return (
            <div key={i} className="rsrow" style={{ opacity: 0.5 }}>
              <span className="sn">S{i + 1}</span>
              <span>upcoming</span>
            </div>
          )
        if (isLiveEx && i === LIVE_SET_IDX && s.live)
          return (
            <div key={i} className="rsrow livenow">
              <span className="sn">S{i + 1}</span>
              <span className="sv">
                {LIVE_REP}/{LIVE_TARGET}
              </span>
              <span className="sl">live</span>
            </div>
          )
        return (
          <div key={i} className="rsrow">
            <span className="sn">S{i + 1}</span>
            <span className="sv">{f2(s.meanV)}</span>
            <span style={{ color: 'var(--muted)' }}>
              {s.reps}×{ex.wt}
            </span>
            <span className={`sl ${lossClass(s.loss)}`}>−{s.loss}%</span>
          </div>
        )
      })}
    </>
  )
}

function RailItem({
  ex,
  idx,
  live,
  open,
  onToggle,
}: {
  ex: SpecExercise
  idx: number
  live: boolean
  open: boolean
  onToggle: () => void
}) {
  const isLiveEx = live && ex.id === LIVE_EX
  const cls = ['rex']
  if (open) cls.push('open')
  if (isLiveEx) cls.push('active')
  return (
    <div className={cls.join(' ')}>
      <div className="rexhead" onClick={onToggle}>
        <div className="rextop">
          <span className="rexidx">{idx + 1}</span>
          <span className="rexname">{ex.name}</span>
          {isLiveEx ? (
            <span className="rextag">live</span>
          ) : (
            <span className="rexe1">{ex.e1rm} e1RM</span>
          )}
          <span className="rexchev" />
        </div>
        <TickRow ex={ex} live={live} />
      </div>
      <div className="rexbody" style={{ maxHeight: open ? 400 : 0, opacity: open ? 1 : 0.4 }}>
        <SetRows ex={ex} live={live} />
      </div>
    </div>
  )
}

function PaceFooter({
  context,
  ahead,
  onToggle,
}: {
  context: RailContext
  ahead: boolean
  onToggle: () => void
}) {
  if (context === 'idle') {
    return (
      <div className="pace">
        <div className="pacehead">
          <span className="pacetitle">Next session budget</span>
        </div>
        <div className="pacetime">
          <span className="big">~52:00</span>
          <span className="of">planned · Lower B</span>
        </div>
        <div className="pacesuggest ahead">
          <span className="ic">◷</span>
          <div>6 exercises · ~20 sets. Wall wakes to Live when the first set streams.</div>
        </div>
      </div>
    )
  }
  const behind = !ahead
  return (
    <div className="pace">
      <div className="pacehead">
        <span className="pacetitle">Session Pace</span>
        <span className="pacetoggle" onClick={onToggle}>
          {behind ? 'show ahead ▸' : 'show behind ▸'}
        </span>
      </div>
      <div className="pacetime">
        <span className="big">42:18</span>
        <span className="of">of 60:00 budget</span>
      </div>
      <div className="pacebar">
        <div
          className="pf"
          style={{ width: '70%', background: behind ? 'var(--amber)' : 'var(--v-green)' }}
        />
        <div className="budget" style={{ left: '100%' }} />
      </div>
      <div className="pacemetrics">
        <div className="pm">
          <div className="k">Volume</div>
          <div className="v">76%</div>
        </div>
        <div className="pm">
          <div className="k">Load</div>
          <div className="v">7.3k</div>
        </div>
        <div className="pm">
          <div className="k">Fatigue</div>
          <div className="v" style={{ color: 'var(--amber)' }}>
            MOD
          </div>
        </div>
      </div>
      {behind ? (
        <div className="pacesuggest behind">
          <span className="ic">▲</span>
          <div>
            <b>Behind pace</b> — ~9 min over budget at this rate. Drop <b>Face Pull</b> to 2 sets to
            finish on time.
          </div>
        </div>
      ) : (
        <div className="pacesuggest ahead">
          <span className="ic">＋</span>
          <div>
            <b>Ahead of pace</b> — ~7 min of headroom. Room to add a <b>Cable Fly</b> drop-set or a
            back-off set on Row.
          </div>
        </div>
      )}
    </div>
  )
}

// Shared rail chrome header (context dot + title + meta) — reused by both the adapted rail and the
// "ExerciseCard exactly" comparison so only the item body differs.
function RailHeader({ context, meta }: { context: RailContext; meta?: string }) {
  const hist = context === 'historical'
  const ctxLabel =
    context === 'historical'
      ? 'Reviewing · session Mar 11'
      : context === 'idle'
        ? 'Last session'
        : 'Live session'
  const title = context === 'idle' ? 'Lower B · Volume (next)' : 'Pull A · Intensification'
  const resolvedMeta =
    meta ??
    (context === 'historical'
      ? '22 sets · 48 min · complete'
      : context === 'idle'
        ? 'ended 3 days ago'
        : 'ex 1/5 · set 4 live')
  return (
    <div className="railhead">
      <div className={`railctx${hist ? ' hist' : ''}`}>
        <span className="d" />
        {ctxLabel}
      </div>
      <div className="railtitle">{title}</div>
      <div className="railmeta">{resolvedMeta}</div>
    </div>
  )
}

// PIECE 1 · Live Session Plan — the context header + expandable exercise skeleton (set-tick progress).
function SessionPlan({ context = 'live' as RailContext }: { context?: RailContext }) {
  const live = context === 'live'
  const [open, setOpen] = useState<Record<string, boolean>>({ 'cable-row': true })
  return (
    <>
      <RailHeader context={context} />
      <div className="railscroll">
        {SESSION.map((ex, i) => (
          <RailItem
            key={ex.id}
            ex={ex}
            idx={i}
            live={live}
            open={!!open[ex.id]}
            onToggle={() => setOpen((o) => ({ ...o, [ex.id]: !o[ex.id] }))}
          />
        ))}
      </div>
    </>
  )
}

// The assembled rail = Live Session Plan (piece 1) + Session Pace (piece 2).
function R2Rail({ context = 'live' as RailContext }: { context?: RailContext }) {
  const [ahead, setAhead] = useState(false)
  return (
    <div className="rail">
      <SessionPlan context={context} />
      <PaceFooter context={context} ahead={ahead} onToggle={() => setAhead((a) => !a)} />
    </div>
  )
}

// ----------------------------------------------------------------------------- ExerciseCard rail (state mix)
const perRepVel = (s: SpecSet): number[] =>
  Array.from({ length: s.reps }, (_, r) => +(s.meanV + 0.04 - r * 0.01).toFixed(2))

type CardStatus = 'finished' | 'active' | 'upcoming'

// index-aligned to SESSION: 2 finished · 1 active · 2 upcoming
const CARD_MIX: { ex: SpecExercise; status: CardStatus }[] = SESSION.map((ex, i) => ({
  ex,
  status: (i < 2 ? 'finished' : i === 2 ? 'active' : 'upcoming') as CardStatus,
}))

const completedSet = (ex: SpecExercise, i: number, s: SpecSet): SetRowProps => ({
  state: 'done',
  setNumber: i + 1,
  reps: s.reps,
  weight: ex.wt,
  rpe: 7 + i * 0.5,
  unit: 'lbs',
  velocities: perRepVel(s),
})

// The active exercise's 3-set mix: done · LIVE · todo. The live set is now a
// first-class SetRow state — the compact velocity-height spotlight strip, brightened.
const activeSets = (ex: SpecExercise): SetRowProps[] => [
  completedSet(ex, 0, ex.sets[0]),
  {
    state: 'live',
    setNumber: 2,
    unit: 'lbs',
    target: { reps: 8, weight: ex.wt },
    reps: 8,
    weight: ex.wt,
    velocities: [0.58, 0.55, 0.53, 0.5, 0.48],
  },
  {
    state: 'todo',
    setNumber: 3,
    unit: 'lbs',
    target: { reps: 8, weight: ex.wt },
  },
]

// Real ExerciseCard props for an exercise given its status + whether it's open (onToggle added by caller).
function cardProps(
  ex: SpecExercise,
  status: CardStatus,
  open: boolean
): Omit<ExerciseCardProps, 'onExpandedChange'> {
  const base = { name: ex.name, isPR: ex.pr }
  const summary = {
    sets: status === 'active' ? 3 : ex.sets.length,
    reps: ex.sets[0].reps,
    weight: ex.wt,
    unit: 'lbs' as const,
  }
  if (status === 'upcoming') {
    // Closed → the dimmed upcoming row; open → an expanded card of planned (todo) sets.
    if (!open) {
      return {
        ...base,
        upcoming: true,
        prescription: `${ex.sets.length} × ${ex.sets[0].reps} @ RPE 8`,
        previousBest: `${ex.sets[0].reps} × ${ex.wt} lb`,
      }
    }
    return {
      ...base,
      expanded: true,
      summary,
      tempo: [3, 1, 2, 0],
      sets: ex.sets.map((s, i) => ({
        state: 'todo',
        setNumber: i + 1,
        unit: 'lbs',
        target: { reps: s.reps, weight: ex.wt },
      })),
    }
  }
  if (open) {
    return {
      ...base,
      expanded: true,
      summary,
      tempo: [3, 1, 2, 0],
      sets: status === 'active' ? activeSets(ex) : ex.sets.map((s, i) => completedSet(ex, i, s)),
    }
  }
  const doneSets = status === 'active' ? ex.sets.slice(0, 1) : ex.sets
  return {
    ...base,
    expanded: false,
    summary,
    totalPlannedSets: status === 'active' ? 3 : ex.sets.length,
    setVelocities: doneSets.map(perRepVel),
  }
}

// The session drawn with the REAL (responsive) ExerciseCard — interactive expand/collapse.
function ExerciseCardPlan() {
  const [open, setOpen] = useState<Record<string, boolean>>({ [SESSION[2].id]: true })
  return (
    <>
      <RailHeader context="live" meta="ex 3/5 · set 2 live" />
      <div className="railscroll" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CARD_MIX.map(({ ex, status }) => (
          <ExerciseCard
            key={ex.id}
            {...cardProps(ex, status, !!open[ex.id])}
            onExpandedChange={() => setOpen((o) => ({ ...o, [ex.id]: !o[ex.id] }))}
          />
        ))}
      </div>
    </>
  )
}

// A proper, standalone ExerciseCard at native width — reference point (interactive).
function ReferenceCard() {
  const [open, setOpen] = useState(true)
  return (
    <ExerciseCard
      {...cardProps(SESSION[0], 'finished', open)}
      onExpandedChange={() => setOpen((v) => !v)}
    />
  )
}

// ----------------------------------------------------------------------------- stories
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="s3spec"
      style={{ display: 'flex', height: '100vh', background: 'var(--stage)' }}
    >
      <style>{RAIL_CSS}</style>
      {children}
    </div>
  )
}

const meta: Meta = {
  title: 'Lab/Specimens/Session Rail',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

/** The converged R2/C3 rail, live-session context — the "version we have", now in React. */
export const R2Baseline: Story = {
  render: () => (
    <Frame>
      <R2Rail context="live" />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--dim)',
          fontFamily: 'var(--mono)',
          fontSize: 12,
        }}
      >
        main stage
      </div>
    </Frame>
  ),
}

/** NAV-D02 context-swap: the same rail across live / historical / idle, side by side. */
export const ContextSwap: Story = {
  render: () => (
    <Frame>
      <div className="speccol">
        <div className="speclabel">live</div>
        <R2Rail context="live" />
      </div>
      <div className="speccol">
        <div className="speclabel">historical (Review)</div>
        <R2Rail context="historical" />
      </div>
      <div className="speccol">
        <div className="speclabel">idle</div>
        <R2Rail context="idle" />
      </div>
    </Frame>
  ),
}

const RAIL_DELTAS: [string, string][] = [
  [
    'Width / fit ✓ DONE',
    'FIXED in the real component: SetRow fixed columns now flexShrink + PREV minWidth → the 5-col table renders correctly at 246px (was: "8×145" mangled per-char). No-op at 390px. This is the whole "make it reactive" ask.',
  ],
  [
    'Tick row',
    'REUSE ExerciseCard’s collapsed strip-row (mini VelocityStrips + PlaceholderStrips) AS the set-tick row — already the same concept (see collapsed items in the left column).',
  ],
  [
    'Live set marker',
    'ADD an in-progress tick (pulsing + “5/8” rep count). ExerciseCard only knows completed strips + placeholders — no live state.',
  ],
  [
    'Expanded body',
    'OPTIONAL: swap the (now-fitting) 5-col input table for a read-only compact list (mean-con · reps×wt · loss%). Rail is read-only — density preference, no longer a fit blocker.',
  ],
  [
    'States',
    'Add context-swap (live/historical/idle) + a “live” header tag + leading index; drop input affordances.',
  ],
]

/**
 * ExerciseCard EXACTLY AS-IS vs ExerciseCard ADAPTED for the rail, both full 246px rails with pace.
 * The middle panel lists the specific deltas. This is the reuse question made concrete.
 */
export const Directions: Story = {
  name: 'ExerciseCard · exact vs adapted',
  render: () => (
    <Frame>
      <div className="speccol">
        <div className="speclabel">
          ExerciseCard rail — state mix (2 finished · 1 active · 2 upcoming)
        </div>
        <div className="rail">
          <ExerciseCardPlan />
        </div>
      </div>
      <div className="speccol">
        <div className="speclabel">old rail — adapted item (reference)</div>
        <div className="rail">
          <SessionPlan context="live" />
        </div>
      </div>
      <div className="speccol" style={{ width: 340, padding: '6px 4px 0 14px', overflowY: 'auto' }}>
        <div className="speclabel">reference · real ExerciseCard (native width)</div>
        <div style={{ marginBottom: 22 }}>
          <ReferenceCard />
        </div>
        <div className="speclabel">the rail modifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 8 }}>
          {RAIL_DELTAS.map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  color: '#FF7900',
                }}
              >
                {k}
              </span>
              <span style={{ fontSize: 12, lineHeight: 1.45, color: '#B8BEC9' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  ),
}

// ============================================================ decomposed pieces (for review)

/**
 * PIECE 1 · LIVE SESSION PLAN — the context header + expandable exercise skeleton with per-set
 * tick progress, reviewed in isolation across live / historical / idle (no pace footer).
 */
export const SessionPlanPiece: Story = {
  name: 'Piece · Live Session Plan',
  render: () => (
    <Frame>
      {(['live', 'historical', 'idle'] as RailContext[]).map((ctx) => (
        <div className="speccol" key={ctx}>
          <div className="speclabel">{ctx}</div>
          <div className="rail">
            <SessionPlan context={ctx} />
          </div>
        </div>
      ))}
    </Frame>
  ),
}

/**
 * PIECE 2 · SESSION PACE — the net-new pace tile in isolation, all states: behind / ahead / idle.
 * VMCP-primary (NAV-D05): plan-aware trim (behind) / add (ahead); idle → next-session budget.
 */
export const SessionPacePiece: Story = {
  name: 'Piece · Session Pace',
  render: () => (
    <Frame>
      {(
        [
          ['behind', 'live', false],
          ['ahead', 'live', true],
          ['idle', 'idle', false],
        ] as [string, RailContext, boolean][]
      ).map(([label, ctx, ahead]) => (
        <div className="speccol" key={label} style={{ height: 'auto' }}>
          <div className="speclabel">{label}</div>
          <div
            style={{ width: 246, background: 'var(--spine)', border: '1px solid var(--border)' }}
          >
            <PaceFooter context={ctx} ahead={ahead} onToggle={() => {}} />
          </div>
        </div>
      ))}
    </Frame>
  ),
}
