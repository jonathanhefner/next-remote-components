'use server'

const batches: Record<string, string[]> = {
  "batch1": [...Array(50).keys().map(i => `Item ${i + 100}`)],
  "batch2": [...Array(50).keys().map(i => `Item ${i + 200}`)],
  "batch3": [...Array(50).keys().map(i => `Item ${i + 300}`)],
}

export async function getItemSelect({ batch }: { batch: string }) {
  const options = batches[batch] ?? []

  return (
    <select>
      {options.map(value =>
        <option key={value} value={value}>{value}</option>
      )}
    </select>
  )
}
