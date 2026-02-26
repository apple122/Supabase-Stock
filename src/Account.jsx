import React, { useState, useEffect } from 'react'
import { supabase } from "./supabaseClient";

export default function Account({ session }) {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState(null);
    const [website, setWebsite] = useState(null);
    const [avatar_url, setAvatar] = useState(null);

    useEffect(() => {
        getProfile();
    }, [session])

    async function getProfile() {
        try {
            setLoading(true);
            const user = supabase.auth.user();

            let { data, error, status } = await supabase
                .from('profiles')
                .select(`username, website, avatar_url`)
                .eq('id', user.id)
                .single()

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username);
                setWebsite(data.website);
                setAvatar(data.avatar_url);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="form-widget">
            <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="text" value={session?.user?.email || ''} disabled />
            </div>
            <div>
                <label htmlFor="username">Username</label>
                <input
                    id="username"
                    type="text"
                    value={username || ''}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="website">Website</label>
                <input
                    id="website"
                    type="url"
                    value={website || ''}
                    onChange={(e) => setWebsite(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="avatar">Avatar URL</label>
                <input
                    id="avatar"
                    type="url"
                    value={avatar_url || ''}
                    onChange={(e) => setAvatar(e.target.value)}
                />
            </div>
            <div>
                <button className="button primary block" onClick={() => supabase.auth.signOut()} disabled={loading}>
                    Sign Out
                </button>
            </div> 
        </div> 
    )
}
