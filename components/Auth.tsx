'use client'

import { supabase } from '../lib/supabase'

export default function Auth() {
    async function signInWithGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        })
    }

    return (
        <div>
            <button onClick={signInWithGoogle}>
                Sign in with Google
            </button>
        </div>
    )
}