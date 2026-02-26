import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login({ onUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setUser(null)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, fullname, email, password, tel, created_at')
        .eq('email', email)
        .eq('password', password)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setUser(data)
      try {
        onUser?.(data)
        localStorage.setItem('data', JSON.stringify(data.fullname))
        localStorage.setItem('data_id', JSON.stringify(data.id))
      } catch (err) {
        console.warn('onUser callback error', err)
      }
    } catch (err) {
      console.error('Get user error', err)
      setError(err.message || 'Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h3>Find User</h3>
      <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div style={{ color: 'salmon' }}>{error}</div>}

      {user ? (
        <span>Login successful!</span>
      ) : (
        !loading && <div>No user found.</div>
      )}
    </div>
  )
}
