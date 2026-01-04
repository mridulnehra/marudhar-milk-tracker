import { supabase } from './supabase'
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

// Get entry by date
export async function getEntryByDate(date) {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('date', dateStr)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
    }

    return data
}

// Get all entries
export async function getAllEntries() {
    const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .order('date', { ascending: false })

    if (error) throw error
    return data || []
}

// Get entries by date range
export async function getEntriesByDateRange(fromDate, toDate) {
    const fromStr = typeof fromDate === 'string' ? fromDate : format(fromDate, 'yyyy-MM-dd')
    const toStr = typeof toDate === 'string' ? toDate : format(toDate, 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .gte('date', fromStr)
        .lte('date', toStr)
        .order('date', { ascending: false })

    if (error) throw error
    return data || []
}

// Get entries by month
export async function getEntriesByMonth(year, month) {
    const date = new Date(year, month - 1, 1)
    const fromDate = format(startOfMonth(date), 'yyyy-MM-dd')
    const toDate = format(endOfMonth(date), 'yyyy-MM-dd')

    return getEntriesByDateRange(fromDate, toDate)
}

// Get entries by week
export async function getEntriesByWeek(date) {
    const fromDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const toDate = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')

    return getEntriesByDateRange(fromDate, toDate)
}

// Create new entry
export async function createEntry(entryData) {
    const { data, error } = await supabase
        .from('daily_entries')
        .insert([{
            date: entryData.date,
            starting_milk: entryData.startingMilk,
            leftover_milk: entryData.leftoverMilk,
            distributed_milk: entryData.distributedMilk,
            cash: entryData.cash || 0,
            upi: entryData.upi || 0,
            card: entryData.card || 0,
            udhaar_permanent: entryData.udhaarPermanent || 0,
            udhaar_temporary: entryData.udhaarTemporary || 0,
            others: entryData.others || 0,
            total_amount: entryData.totalAmount
        }])
        .select()
        .single()

    if (error) throw error
    return data
}

// Update existing entry
export async function updateEntry(id, entryData) {
    const { data, error } = await supabase
        .from('daily_entries')
        .update({
            starting_milk: entryData.startingMilk,
            leftover_milk: entryData.leftoverMilk,
            distributed_milk: entryData.distributedMilk,
            cash: entryData.cash || 0,
            upi: entryData.upi || 0,
            card: entryData.card || 0,
            udhaar_permanent: entryData.udhaarPermanent || 0,
            udhaar_temporary: entryData.udhaarTemporary || 0,
            others: entryData.others || 0,
            total_amount: entryData.totalAmount,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

// Delete entry
export async function deleteEntry(id) {
    const { error } = await supabase
        .from('daily_entries')
        .delete()
        .eq('id', id)

    if (error) throw error
    return true
}

// Get today's entry
export async function getTodayEntry() {
    const today = format(new Date(), 'yyyy-MM-dd')
    return getEntryByDate(today)
}

// Get this month's summary
export async function getMonthSummary(year, month) {
    const entries = await getEntriesByMonth(year, month)

    if (entries.length === 0) {
        return {
            totalDistributed: 0,
            totalRevenue: 0,
            totalLeftover: 0,
            avgDistributed: 0,
            avgLeftover: 0,
            daysCount: 0,
            entries: []
        }
    }

    const totalDistributed = entries.reduce((sum, e) => sum + Number(e.distributed_milk), 0)
    const totalRevenue = entries.reduce((sum, e) => sum + Number(e.total_amount), 0)
    const totalLeftover = entries.reduce((sum, e) => sum + Number(e.leftover_milk), 0)

    return {
        totalDistributed,
        totalRevenue,
        totalLeftover,
        avgDistributed: totalDistributed / entries.length,
        avgLeftover: totalLeftover / entries.length,
        daysCount: entries.length,
        entries
    }
}

// Transform database entry to frontend format
export function transformEntry(dbEntry) {
    if (!dbEntry) return null

    return {
        id: dbEntry.id,
        date: dbEntry.date,
        startingMilk: Number(dbEntry.starting_milk),
        leftoverMilk: Number(dbEntry.leftover_milk),
        distributedMilk: Number(dbEntry.distributed_milk),
        cash: Number(dbEntry.cash),
        upi: Number(dbEntry.upi),
        card: Number(dbEntry.card),
        udhaarPermanent: Number(dbEntry.udhaar_permanent),
        udhaarTemporary: Number(dbEntry.udhaar_temporary),
        others: Number(dbEntry.others),
        totalAmount: Number(dbEntry.total_amount),
        createdAt: dbEntry.created_at,
        updatedAt: dbEntry.updated_at
    }
}
