import { expectTypeOf, test } from 'vitest'
import type { AgentSummary } from './agent-metrics'
import type { AgentRosterEntry } from './agent-types'

type SharedField = keyof AgentRosterEntry & keyof AgentSummary

test('every field a roster entry shares with the summary passes over unchanged', () => {
  expectTypeOf<Pick<AgentRosterEntry, SharedField>>().toExtend<Pick<AgentSummary, SharedField>>()
})

test('the renamed fields accept the roster values as they come', () => {
  expectTypeOf<AgentRosterEntry['workingOn']>().toExtend<AgentSummary['task']>()
  expectTypeOf<AgentRosterEntry['gitBranch']>().toExtend<AgentSummary['branch']>()
  expectTypeOf<AgentRosterEntry['dnd']>().toExtend<AgentSummary['isDnd']>()
  expectTypeOf<AgentRosterEntry['provisional']>().toExtend<AgentSummary['isProvisional']>()
})
