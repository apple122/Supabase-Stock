import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function GET_Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Query the application schema `ap_system.users` table.
      // Ensure your Supabase row-level policies or grants allow this client to select.
      const { data, error } = await supabase
        .from('users') // schema-qualified table
        .select('id, fullname, email, password, tel, created_at')

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to fetch ap_system.users:', err)
      alert(err.message || err.error_description || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Auth Users</h3>
      <div style={{ marginBottom: 8 }}>
        <button className="button" onClick={fetchUsers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Fullname</th>
              <th>Password</th>
              <th>Phone</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ wordBreak: 'break-all' }}>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.fullname || '-'}</td>
                <td>{u.password || '-'}</td>
                <td>{u.tel}</td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
