'use server'

import { Waterfalling } from "./Waterfall"

export async function getWaterfallIteration({ level }: { level: number }) {
  await new Promise(resolve => setTimeout(resolve, 1000))

  return <>
    <li key={level}>{level}...</li>
    {level > 1 && <Waterfalling level={level - 1} />}
  </>
}
