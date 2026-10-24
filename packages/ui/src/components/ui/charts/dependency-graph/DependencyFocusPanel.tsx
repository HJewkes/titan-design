import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Typography } from '../../typography'
import type { DependencyNeighbourhood, DependencyNode } from './types'

const nameOf = (node: DependencyNode) => node.label || node.id

function NeighbourLine({ title, nodes }: { title: string; nodes: readonly DependencyNode[] }) {
  return (
    <Typography variant="body2" color="secondary">
      {`${title}: ${nodes.length === 0 ? 'nothing' : nodes.map(nameOf).join(', ')}`}
    </Typography>
  )
}

export interface DependencyFocusPanelProps {
  /** The focused node, or null for the hint. */
  node: DependencyNode | null
  neighbours: DependencyNeighbourhood
  link: ReactNode
}

/** Names the focused node, its direct dependencies and dependents, and the consumer's link. */
export function DependencyFocusPanel({ node, neighbours, link }: DependencyFocusPanelProps) {
  return (
    <View aria-live="polite" className="gap-stack-xs" testID="dependency-graph-focus">
      {node ? (
        <>
          <Typography variant="subtitle1">{nameOf(node)}</Typography>
          {node.description ? (
            <Typography variant="body2" color="secondary">
              {node.description}
            </Typography>
          ) : null}
          <NeighbourLine title="Depends on" nodes={neighbours.dependsOn} />
          <NeighbourLine title="Used by" nodes={neighbours.usedBy} />
          {link}
        </>
      ) : (
        <Typography variant="body2" color="secondary">
          Select a box to list what it depends on and what depends on it.
        </Typography>
      )}
    </View>
  )
}
