import React, { useRef } from 'react'
import { View } from 'react-native'
import { Surface } from '../surface/Surface'
import { AmbientStage } from './AmbientStage'
import {
  stageBox,
  STAGE_METRICS_S96,
  type StageChrome,
  type StageFrame,
  type StageRect,
} from './stage-box'
import { useStageFit } from './stage-fit'

/** `canvas`: slot content is authored at half-1080 units and scaled up; `frame`: in frame px. */
export type BeatStageUnits = 'canvas' | 'frame'

/** Props for {@link BeatStage}. */
export interface BeatStageProps {
  /** The output frame, e.g. `{ width: 1920, height: 1080 }`. */
  frame: StageFrame
  /** The bands around the stage; see {@link stageBox}. */
  chrome?: StageChrome
  /** Rendered in the header band. */
  header?: React.ReactNode
  /** Rendered in the chip band, bottom-aligned. */
  chips?: React.ReactNode
  /**
   * Default `canvas`: slots lay out on a 540-high design canvas scaled by `height / 540`, so titan's
   * type steps land on the video scale (`h2` 48 → 96 px at 1080). `frame` skips the scale.
   */
  units?: BeatStageUnits
  /** Picks the grain field; see {@link AmbientStage}. */
  seed?: number
  /** Names the beat in the overflow error thrown in development. */
  label: string
  /** The stage content, fit-checked against the stage box. */
  children?: React.ReactNode
}

const CANVAS_HEIGHT = 540

interface SlotProps {
  rect: StageRect
  zoom: number
  testID: string
  /** Inner padding in slot units: the band's own pad above and below its content. */
  pad?: { top?: number; bottom?: number }
  justify?: 'flex-start' | 'flex-end'
  slotRef?: React.RefObject<View>
  children?: React.ReactNode
}

function Slot({ rect, zoom, testID, pad, justify = 'flex-start', slotRef, children }: SlotProps) {
  const scaled = zoom === 1 ? null : { transform: [{ scale: zoom }], transformOrigin: 'left top' }
  return (
    <View
      ref={slotRef}
      testID={testID}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width / zoom,
        height: rect.height / zoom,
        paddingTop: pad?.top,
        paddingBottom: pad?.bottom,
        justifyContent: justify,
        ...scaled,
      }}
    >
      {children}
    </View>
  )
}

/** A slot whose content throws in development when it runs past the slot. */
function FitSlot({ label, ...props }: SlotProps & { label: string }) {
  const ref = useRef<View>(null)
  useStageFit(ref, label)
  return <Slot {...props} slotRef={ref} />
}

/** The header and chip bands' own padding, in slot units. */
function bandPads(chrome: StageChrome | undefined, frameScale: number, zoom: number) {
  const m = { ...STAGE_METRICS_S96, ...chrome?.metrics }
  const px = (v: number) => (v * frameScale) / zoom
  const headerTop = chrome?.headerAt === 'bottom' ? m.gap : m.topPad
  return { header: { top: px(headerTop) }, chips: { bottom: px(m.bottomPad) } }
}

/**
 * A video beat's frame: the warm stage plane, a header band, a fit-checked stage and a chip band,
 * placed by {@link stageBox}. The root is a `base` plane, so a `Card elevation={1..3}` on the stage
 * lifts from it. Time is a prop: the component reads no clock.
 *
 * @example
 * <BeatStage frame={{ width: 1920, height: 1080 }} label="intro" header={<Lockup />}>
 *   <Card elevation={2}>{body}</Card>
 * </BeatStage>
 */
export function BeatStage(props: BeatStageProps) {
  const { frame, chrome, header, chips, units = 'canvas', seed, label, children } = props
  const box = stageBox(frame, chrome)
  const zoom = units === 'canvas' ? frame.height / CANVAS_HEIGHT : 1
  const pads = bandPads(chrome, box.scale, zoom)
  return (
    <Surface level="base" style={{ width: frame.width, height: frame.height }}>
      <AmbientStage seed={seed} className="absolute inset-0 bg-transparent">
        <Slot rect={box.header} zoom={zoom} pad={pads.header} testID="beat-stage-header">
          {header}
        </Slot>
        <FitSlot rect={box.stage} zoom={zoom} label={label} testID="beat-stage-stage">
          {children}
        </FitSlot>
        <FitSlot
          rect={box.chipBand}
          zoom={zoom}
          pad={pads.chips}
          justify="flex-end"
          label={`${label} chips`}
          testID="beat-stage-chips"
        >
          {chips}
        </FitSlot>
      </AmbientStage>
    </Surface>
  )
}
