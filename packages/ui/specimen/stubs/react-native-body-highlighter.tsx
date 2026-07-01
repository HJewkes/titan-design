/**
 * Specimen-only stub for `react-native-body-highlighter`.
 *
 * The package ships no web build, and its Node-targeted ESM interop resolves
 * `react` through a dynamic `require()` that throws in a browser ESM context
 * ("Dynamic require of 'react' is not supported"). Its sole consumer, BodyMap,
 * is not part of the HTML-vs-React atom comparison the specimen renders, but it
 * is pulled in eagerly via the `custom/Workout` barrel. Aliasing it to this
 * no-op default (see specimen/vite.config.ts) lets the barrel load so the atom
 * specimens can render. BodyMap itself cannot be exercised in the specimen
 * until the upstream package gains a web build.
 */
export default function BodyHighlighterStub(): null {
  return null
}
