export default async function TypeaheadSuggestions({ inputValue }: { inputValue: string }) {
  const suggestions = [...Array(10).keys().map(i => `${inputValue}${i}`)]

  return suggestions.map(value => <option key={value} value={value} />)
}
