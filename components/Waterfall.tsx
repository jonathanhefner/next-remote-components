'use client'

import { remote, RemoteSuspense } from "@/lib/rrc"
import { getWaterfallIteration } from "./Waterfall.server"
import { useState } from "react"


const WaterfallIteration = remote(getWaterfallIteration)

export function Waterfall() {
  const [depth, setDepth] = useState(5)

  return <>
    <label>
      Depth:
      <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} />
    </label>

    <ul>
      <Waterfalling level={depth} />
    </ul>
  </>
}

export function Waterfalling({ level }: { level: number }) {
  return (
    <RemoteSuspense fallback={<li key="loading">Loading...</li>}>
      <WaterfallIteration level={level} />
    </RemoteSuspense>
  )
}
