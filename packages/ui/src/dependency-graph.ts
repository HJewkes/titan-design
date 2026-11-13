// Subpath entry: @titan-design/react-ui/dependency-graph
//
// DependencyGraph (TD-1023): units boxed by tier with routed dependency edges, on a layout a
// build step computes, plus the pure helpers that build step needs (`egoSubgraph`,
// `fromCompoundLayout`). It sits behind its own subpath so it grows this entry rather than the
// root bundle every consumer measures.
export * from './components/ui/charts/dependency-graph'
