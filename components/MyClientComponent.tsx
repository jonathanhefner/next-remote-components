'use client'

import type myRemoteComponents from "@/components/my-remote-components"
import { useRemoteComponents } from "@/lib/rrc-client"
import { useState } from "react"

const { MyServerComponent } = useRemoteComponents<typeof myRemoteComponents>("/api/remote-component")

export default function MyClientComponent() {
  const [name, setName] = useState("world")
  const [counters, setCounters] = useState(1)

  const refCallback = (el: HTMLSpanElement) => {
    if (el) el.classList.add("flash")
  }

  return <>
    <div>
      <div>
        <label htmlFor="name">Name:</label>
        <input id="name"
          value={name} onChange={e => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="counters">Counters:</label>
        <input id="counters" type="number"
          value={counters} onChange={e => setCounters(Number(e.target.value))}
        />
      </div>
    </div>

    <div>
      <MyServerComponent hello={name} repeat={counters} ref={refCallback}>
        <MyChildComponent />
      </MyServerComponent>
    </div>
  </>
}

function MyChildComponent() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(count + 1)}>
      Click count: {count}
    </button>
  )
}
