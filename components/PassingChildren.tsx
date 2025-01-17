'use client'

import { useRemote } from "@/lib/rrc"
import { useState } from "react"
import { getUserSelect } from "./PassingChildren.server"


export default function PassingChildren() {
  const [UserSelect] = useRemote(getUserSelect)
  const [username, setUsername] = useState("Me")

  return <>
    <label>
      User logged in as:
      <input value={username} onChange={e => setUsername(e.target.value)} />
    </label>

    <label>
      Server component for user:
      <UserSelect>
        <option value={username}>{username}</option>
      </UserSelect>
    </label>
  </>
}
