'use client'

import { useRemote } from "@/lib/rrc"
import { useState } from "react"
import { getTypeaheadSuggestions } from "./Typeahead.server"


export default function Typeahead() {
  const [TypeaheadSuggestions] = useRemote(getTypeaheadSuggestions)
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
