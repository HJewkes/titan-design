// Synthetic repo-map/v1 data for a made-up three-part notes app. No real repository is described.
import type { MapLayout, MapTimeline } from './types'

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h })

export const mapLayoutFixture: MapLayout = {
  version: 'repo-map/v1',
  width: 2400,
  height: 1400,
  levels: [
    { id: 0, name: 'context' },
    { id: 1, name: 'containers' },
    { id: 2, name: 'components' },
    { id: 3, name: 'code' },
  ],
  nodes: [
    { id: 'actor:user', label: 'Note taker', level: 0, kind: 'actor', box: box(40, 600, 220, 96) },
    { id: 'sys:notes', label: 'notes', level: 0, kind: 'system', box: box(360, 40, 1800, 1320) },
    { id: 'ext:db', label: 'Database', level: 0, kind: 'external', box: box(2200, 600, 180, 96) },
    {
      id: 'pkg/api',
      label: 'api',
      sublabel: 'HTTP server',
      level: 1,
      kind: 'package',
      parentId: 'sys:notes',
      box: box(400, 80, 820, 600),
    },
    {
      id: 'pkg/store',
      label: 'store',
      sublabel: 'SQL access',
      level: 1,
      kind: 'package',
      parentId: 'sys:notes',
      box: box(1300, 80, 820, 600),
    },
    {
      id: 'pkg/web',
      label: 'web',
      sublabel: 'Client',
      level: 1,
      kind: 'package',
      parentId: 'sys:notes',
      box: box(400, 740, 1720, 580),
    },
    {
      id: 'pkg/api/routes',
      label: 'routes',
      level: 2,
      parentId: 'pkg/api',
      box: box(430, 140, 360, 500),
    },
    {
      id: 'pkg/api/auth',
      label: 'auth',
      level: 2,
      parentId: 'pkg/api',
      box: box(830, 140, 360, 240),
    },
    {
      id: 'pkg/store/src',
      label: 'src',
      level: 2,
      parentId: 'pkg/store',
      box: box(1330, 140, 760, 500),
    },
    {
      id: 'pkg/api/+more',
      label: '+3 more',
      level: 2,
      kind: 'overflow',
      parentId: 'pkg/api',
      box: box(830, 420, 360, 80),
      hidden: 3,
    },
    {
      id: 'pkg/api/routes/notes.ts',
      label: 'notes.ts',
      level: 3,
      kind: 'file',
      parentId: 'pkg/api/routes',
      box: box(450, 200, 320, 56),
    },
    {
      id: 'pkg/api/auth/session.ts',
      label: 'session.ts',
      level: 3,
      kind: 'file',
      parentId: 'pkg/api/auth',
      box: box(850, 200, 320, 56),
    },
    {
      id: 'pkg/store/src/notes-repo.ts',
      label: 'notes-repo.ts',
      level: 3,
      kind: 'file',
      parentId: 'pkg/store/src',
      box: box(1350, 200, 320, 56),
    },
  ],
  // Every level is routed: L0 and L1 by a second ELK pass over the collapsed graph with fixed boxes.
  edges: [
    {
      id: 'e:user->sys',
      source: 'actor:user',
      target: 'sys:notes',
      level: 0,
      edgeSource: 'protocol',
      label: 'edits notes',
      route: [
        [260, 648],
        [360, 648],
      ],
    },
    {
      id: 'e:sys->db',
      source: 'sys:notes',
      target: 'ext:db',
      level: 0,
      edgeSource: 'protocol',
      label: 'stores rows',
      route: [
        [2160, 648],
        [2200, 648],
      ],
    },
    {
      id: 'e:web->api',
      source: 'pkg/web',
      target: 'pkg/api',
      level: 1,
      edgeSource: 'protocol',
      label: 'POST /notes',
      weight: 12,
      route: [
        [810, 740],
        [810, 680],
      ],
    },
    {
      id: 'e:api->store',
      source: 'pkg/api',
      target: 'pkg/store',
      level: 1,
      edgeSource: 'import',
      weight: 26,
      route: [
        [1220, 380],
        [1300, 380],
      ],
    },
    {
      id: 'e:notes->session',
      source: 'pkg/api/routes/notes.ts',
      target: 'pkg/api/auth/session.ts',
      level: 3,
      edgeSource: 'call',
      route: [
        [770, 228],
        [810, 228],
        [850, 228],
      ],
    },
    {
      id: 'e:notes->repo',
      source: 'pkg/api/routes/notes.ts',
      target: 'pkg/store/src/notes-repo.ts',
      level: 3,
      edgeSource: 'call',
      route: [
        [610, 256],
        [610, 300],
        [1510, 300],
        [1510, 256],
      ],
    },
  ],
  flows: [
    {
      id: 'flow:create-note',
      title: 'Create one note',
      hops: [
        { step: 1, edgeId: 'e:web->api', from: 'pkg/web', to: 'pkg/api', edgeSource: 'protocol' },
        {
          step: 2,
          edgeId: 'e:notes->session',
          from: 'pkg/api/routes/notes.ts',
          to: 'pkg/api/auth/session.ts',
          edgeSource: 'call',
        },
        {
          step: 3,
          edgeId: 'e:notes->repo',
          from: 'pkg/api/routes/notes.ts',
          to: 'pkg/store/src/notes-repo.ts',
          edgeSource: 'call',
        },
      ],
      projected: {
        1: [
          { from: 'pkg/web', to: 'pkg/api' },
          { from: 'pkg/api', to: 'pkg/store' },
        ],
      },
    },
  ],
  cards: [
    { id: 'card:notes.ts', kind: 'file', anchor: 'pkg/api/routes/notes.ts' },
    { id: 'card:Note', kind: 'schema', anchor: 'pkg/store/src/notes-repo.ts' },
    { id: 'card:api-size', kind: 'stat', anchor: 'pkg/api' },
  ],
  sha: 'sha256:synthetic-fixture',
}

/**
 * Three boxes and no routes, so every edge runs straight between borders: an import and a call share
 * one pair, and an import and a traced edge run each way between another.
 */
export const straightMapFixture: MapLayout = {
  version: 'repo-map/v1',
  width: 1040,
  height: 520,
  levels: [{ id: 1, name: 'containers' }],
  nodes: [
    { id: 'pkg/web', label: 'web', level: 1, kind: 'package', box: box(40, 60, 240, 96) },
    { id: 'pkg/api', label: 'api', level: 1, kind: 'package', box: box(440, 60, 240, 96) },
    { id: 'pkg/store', label: 'store', level: 1, kind: 'package', box: box(440, 360, 240, 96) },
  ],
  edges: [
    {
      id: 'e:web->api:import',
      source: 'pkg/web',
      target: 'pkg/api',
      level: 1,
      edgeSource: 'import',
    },
    { id: 'e:web->api:call', source: 'pkg/web', target: 'pkg/api', level: 1, edgeSource: 'call' },
    { id: 'e:api->store', source: 'pkg/api', target: 'pkg/store', level: 1, edgeSource: 'import' },
    { id: 'e:store->api', source: 'pkg/store', target: 'pkg/api', level: 1, edgeSource: 'traced' },
  ],
  flows: [],
  cards: [],
  sha: 'sha256:synthetic-straight',
}

/**
 * Two map spans with a non-map span between them (6 s to 9 s), as when a video leaves the map for
 * another slide and comes back. The `lit` change at 5.8 s straddles the exit.
 */
export const mapTimelineFixture: MapTimeline = {
  layoutSha: mapLayoutFixture.sha,
  spans: [
    { startS: 0, endS: 6 },
    { startS: 9, endS: 14 },
  ],
  keyframes: [
    { atS: 0, durS: 0, op: 'level', level: 1 },
    { atS: 0.5, durS: 0.4, op: 'reveal', ids: ['pkg/web'] },
    { atS: 1.5, durS: 0.4, op: 'reveal', ids: ['pkg/api'] },
    { atS: 1.5, durS: 0.6, op: 'edge', ids: ['e:web->api'] },
    { atS: 2.5, durS: 0.4, op: 'reveal', ids: ['pkg/store'] },
    { atS: 2.5, durS: 0.6, op: 'edge', ids: ['e:api->store'] },
    { atS: 3, durS: 0.25, op: 'minimap', on: true },
    { atS: 4, durS: 0.4, op: 'focus', ids: ['pkg/api', 'pkg/web'] },
    { atS: 5.8, durS: 0.4, op: 'lit', ids: ['pkg/api'] },
    { atS: 9.2, durS: 0, op: 'level', level: 3 },
    { atS: 9.2, durS: 0.4, op: 'reveal', ids: ['pkg/api/routes/notes.ts'] },
    { atS: 9.5, durS: 0.4, op: 'focus', ids: ['pkg/api/routes/notes.ts'] },
    { atS: 10, durS: 0.25, op: 'card-in', ids: ['card:notes.ts'] },
    { atS: 12.5, durS: 0.25, op: 'card-out', ids: ['card:notes.ts'] },
  ],
}
