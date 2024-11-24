'use client'

import type myRemoteComponents from "@/components/my-remote-components"
import { useRemoteComponents } from "@/lib/rrc-client"

const { MyServerComponent } = useRemoteComponents<typeof myRemoteComponents>("/api/remote-component")

export default function MyClientComponent() {
  const refCallback = (el: HTMLParagraphElement) => console.log("ref", el)

  return (
    <MyServerComponent hello="world" ref={refCallback}>
      <MyChildComponent />
    </MyServerComponent>
  )
}

function MyChildComponent() {
  return <strong>child</strong>
}
