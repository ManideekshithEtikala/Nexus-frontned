import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getToken() {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
}

export async function apiFetch(endpoint, options = {}) {
    const token = await getToken()

    if (!token) {
        throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    })

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
    }

    return response.json()
}

export async function sendMessage(sessionId, message) {
    return apiFetch('/api/agent', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message }),
    })
}

export async function resumeAgent(sessionId, toolName, toolArgs, toolCallId, isApproved) {
    return apiFetch('/api/agent/resume', {
        method: 'POST',
        body: JSON.stringify({
            sessionId,
            tool_name: toolName,
            tool_args: toolArgs,
            tool_call_id: toolCallId,
            is_approved: isApproved,
        }),
    })
}