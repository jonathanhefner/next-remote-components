'use client'

import { useRemote } from "@/lib/rrc"
import { useState } from "react"
import { getTypeaheadSuggestions } from "./Typeahead.server"

const TypeaheadSuggestions = useRemote(getTypeaheadSuggestions)

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
      {value && <TypeaheadSuggestions inputValue={value} />}
    </datalist>
  </>
}
