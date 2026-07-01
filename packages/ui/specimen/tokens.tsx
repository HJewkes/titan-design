import React from 'react'
import { createRoot } from 'react-dom/client'
import '../src/theme/global.css'
import { colorTokenNames } from './token-source'

/**
 * Token-resolution specimen. Renders one swatch per color token, coloured by
 * the token's CSS custom property (`var(--color-*)`) so the browser resolves it
 * exactly as a NativeWind `bg-*` class would (tailwind.config.js maps every
 * `bg-*` class to the same `var(--color-*)`). `token-resolution.spec.ts` reads
 * each swatch's computed colour, in both themes, and asserts it matches the
 * source-of-truth value in `src/theme/config.ts`.
 */
function App() {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 16, margin: '0 0 12px' }}>Token Resolution Specimen</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {colorTokenNames.map((name) => (
          <div
            key={name}
            data-token={name}
            title={name}
            style={{
              width: 44,
              height: 44,
              backgroundColor: `var(${name})`,
              border: '1px solid #808080',
            }}
          />
        ))}
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  createRoot(container).render(<App />)
}
