'use client'

import { useRemoteComponents } from "@/lib/rrc-client"
import type myRemoteComponents from "./my-remote-components"
import { useState } from "react"

const { TypeaheadSuggestions } = useRemoteComponents<typeof myRemoteComponents>("/api/remote-component")

export default function Typeahead() {
  const [value, setValue] = useState("")

  return <>
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
      list="typeahead-suggestions"
    />
    <TypeaheadSuggestions id="typeahead-suggestions" inputValue={value} />
  </>
}