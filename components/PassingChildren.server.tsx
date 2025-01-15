'use server'

export async function getUserSelect({ children }: { children?: React.ReactNode }) {
  const users = [...Array(10).keys().map(i => ({ id: i + 1, name: `User ${i + 1}` }))]

  return (
    <select>
      {children}
      {children && <hr />}
      {users.map(user =>
        <option key={user.id} value={user.id}>{user.name}</option>
      )}
    </select>
  )
}
