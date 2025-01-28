'use client'

import { remote, RemoteSuspense } from "@/lib/rrc"
import { useState } from "react"
import { getItemOptions } from "./DynamicSelect.server"

const ItemOptions = remote(getItemOptions)

export function DynamicSelect() {
  const [batch, setBatch] = useState("batch1")

  return <>
    <select value={batch} onChange={e => setBatch(e.target.value)}>
      <option value="batch1">Batch 1</option>
      <option value="batch2">Batch 2</option>
      <option value="batch3">Batch 3</option>
    </select>

    <RemoteSuspense fallback={<Loading />}>
      <select>
        <ItemOptions batch={batch} />
      </select>
    </RemoteSuspense>
  </>
}

function Loading() {
  return (
    <select disabled>
      <option>Loading...</option>
    </select>
  )
}
