'use client'

import { remote, RemoteSuspense } from "@/lib/rrc"
import { getMonthGrid } from "./EventCalendar.server"
import { useState } from "react"

const MonthGrid = remote(getMonthGrid)

export function EventCalendar() {
  const now = new Date()
  const [monthIndex, setMonthIndex] = useState(now.getMonth() + 12 * (now.getFullYear() - 1970))

  const firstOfMonth = new Date(1970, monthIndex, 1)
  const monthName = firstOfMonth.toLocaleString("default", { month: "short" })
  const year = firstOfMonth.getFullYear()

  return <>
    <nav>
      <button onClick={() => setMonthIndex(monthIndex - 1)}>&laquo;</button>
      <div className="calendar-month">{monthName} {year}</div>
      <button onClick={() => setMonthIndex(monthIndex + 1)}>&raquo;</button>
    </nav>

    <div className="calendar-grid">
      <RemoteSuspense fallback={<Loading />}>
        <MonthGrid monthIndex={monthIndex} />
      </RemoteSuspense>
    </div>
  </>
}

function Loading() {
  return [...Array(6 * 7)].map((_, i) => <div key={i} />)
}
