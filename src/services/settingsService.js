import { supabase } from './supabase'

// Get a setting by key
export async function getSetting(key) {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single()

    if (error && error.code !== 'PGRST116') {
        throw error
    }

    return data?.value || null
}

// Update or insert a setting
export async function updateSetting(key, value) {
    const { data, error } = await supabase
        .from('settings')
        .upsert({
            key,
            value: String(value),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
        .select()
        .single()

    if (error) throw error
    return data
}

// Get milk rate setting
export async function getMilkRate() {
    const rate = await getSetting('milk_rate')
    return parseFloat(rate) || 0
}

// Update milk rate setting
export async function updateMilkRate(rate) {
    return updateSetting('milk_rate', rate)
}

// Get all settings
export async function getAllSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')

    if (error) throw error
    return data || []
}
