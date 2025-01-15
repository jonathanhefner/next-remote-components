'use client'

import { useRemote } from "@/lib/rrc"
import { useState } from "react"
import { getItemSelect } from "./DynamicSelect.server"

const ItemSelect = useRemote(getItemSelect)

export default function DynamicSelect() {
  const [batch, setBatch] = useState("batch1")

  return <>
    <select value={batch} onChange={e => setBatch(e.target.value)}>
      <option value="batch1">Batch 1</option>
      <option value="batch2">Batch 2</option>
      <option value="batch3">Batch 3</option>
    </select>

    <ItemSelect batch={batch} fallback={<Loading />} />
  </>
}

function Loading() {
  return (
    <select disabled>
      <option>Loading...</option>
    </select>
  )
}
