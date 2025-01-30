'use server'

export async function getMonthGrid({ monthIndex }: { monthIndex: number }) {
  const items: React.ReactNode[] = []

  const firstOfMonth = new Date(1970, monthIndex, 1)
  while (items.length < firstOfMonth.getDay()) {
    items.push(<div key={items.length} />)
  }

  const daysInMonth = new Date(1970, monthIndex + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i += 1) {
    items.push(
      <div key={items.length}>
        {i}
        {(monthIndex ^ i) % 5 === 0 && <span className="event" />}
      </div>
    )
  }

  while (items.length < 6 * 7) {
    items.push(<div key={items.length} />)
  }

  return items
}
