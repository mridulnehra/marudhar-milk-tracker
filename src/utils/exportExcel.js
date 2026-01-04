import * as XLSX from 'xlsx'
import { formatDate, formatCurrency } from './formatters'

// Export entries to Excel
export function exportToExcel(entries, filename = 'milk-tracker-data') {
    // Prepare data for Sheet 1: Daily Entries
    const dailyData = entries.map(entry => ({
        'Date': formatDate(entry.date, 'dd-MMM-yyyy'),
        'Starting Milk (L)': entry.starting_milk || entry.startingMilk,
        'Leftover Milk (L)': entry.leftover_milk || entry.leftoverMilk,
        'Distributed Milk (L)': entry.distributed_milk || entry.distributedMilk,
        'Cash (₹)': entry.cash,
        'UPI (₹)': entry.upi,
        'Card (₹)': entry.card,
        'Udhaar Permanent (₹)': entry.udhaar_permanent || entry.udhaarPermanent,
        'Udhaar Temporary (₹)': entry.udhaar_temporary || entry.udhaarTemporary,
        'Others (₹)': entry.others,
        'Total Amount (₹)': entry.total_amount || entry.totalAmount
    }))

    // Add totals row
    if (dailyData.length > 0) {
        const totals = {
            'Date': 'TOTALS',
            'Starting Milk (L)': entries.reduce((sum, e) => sum + Number(e.starting_milk || e.startingMilk || 0), 0),
            'Leftover Milk (L)': entries.reduce((sum, e) => sum + Number(e.leftover_milk || e.leftoverMilk || 0), 0),
            'Distributed Milk (L)': entries.reduce((sum, e) => sum + Number(e.distributed_milk || e.distributedMilk || 0), 0),
            'Cash (₹)': entries.reduce((sum, e) => sum + Number(e.cash || 0), 0),
            'UPI (₹)': entries.reduce((sum, e) => sum + Number(e.upi || 0), 0),
            'Card (₹)': entries.reduce((sum, e) => sum + Number(e.card || 0), 0),
            'Udhaar Permanent (₹)': entries.reduce((sum, e) => sum + Number(e.udhaar_permanent || e.udhaarPermanent || 0), 0),
            'Udhaar Temporary (₹)': entries.reduce((sum, e) => sum + Number(e.udhaar_temporary || e.udhaarTemporary || 0), 0),
            'Others (₹)': entries.reduce((sum, e) => sum + Number(e.others || 0), 0),
            'Total Amount (₹)': entries.reduce((sum, e) => sum + Number(e.total_amount || e.totalAmount || 0), 0)
        }
        dailyData.push(totals)
    }

    // Calculate summary data
    const totalDistributed = entries.reduce((sum, e) => sum + Number(e.distributed_milk || e.distributedMilk || 0), 0)
    const totalRevenue = entries.reduce((sum, e) => sum + Number(e.total_amount || e.totalAmount || 0), 0)
    const avgLeftover = entries.length ? entries.reduce((sum, e) => sum + Number(e.leftover_milk || e.leftoverMilk || 0), 0) / entries.length : 0

    const summaryData = [
        { 'Metric': 'Total Entries', 'Value': entries.length },
        { 'Metric': 'Total Milk Distributed (L)', 'Value': totalDistributed.toFixed(1) },
        { 'Metric': 'Total Revenue (₹)', 'Value': totalRevenue },
        { 'Metric': 'Average Daily Leftover (L)', 'Value': avgLeftover.toFixed(1) }
    ]

    // Payment breakdown
    const paymentData = [
        { 'Payment Method': 'Cash', 'Total (₹)': entries.reduce((sum, e) => sum + Number(e.cash || 0), 0) },
        { 'Payment Method': 'UPI', 'Total (₹)': entries.reduce((sum, e) => sum + Number(e.upi || 0), 0) },
        { 'Payment Method': 'Card', 'Total (₹)': entries.reduce((sum, e) => sum + Number(e.card || 0), 0) },
        { 'Payment Method': 'Udhaar Permanent', 'Total (₹)': entries.reduce((sum, e) => sum + Number(e.udhaar_permanent || e.udhaarPermanent || 0), 0) },
        { 'Payment Method': 'Udhaar Temporary', 'Total (₹)': entries.reduce((sum, e) => sum + Number(e.udhaar_temporary || e.udhaarTemporary || 0), 0) },
        { 'Payment Method': 'Others', 'Total (₹)': entries.reduce((sum, e) => sum + Number(e.others || 0), 0) }
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Add sheets
    const ws1 = XLSX.utils.json_to_sheet(dailyData)
    const ws2 = XLSX.utils.json_to_sheet(summaryData)
    const ws3 = XLSX.utils.json_to_sheet(paymentData)

    // Set column widths
    ws1['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Starting
        { wch: 15 }, // Leftover
        { wch: 18 }, // Distributed
        { wch: 12 }, // Cash
        { wch: 12 }, // UPI
        { wch: 12 }, // Card
        { wch: 18 }, // Udhaar P
        { wch: 18 }, // Udhaar T
        { wch: 12 }, // Others
        { wch: 15 }  // Total
    ]

    XLSX.utils.book_append_sheet(wb, ws1, 'Daily Entries')
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary')
    XLSX.utils.book_append_sheet(wb, ws3, 'Payment Methods')

    // Generate file
    const timestamp = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `${filename}-${timestamp}.xlsx`)
}

// Export data as JSON backup
export function exportToJSON(entries) {
    const data = JSON.stringify(entries, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `milk-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

// Parse JSON backup file
export function parseJSONBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result)
                resolve(data)
            } catch (err) {
                reject(new Error('Invalid JSON file'))
            }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
    })
}
