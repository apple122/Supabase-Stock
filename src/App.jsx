import React, { useState, useEffect } from 'react'
import Index from './component/Index'
import Login from './component/Login'
import Test from './component/test'

export default function App() {
  const [user, setUser] = useState(null)

  // restore user from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) setUser(JSON.parse(raw))
    } catch (err) {
      console.warn('Failed to parse stored user', err)
    }
  }, [])

  // persist user to localStorage when it changes
  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', 'true')
      else localStorage.removeItem('user')
    } catch (err) {
      console.warn('Failed to persist user', err)
    }
  }, [user])

  return (
    <div className="app-layout">
      {/* <Test /> */}
      {user && 'true' ? <Index /> : <Login onUser={setUser} />}
    </div>
  )
}
