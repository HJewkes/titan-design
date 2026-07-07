import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { TopBar } from './TopBar'
import { SessionStatePill } from './SessionStatePill'
import { DeviceMenu } from './DeviceMenu'
import { DeviceRow, type Device } from './DeviceRow'
import { BrandLockup } from './BrandLockup'

const DEVICES: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'connected' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]
const DEVICES_LOST: Device[] = [
  { id: 'Voltra-A3F2', nickname: 'Left Cable', slot: 'L', state: 'lost' },
  { id: 'Voltra-9B1C', nickname: 'Right Cable', slot: 'R', state: 'connected' },
  { id: 'Voltra-77E0', nickname: 'Spare', slot: null, state: 'available' },
]

// A fixed moment for the parity comparison (so both sides show the same time).
const FIXED_TIME = new Date(2024, 0, 1, 16, 12)

const meta: Meta<typeof TopBar> = {
  title: 'Shell/Organisms/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism** — the persistent shell chrome band. Composes ' +
          '[BrandLockup](?path=/docs/shell-molecules-brandlockup--docs) + ' +
          '[SessionStatePill](?path=/docs/shell-molecules-sessionstatepill--docs) + ' +
          '[Divider](?path=/docs/components-divider--docs) (`bg-border-prominent`) + ' +
          '[DeviceMenu](?path=/docs/shell-organisms-devicemenu--docs) + ' +
          '[DateTime](?path=/docs/custom-datetime--docs) (`variant="mono"` live clock). ' +
          'Background = the shared `surfaceGradient.chrome` gradient primitive; container-responsive via onLayout (SIZE-D01).',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TopBar>

/** The resolved shipping bar — Live, set active. The clock ticks live (DateTime `live`). Click the glyph for devices. */
export const Live: Story = {
  render: () => <TopBar state="live" devices={DEVICES} />,
}

/** All session states, plus a device-lost fault (glyph turns red, state stays LIVE). */
export const States: Story = {
  render: () => (
    <View className="gap-2 bg-background-base p-3">
      <TopBar state="live" devices={DEVICES} />
      <TopBar state="rest" devices={DEVICES} />
      <TopBar state="idle" devices={DEVICES} />
      <TopBar state="live" devices={DEVICES_LOST} />
    </View>
  ),
}

/** Container-responsive (SIZE-D01): wall → tablet drops subtitle → phone drops clock. */
export const Responsive: Story = {
  render: () => (
    <View className="gap-3 bg-background-base p-3">
      <View style={{ width: 1280 }}>
        <TopBar state="live" devices={DEVICES} />
      </View>
      <View style={{ width: 820 }}>
        <TopBar state="live" devices={DEVICES} />
      </View>
      <View style={{ width: 390 }}>
        <TopBar state="live" devices={DEVICES} />
      </View>
    </View>
  ),
}

/* ── HTML reference (the pre-titan specimen) for the parity comparison ───────── */
const REF_CSS = `
.s1ref *{box-sizing:border-box}
.s1ref .bar{height:46px;display:flex;align-items:center;gap:14px;padding:0 16px;
  background:linear-gradient(180deg,#141519,#101113);border-bottom:1px solid #212429;border-radius:7px;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.s1ref .brand{font-weight:800;letter-spacing:1.5px;font-size:12px;color:#e9eaec;display:flex;align-items:center;gap:7px}
.s1ref .brand .mk{color:#ff7900;font-size:14px}
.s1ref .brand .dim{font-weight:600;letter-spacing:.4px;color:#5f646c;font-size:10px}
.s1ref .cluster{display:flex;align-items:center;gap:12px;margin-left:auto;font-family:ui-monospace,Menlo,monospace;font-size:11px}
.s1ref .div{width:1px;height:16px;background:#3a3e45}
.s1ref .state{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:.5px;color:#e9eaec}
.s1ref .state.idle{color:#9aa0a8;font-weight:600}
.s1ref .dot{width:8px;height:8px;border-radius:50%}
.s1ref .dot.green{background:#2ed573;box-shadow:0 0 0 0 rgba(46,213,115,.6);animation:s1pulse 1.6s infinite}
.s1ref .dot.amber{background:#ffa502}
.s1ref .dot.off{background:#5f646c}
@keyframes s1pulse{0%{box-shadow:0 0 0 0 rgba(46,213,115,.55)}70%{box-shadow:0 0 0 7px rgba(46,213,115,0)}100%{box-shadow:0 0 0 0 rgba(46,213,115,0)}}
.s1ref .dev{display:flex;align-items:center;justify-content:center;width:26px;height:28px;color:#2ed573}
.s1ref .dev.lost{color:#ff4757}
.s1ref .dev svg{width:18px;height:18px}
.s1ref .clock{color:#9aa0a8;min-width:38px;text-align:right}
`
const BT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7 17 17 12 22 12 2 17 7 7 17"/></svg>`
function htmlBar(opts: {
  dotClass: string
  label: string
  labelIdle?: boolean
  devLost?: boolean
  time: string
}) {
  return `<div class="bar"><div class="brand"><span class="mk">◇</span> VOLTRAS <span class="dim">/ wall dashboard</span></div>
  <div class="cluster"><div class="state${opts.labelIdle ? ' idle' : ''}"><span class="dot ${opts.dotClass}"></span>${opts.label}</div>
  <div class="div"></div><div class="dev${opts.devLost ? ' lost' : ''}">${BT}</div><div class="div"></div><div class="clock">${opts.time}</div></div></div>`
}

/** HTML reference (top) vs titan React (bottom), per state — the parity check. */
export const Comparison: Story = {
  render: () => (
    <div style={{ background: '#101010', padding: 12 }}>
      <style>{REF_CSS}</style>
      {[
        {
          html: { dotClass: 'green', label: 'LIVE', time: '16:12' },
          titan: { state: 'live' as const },
        },
        {
          html: { dotClass: 'amber', label: 'REST', time: '16:14' },
          titan: { state: 'rest' as const },
        },
        {
          html: { dotClass: 'off', label: 'IDLE', labelIdle: true, time: '16:31' },
          titan: { state: 'idle' as const },
        },
        {
          html: { dotClass: 'green', label: 'LIVE', devLost: true, time: '16:12' },
          titan: { state: 'live' as const, lost: true },
        },
      ].map((row, i) => (
        <div key={i} style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6B7280', marginBottom: 4 }}>
            HTML reference ↓
          </div>
          <div className="s1ref" dangerouslySetInnerHTML={{ __html: htmlBar(row.html) }} />
          <div
            style={{ fontFamily: 'monospace', fontSize: 10, color: '#FF7900', margin: '6px 0 4px' }}
          >
            titan React ↓
          </div>
          <TopBar
            state={row.titan.state}
            devices={row.titan.lost ? DEVICES_LOST : DEVICES}
            time={FIXED_TIME}
          />
        </div>
      ))}
    </div>
  ),
}

/** The sub-components S1 decomposes into (each shippable on its own). */
export const Parts: Story = {
  render: () => (
    <View className="gap-4 bg-background-base p-4">
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">BrandLockup</Text>
        <BrandLockup />
      </View>
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">
          SessionStatePill (= StatusPill)
        </Text>
        <View className="flex-row gap-4">
          <SessionStatePill state="live" />
          <SessionStatePill state="rest" />
          <SessionStatePill state="idle" />
        </View>
      </View>
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">DeviceMenu (click to open)</Text>
        <View className="flex-row">
          <DeviceMenu devices={DEVICES} />
        </View>
      </View>
      <View className="gap-1">
        <Text className="font-mono text-[10px] text-text-tertiary">DeviceRow</Text>
        <View className="w-[320px] bg-surface-elevated rounded-lg p-1">
          {DEVICES.map((d) => (
            <DeviceRow key={d.id} device={d} />
          ))}
        </View>
      </View>
    </View>
  ),
}
