import { createContext, type Context } from 'react'

const registry = globalThis as unknown as Record<symbol, Context<unknown> | undefined>

/**
 * A React context with one identity per realm, however many copies of the defining module
 * load. tsup builds every entry self-contained (`splitting: false`), so `dist/index.mjs`,
 * `dist/workout.mjs`, `dist/theme/index.mjs` … each bundle their own copy of a context
 * module, and the CJS and ESM builds can both load in one app. A plain `createContext` per
 * copy means a provider from one entry never reaches a reader bundled into another.
 * `Symbol.for` keys the registry, so every copy finds the context the first one created.
 *
 * Only for contexts a consumer may provide from one entry and read from another; the key
 * names the value shape, so change it if that shape ever changes incompatibly.
 */
export function sharedContext<T>(key: string, defaultValue: T): Context<T> {
  const symbol = Symbol.for(`@titan-design/react-ui/${key}`)
  const existing = registry[symbol] as Context<T> | undefined
  if (existing) return existing
  const context = createContext<T>(defaultValue)
  context.displayName = key
  registry[symbol] = context as Context<unknown>
  return context
}
