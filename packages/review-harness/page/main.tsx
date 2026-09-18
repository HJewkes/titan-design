import { createRoot } from 'react-dom/client'
import 'virtual:titan-tokens.css'
import type { Manifest } from '../src/schema.ts'
import { App } from './App.tsx'
import './styles.css'

interface RoundResponse {
  manifest: Manifest
  manifestSha256: string
}

const root = createRoot(document.getElementById('root') as HTMLElement)
fetch('api/round')
  .then((res) => res.json() as Promise<RoundResponse>)
  .then((round) => root.render(<App {...round} />))
  .catch((err: Error) =>
    root.render(<p className="sent">Could not load the round: {err.message}</p>)
  )
