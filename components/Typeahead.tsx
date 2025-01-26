'use client'

import { remote, RemoteSuspense } from "@/lib/rrc"
import { useState } from "react"
import { getTypeaheadSuggestions } from "./Typeahead.server"

const TypeaheadSuggestions = remote(getTypeaheadSuggestions)

export default function Typeahead() {
  const [value, setValue] = useState("")

  return <>
    <input
      type="search"
      value={value}
      onChange={e => setValue(e.target.value)}
      list="typeahead-suggestions"
    />
    <datalist id="typeahead-suggestions">
      <RemoteSuspense>
        {value && <TypeaheadSuggestions inputValue={value} />}
      </RemoteSuspense>
    </datalist>
  </>
}
