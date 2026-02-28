import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Auth from '../Auth'
import GET_Users from './users/GET_Users'
import PostUser from './users/PostUser'
import LEFT from './navbar/LEFT'
import Product from './Product/Product'
import Index_CGR from './category/Index.CGR'
import Order from './order/Order'
import POST_Product from './Product/POST_Product'
import Dashboad from './dashboard/Dashboad'

export default function Index() {

    const [session, setSession] = useState(null);
    const [route, setRoute] = useState(() => {
        const nav = localStorage.getItem('Navigate')
        if (nav) {
            try {
                const parsed = JSON.parse(nav)
                return parsed[0] || 'Dashboard'
            } catch (e) {
                return 'Dashboard'
            }
        }
        return 'Dashboard'
    })

    useEffect(() => {
        // Get current session (Supabase v2)
        supabase.auth.getSession()
            .then(({ data: { session } }) => setSession(session))
            .catch(() => { })

        // Subscribe to auth state changes and cleanup on unmount
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        })

        return () => {
            subscription?.unsubscribe?.()
        }
    }, [])

    return (
        <>
            <LEFT current={route} onNavigate={setRoute} />

            <main className="main-content" style={{ paddingRight: 20, paddingLeft: 20, paddingTop: 0, paddingBottom: 20, overflowY: 'auto' }}>
                {route === 'Dashboard' && <Dashboad />}
                {route === 'Category' && <Index_CGR />}
                {route === 'Product' && <Product />}
                {route === 'Order' && <Order />}
                {route === 'users' && <GET_Users />}
                {route === 'create-user' && <PostUser />}
            </main>
        </>
    )
}
