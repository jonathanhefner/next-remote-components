'use client'

import { useRemote } from "@/lib/rrc"
import { useState } from "react"
import { getItemOptions } from "./DynamicSelect.server"

export default function DynamicSelect() {
  const [ItemOptions, isLoading] = useRemote(getItemOptions)
  const [batch, setBatch] = useState("batch1")

  return <>
    <select value={batch} onChange={e => setBatch(e.target.value)}>
      <option value="batch1">Batch 1</option>
      <option value="batch2">Batch 2</option>
      <option value="batch3">Batch 3</option>
    </select>

    <select disabled={isLoading}>
      <ItemOptions batch={batch} fallback={<option>Loading...</option>} />
    </select>
  </>
}
