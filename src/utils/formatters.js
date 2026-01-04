import { format, parseISO } from 'date-fns'

// Format currency (Indian Rupees)
export function formatCurrency(amount) {
    const num = parseFloat(amount) || 0
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num)
}

// Format number with Indian notation
export function formatNumber(num) {
    const n = parseFloat(num) || 0
    return new Intl.NumberFormat('en-IN').format(n)
}

// Format liters
export function formatLiters(liters) {
    const num = parseFloat(liters) || 0
    return `${formatNumber(num.toFixed(1))} L`
}

// Format date for display
export function formatDate(date, formatStr = 'dd MMM yyyy') {
    if (!date) return ''
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, formatStr)
}

// Format date for input
export function formatDateForInput(date) {
    if (!date) return ''
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'yyyy-MM-dd')
}

// Format datetime
export function formatDateTime(date) {
    if (!date) return ''
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd MMM yyyy, hh:mm a')
}

// Format month year
export function formatMonthYear(date) {
    if (!date) return ''
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'MMMM yyyy')
}

// Get month name
export function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month - 1] || ''
}

// Format percentage
export function formatPercentage(value) {
    const num = parseFloat(value) || 0
    return `${num.toFixed(1)}%`
}
