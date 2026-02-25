import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function PostUser() {
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tel, setTel] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{ fullname, email, password, tel }])
        .select()

      if (error) throw error
      setMessage('User created successfully')
      setFullname('')
      setEmail('')
      setTel('')
    } catch (err) {
      console.error('Insert failed:', err)
      setMessage(err.message || 'Insert failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Create User</h3>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Fullname</label>
          <input
            type="text"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Phone</label>
          <input
            type="number"
            value={tel}
            maxLength={10}
            onChange={(e) => setTel(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            placeholder="Tel Number"
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Create'}
          </button>
        </div>

        {message && <div style={{ marginTop: 8 }}>{message}</div>}
      </form>
    </div>
  )
}
