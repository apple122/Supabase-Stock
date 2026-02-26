import React from 'react'
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleLogin = async (email) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            alert("Check your email for the login link!");
        } catch (error) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="row flex-center">
            <div className="col-6 form-widget">
                <h1 className="mainHeader">Supabase + React</h1>
                <p className="text-sm">Sign in below to continue</p>
                <input
                    className="inputField"
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button
                    className="button primary block"
                    onClick={() => handleLogin(email)}
                    disabled={loading}
                >
                    {loading ? "Loading" : "Send login link"}
                </button>
            </div>
        </div>
    )
}

