'use client'

import { useRemote } from "@/lib/rrc"
import TypeaheadSuggestions from "./TypeaheadSuggestions"

export default function Typeahead2() {
  const [remote, setRemoteProps] = useRemote(TypeaheadSuggestions)

  return <>
    <input
      type="search"
      onChange={e => setRemoteProps({ inputValue: e.target.value })}
      list="typeahead-suggestions2"
    />
    <datalist id="typeahead-suggestions2">{remote}</datalist>
  </>
}
