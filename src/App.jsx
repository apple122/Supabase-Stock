import React, { useEffect, useState } from 'react'
import './index.css'
import Auth from './Auth'
import Account from './Account'
import { supabase } from './supabaseClient'
import GET_Users from './component/users/GET_Users'
import PostUser from './component/users/PostUser'

export default function App() {

  const [session, setSession] = useState(null);
  const [route, setRoute] = useState('users')

  useEffect(() => {
    // Get current session (Supabase v2)
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => {})

    // Subscribe to auth state changes and cleanup on unmount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })

    return () => {
      subscription?.unsubscribe?.()
    }
  }, [])

  return (
    <div className="container" style={{ padding: 50 }}>
      {/* {!session ? <Auth /> : <Account key={session?.user?.id} session={session} />} */}
      {/* <CreatePost /> */}
      <nav style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        <button className="button" onClick={() => setRoute('auth')}>Auth</button>
        {/* <button className="button" onClick={() => setRoute('account')}>Account</button> */}
        <button className="button" onClick={() => setRoute('users')}>Users</button>
        <button className="button" onClick={() => setRoute('create-user')}>Create User</button>
      </nav>

      {route === 'auth' && <Auth />}
      {route === 'account' && <Account key={session?.user?.id} session={session} />}
      {route === 'users' && <GET_Users />}
      {route === 'create-user' && <PostUser />}
    </div>
  )
}
