'use client'

import { useRemoteComponents } from "@/lib/rrc-client"
import { Suspense, useState } from "react"
import type myRemoteComponents from "./my-remote-components"

const { DynamicSelectServer } = useRemoteComponents<typeof myRemoteComponents>("/api/remote-component")

export default function DynamicSelectClient() {
  const [batch, setBatch] = useState("batch1")

  return <>
    <select value={batch} onChange={e => setBatch(e.target.value)}>
      <option value="batch1">Batch 1</option>
      <option value="batch2">Batch 2</option>
      <option value="batch3">Batch 3</option>
    </select>
    <Suspense fallback={<Loading />}>
      <DynamicSelectServer batch={batch} />
    </Suspense>
  </>
}

function Loading() {
  return (
    <select disabled>
      <option>Loading...</option>
    </select>
  )
}
