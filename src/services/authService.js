import { supabase } from './supabase'

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}

// Check if auth setup is complete
export async function checkAuthSetup() {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'is_auth_setup')
        .single()

    if (error && error.code !== 'PGRST116') {
        throw error
    }

    return data?.value === 'true'
}

// Setup authentication (first-time setup)
export async function setupAuth(password, securityQuestion, securityAnswer) {
    const passwordHash = await hashPassword(password)
    const answerHash = await hashPassword(securityAnswer.toLowerCase().trim())

    // Upsert all auth settings
    const settings = [
        { key: 'app_password_hash', value: passwordHash },
        { key: 'security_question', value: securityQuestion },
        { key: 'security_answer_hash', value: answerHash },
        { key: 'is_auth_setup', value: 'true' }
    ]

    for (const setting of settings) {
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: setting.key,
                value: setting.value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' })

        if (error) throw error
    }

    // Generate and store a session token
    const sessionToken = crypto.randomUUID()
    localStorage.setItem('auth_session', sessionToken)

    return true
}

// Verify password for login
export async function verifyPassword(password) {
    const passwordHash = await hashPassword(password)

    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'app_password_hash')
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return false // No password set
        }
        throw error
    }

    return data.value === passwordHash
}

// Get security question for password recovery
export async function getSecurityQuestion() {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'security_question')
        .single()

    if (error && error.code !== 'PGRST116') {
        throw error
    }

    return data?.value || null
}

// Verify security answer for password recovery
export async function verifySecurityAnswer(answer) {
    const answerHash = await hashPassword(answer.toLowerCase().trim())

    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'security_answer_hash')
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return false
        }
        throw error
    }

    return data.value === answerHash
}

// Reset password (after verifying security answer)
export async function resetPassword(newPassword) {
    const passwordHash = await hashPassword(newPassword)

    const { error } = await supabase
        .from('settings')
        .upsert({
            key: 'app_password_hash',
            value: passwordHash,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

    if (error) throw error

    // Generate new session token
    const sessionToken = crypto.randomUUID()
    localStorage.setItem('auth_session', sessionToken)

    return true
}

// Login with remember me option
export async function login(password, rememberMe = false) {
    const isValid = await verifyPassword(password)

    if (!isValid) {
        return false
    }

    // Generate session token
    const sessionToken = crypto.randomUUID()

    if (rememberMe) {
        localStorage.setItem('auth_session', sessionToken)
        localStorage.setItem('remember_me', 'true')
    } else {
        sessionStorage.setItem('auth_session', sessionToken)
        localStorage.removeItem('auth_session')
        localStorage.removeItem('remember_me')
    }

    return true
}

// Check if user is logged in (has valid session)
export function isLoggedIn() {
    const localSession = localStorage.getItem('auth_session')
    const sessionSession = sessionStorage.getItem('auth_session')
    return !!(localSession || sessionSession)
}

// Logout
export function logout() {
    localStorage.removeItem('auth_session')
    localStorage.removeItem('remember_me')
    sessionStorage.removeItem('auth_session')
}

// Security questions list
export const SECURITY_QUESTIONS = [
    'What is your pet\'s name?',
    'What is your birth city?',
    'What is your favorite color?',
    'What is your mother\'s name?',
    'What was your first vehicle?',
    'What is your favorite food?',
    'What is your best friend\'s name?'
]
