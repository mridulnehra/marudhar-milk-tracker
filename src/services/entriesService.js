import { supabase } from './supabase'
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

// Get entry by date, ATM, and shift
export async function getEntryByDateAtmAndShift(date, atmId, shift = 'morning') {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('date', dateStr)
        .eq('atm_id', atmId)
        .eq('shift', shift)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
    }

    return data
}

// Get entry by date and ATM (legacy - returns first match)
export async function getEntryByDateAndAtm(date, atmId) {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('date', dateStr)
        .eq('atm_id', atmId)
        .order('shift', { ascending: true })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        throw error
    }

    return data
}

// Get entry by date (legacy - for backward compatibility)
export async function getEntryByDate(date) {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('date', dateStr)
        .single()

    if (error && error.code !== 'PGRST116') {
        throw error
    }

    return data
}

// Get all entries
export async function getAllEntries() {
    const { data, error } = await supabase
        .from('daily_entries')
        .select('*, milk_atms(name, location)')
        .order('date', { ascending: false })

    if (error) throw error
    return data || []
}

// Get entries by ATM
export async function getEntriesByAtm(atmId) {
    const { data, error } = await supabase
        .from('daily_entries')
        .select('*, milk_atms(name, location)')
        .eq('atm_id', atmId)
        .order('date', { ascending: false })

    if (error) throw error
    return data || []
}

// Get entries by date range
export async function getEntriesByDateRange(fromDate, toDate, atmId = null) {
    const fromStr = typeof fromDate === 'string' ? fromDate : format(fromDate, 'yyyy-MM-dd')
    const toStr = typeof toDate === 'string' ? toDate : format(toDate, 'yyyy-MM-dd')

    let query = supabase
        .from('daily_entries')
        .select('*, milk_atms(name, location)')
        .gte('date', fromStr)
        .lte('date', toStr)
        .order('date', { ascending: false })

    if (atmId) {
        query = query.eq('atm_id', atmId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
}

// Get entries by month
export async function getEntriesByMonth(year, month, atmId = null) {
    const date = new Date(year, month - 1, 1)
    const fromDate = format(startOfMonth(date), 'yyyy-MM-dd')
    const toDate = format(endOfMonth(date), 'yyyy-MM-dd')

    return getEntriesByDateRange(fromDate, toDate, atmId)
}

// Get entries by week
export async function getEntriesByWeek(date, atmId = null) {
    const fromDate = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const toDate = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')

    return getEntriesByDateRange(fromDate, toDate, atmId)
}

// Create new entry
export async function createEntry(entryData) {
    const { data, error } = await supabase
        .from('daily_entries')
        .insert([{
            date: entryData.date,
            atm_id: entryData.atmId,
            shift: entryData.shift || 'morning',
            starting_milk: entryData.totalMilk || entryData.startingMilk,
            leftover_milk: entryData.leftoverMilk,
            distributed_milk: entryData.distributedMilk,
            returned_milk: entryData.returnMilk || 0,
            cash: entryData.cash || 0,
            cash_liters: entryData.cashLiters || 0,
            upi: entryData.upi || 0,
            upi_liters: entryData.upiLiters || 0,
            card: entryData.card || 0,
            card_liters: entryData.cardLiters || 0,
            udhaar_permanent: entryData.udhaarPermanent || 0,
            udhaar_permanent_liters: entryData.udhaarPermanentLiters || 0,
            udhaar_temporary: entryData.udhaarTemporary || 0,
            udhaar_temporary_liters: entryData.udhaarTemporaryLiters || 0,
            others: entryData.others || 0,
            others_liters: entryData.othersLiters || 0,
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
            starting_milk: entryData.totalMilk || entryData.startingMilk,
            leftover_milk: entryData.leftoverMilk,
            distributed_milk: entryData.distributedMilk,
            returned_milk: entryData.returnMilk || 0,
            cash: entryData.cash || 0,
            cash_liters: entryData.cashLiters || 0,
            upi: entryData.upi || 0,
            upi_liters: entryData.upiLiters || 0,
            card: entryData.card || 0,
            card_liters: entryData.cardLiters || 0,
            udhaar_permanent: entryData.udhaarPermanent || 0,
            udhaar_permanent_liters: entryData.udhaarPermanentLiters || 0,
            udhaar_temporary: entryData.udhaarTemporary || 0,
            udhaar_temporary_liters: entryData.udhaarTemporaryLiters || 0,
            others: entryData.others || 0,
            others_liters: entryData.othersLiters || 0,
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

// Get today's entry for a specific ATM
export async function getTodayEntryByAtm(atmId) {
    const today = format(new Date(), 'yyyy-MM-dd')
    return getEntryByDateAndAtm(today, atmId)
}

// Get all today's entries (for all ATMs)
export async function getTodayEntriesAllAtms() {
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('daily_entries')
        .select('*, milk_atms(name, location)')
        .eq('date', today)
        .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
}

// Get today's entry (legacy - single entry)
export async function getTodayEntry() {
    const today = format(new Date(), 'yyyy-MM-dd')
    return getEntryByDate(today)
}

// Get this month's summary (optionally filtered by ATM)
export async function getMonthSummary(year, month, atmId = null) {
    const entries = await getEntriesByMonth(year, month, atmId)

    if (entries.length === 0) {
        return {
            totalDistributed: 0,
            totalRevenue: 0,
            totalLeftover: 0,
            avgDistributed: 0,
            avgLeftover: 0,
            daysCount: 0,
            entries: [],
            // Payment method breakdowns
            totalCash: 0,
            totalCashLiters: 0,
            totalUpi: 0,
            totalUpiLiters: 0,
            totalCard: 0,
            totalCardLiters: 0,
            totalUdhaarPermanent: 0,
            totalUdhaarPermanentLiters: 0,
            totalUdhaarTemporary: 0,
            totalUdhaarTemporaryLiters: 0,
            totalOthers: 0,
            totalOthersLiters: 0
        }
    }

    const totalDistributed = entries.reduce((sum, e) => sum + Number(e.distributed_milk || 0), 0)
    const totalRevenue = entries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
    const totalLeftover = entries.reduce((sum, e) => sum + Number(e.leftover_milk || 0), 0)

    // Payment method totals
    const totalCash = entries.reduce((sum, e) => sum + Number(e.cash || 0), 0)
    const totalCashLiters = entries.reduce((sum, e) => sum + Number(e.cash_liters || 0), 0)
    const totalUpi = entries.reduce((sum, e) => sum + Number(e.upi || 0), 0)
    const totalUpiLiters = entries.reduce((sum, e) => sum + Number(e.upi_liters || 0), 0)
    const totalCard = entries.reduce((sum, e) => sum + Number(e.card || 0), 0)
    const totalCardLiters = entries.reduce((sum, e) => sum + Number(e.card_liters || 0), 0)
    const totalUdhaarPermanent = entries.reduce((sum, e) => sum + Number(e.udhaar_permanent || 0), 0)
    const totalUdhaarPermanentLiters = entries.reduce((sum, e) => sum + Number(e.udhaar_permanent_liters || 0), 0)
    const totalUdhaarTemporary = entries.reduce((sum, e) => sum + Number(e.udhaar_temporary || 0), 0)
    const totalUdhaarTemporaryLiters = entries.reduce((sum, e) => sum + Number(e.udhaar_temporary_liters || 0), 0)
    const totalOthers = entries.reduce((sum, e) => sum + Number(e.others || 0), 0)
    const totalOthersLiters = entries.reduce((sum, e) => sum + Number(e.others_liters || 0), 0)

    return {
        totalDistributed,
        totalRevenue,
        totalLeftover,
        avgDistributed: totalDistributed / entries.length,
        avgLeftover: totalLeftover / entries.length,
        daysCount: entries.length,
        entries,
        totalCash,
        totalCashLiters,
        totalUpi,
        totalUpiLiters,
        totalCard,
        totalCardLiters,
        totalUdhaarPermanent,
        totalUdhaarPermanentLiters,
        totalUdhaarTemporary,
        totalUdhaarTemporaryLiters,
        totalOthers,
        totalOthersLiters
    }
}

// Transform database entry to frontend format
export function transformEntry(dbEntry) {
    if (!dbEntry) return null

    return {
        id: dbEntry.id,
        date: dbEntry.date,
        atmId: dbEntry.atm_id,
        shift: dbEntry.shift || 'morning',
        atmName: dbEntry.milk_atms?.name || 'Unknown ATM',
        atmLocation: dbEntry.milk_atms?.location || '',
        totalMilk: Number(dbEntry.starting_milk),
        startingMilk: Number(dbEntry.starting_milk), // legacy alias
        leftoverMilk: Number(dbEntry.leftover_milk),
        distributedMilk: Number(dbEntry.distributed_milk),
        returnMilk: Number(dbEntry.returned_milk || 0),
        cash: Number(dbEntry.cash || 0),
        cashLiters: Number(dbEntry.cash_liters || 0),
        upi: Number(dbEntry.upi || 0),
        upiLiters: Number(dbEntry.upi_liters || 0),
        card: Number(dbEntry.card || 0),
        cardLiters: Number(dbEntry.card_liters || 0),
        udhaarPermanent: Number(dbEntry.udhaar_permanent || 0),
        udhaarPermanentLiters: Number(dbEntry.udhaar_permanent_liters || 0),
        udhaarTemporary: Number(dbEntry.udhaar_temporary || 0),
        udhaarTemporaryLiters: Number(dbEntry.udhaar_temporary_liters || 0),
        others: Number(dbEntry.others || 0),
        othersLiters: Number(dbEntry.others_liters || 0),
        totalAmount: Number(dbEntry.total_amount),
        createdAt: dbEntry.created_at,
        updatedAt: dbEntry.updated_at
    }
}

// Get combined summary for all ATMs on a specific date
export async function getDaySummaryAllAtms(date) {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')

    const { data: entries, error } = await supabase
        .from('daily_entries')
        .select('*, milk_atms(name, location)')
        .eq('date', dateStr)

    if (error) throw error

    if (!entries || entries.length === 0) {
        return null
    }

    const totalDistributed = entries.reduce((sum, e) => sum + Number(e.distributed_milk || 0), 0)
    const totalRevenue = entries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
    const totalLeftover = entries.reduce((sum, e) => sum + Number(e.leftover_milk || 0), 0)
    const totalMilk = entries.reduce((sum, e) => sum + Number(e.starting_milk || 0), 0)

    return {
        date: dateStr,
        totalMilk,
        totalDistributed,
        totalRevenue,
        totalLeftover,
        atmCount: entries.length,
        entries: entries.map(transformEntry)
    }
}
