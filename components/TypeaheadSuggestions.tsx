export default async function TypeaheadSuggestions({ id, inputValue }: { id: string, inputValue: string }) {
  const suggestions = [...Array(10).keys().map(i => `${inputValue}${i}`)]

  return (
    <datalist id={id}>
      {suggestions.map(value =>
        <option key={value} value={value} />
      )}
    </datalist>
  )
}
