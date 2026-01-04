// Calculate distributed milk
export function calculateDistributed(starting, leftover) {
    const start = parseFloat(starting) || 0
    const left = parseFloat(leftover) || 0
    return Math.max(0, start - left)
}

// Calculate total amount from payments
export function calculateTotal(payments) {
    const { cash, upi, card, udhaarPermanent, udhaarTemporary, others } = payments
    return (
        (parseFloat(cash) || 0) +
        (parseFloat(upi) || 0) +
        (parseFloat(card) || 0) +
        (parseFloat(udhaarPermanent) || 0) +
        (parseFloat(udhaarTemporary) || 0) +
        (parseFloat(others) || 0)
    )
}

// Validate entry data
export function validateEntry(data) {
    const errors = {}

    // Milk validation
    if (data.startingMilk === '' || data.startingMilk === undefined) {
        errors.startingMilk = 'Starting milk quantity is required'
    } else if (parseFloat(data.startingMilk) < 0) {
        errors.startingMilk = 'Starting milk cannot be negative'
    }

    if (data.leftoverMilk === '' || data.leftoverMilk === undefined) {
        errors.leftoverMilk = 'Leftover milk quantity is required'
    } else if (parseFloat(data.leftoverMilk) < 0) {
        errors.leftoverMilk = 'Leftover milk cannot be negative'
    } else if (parseFloat(data.leftoverMilk) > parseFloat(data.startingMilk)) {
        errors.leftoverMilk = 'Leftover cannot be more than starting milk'
    }

    // Payment validation (allow 0, just check for negative)
    const paymentFields = ['cash', 'upi', 'card', 'udhaarPermanent', 'udhaarTemporary', 'others']
    paymentFields.forEach(field => {
        const value = parseFloat(data[field])
        if (value < 0) {
            errors[field] = 'Amount cannot be negative'
        }
    })

    // Date validation
    if (!data.date) {
        errors.date = 'Date is required'
    } else {
        const selectedDate = new Date(data.date)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        if (selectedDate > today) {
            errors.date = 'Date cannot be in the future'
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    }
}

// Calculate percentage
export function calculatePercentage(value, total) {
    if (!total || total === 0) return 0
    return ((value / total) * 100).toFixed(1)
}

// Calculate average
export function calculateAverage(values) {
    if (!values || values.length === 0) return 0
    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
}

// Sum array of numbers
export function sumValues(values) {
    if (!values || values.length === 0) return 0
    return values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
}
