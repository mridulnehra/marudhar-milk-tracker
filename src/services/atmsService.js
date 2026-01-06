import { supabase } from './supabase'

// Get all ATMs
export async function getAllAtms() {
    const { data, error } = await supabase
        .from('milk_atms')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) throw error
    return data || []
}

// Get ATM by ID
export async function getAtmById(id) {
    const { data, error } = await supabase
        .from('milk_atms')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

// Update ATM
export async function updateAtm(id, atmData) {
    const { data, error } = await supabase
        .from('milk_atms')
        .update({
            name: atmData.name,
            location: atmData.location
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

// Create new ATM
export async function createAtm(atmData) {
    const { data, error } = await supabase
        .from('milk_atms')
        .insert([{
            name: atmData.name,
            location: atmData.location || ''
        }])
        .select()
        .single()

    if (error) throw error
    return data
}

// Deactivate ATM (soft delete)
export async function deactivateAtm(id) {
    const { error } = await supabase
        .from('milk_atms')
        .update({ is_active: false })
        .eq('id', id)

    if (error) throw error
    return true
}
