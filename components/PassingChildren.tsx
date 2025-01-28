'use client'

import { remote, RemoteSuspense } from "@/lib/rrc"
import { useState } from "react"
import { getUserSelect } from "./PassingChildren.server"

const UserSelect = remote(getUserSelect)

export function PassingChildren() {
  const [username, setUsername] = useState("Me")

  return <>
    <label>
      User logged in as:
      <input value={username} onChange={e => setUsername(e.target.value)} />
    </label>

    <label>
      Server component for user:
      <RemoteSuspense fallback={<select disabled />}>
        <UserSelect>
          <option value={username}>{username}</option>
        </UserSelect>
      </RemoteSuspense>
    </label>
  </>
}
