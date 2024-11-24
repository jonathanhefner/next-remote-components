const batches: Record<string, number[]> = {
  "batch1": [...Array(50).keys().map(i => i + 100)],
  "batch2": [...Array(50).keys().map(i => i + 200)],
  "batch3": [...Array(50).keys().map(i => i + 300)],
}

export default async function DynamicSelectServer({ batch }: { batch: string }) {
  const options = batches[batch] ?? []

  return (
    <select>
      {options.map(value =>
        <option key={value} value={value}>{value}</option>
      )}
    </select>
  )
}
