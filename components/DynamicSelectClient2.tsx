'use client'

import { useRemote } from "@/lib/rrc"
import DynamicSelectServer from "./DynamicSelectServer"

export default function DynamicSelectClient2() {
  const [remote, setRemoteProps] = useRemote(DynamicSelectServer)

  return <>
    <select onChange={e => setRemoteProps({ batch: e.target.value })}>
      <option value=""></option>
      <option value="batch1">Batch 1</option>
      <option value="batch2">Batch 2</option>
      <option value="batch3">Batch 3</option>
    </select>

    {remote}
  </>
}

// @ts-expect-error
DynamicSelectServer.Initial = function () {
  return (
    <select disabled>
    </select>
  )
}

// @ts-expect-error
DynamicSelectServer.Loading = function() {
  return (
    <select disabled>
      <option>Loading...</option>
    </select>
  )
}
