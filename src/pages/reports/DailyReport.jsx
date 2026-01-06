import { useState, useEffect } from 'react'
import Button from '../../components/Button'
import { getEntriesByDateRange, transformEntry } from '../../services/entriesService'
import { formatCurrency, formatLiters, formatDate, formatDateForInput } from '../../utils/formatters'
import { exportToExcel } from '../../utils/exportExcel'
import { subDays } from 'date-fns'

function DailyReport() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [fromDate, setFromDate] = useState(formatDateForInput(subDays(new Date(), 7)))
    const [toDate, setToDate] = useState(formatDateForInput(new Date()))

    useEffect(() => {
        loadEntries()
    }, [fromDate, toDate])

    async function loadEntries() {
        try {
            setLoading(true)
            setEntries([]) // Clear entries immediately to avoid showing stale data
            const data = await getEntriesByDateRange(fromDate, toDate)
            setEntries(data)
        } catch (err) {
            console.error('Error loading entries:', err)
        } finally {
            setLoading(false)
        }
    }

    function handleExport() {
        exportToExcel(entries, 'daily-report')
    }

    // Calculate totals
    const totals = entries.reduce((acc, e) => ({
        startingMilk: acc.startingMilk + Number(e.starting_milk || 0),
        leftoverMilk: acc.leftoverMilk + Number(e.leftover_milk || 0),
        distributedMilk: acc.distributedMilk + Number(e.distributed_milk || 0),
        cash: acc.cash + Number(e.cash || 0),
        upi: acc.upi + Number(e.upi || 0),
        card: acc.card + Number(e.card || 0),
        udhaarPermanent: acc.udhaarPermanent + Number(e.udhaar_permanent || 0),
        udhaarTemporary: acc.udhaarTemporary + Number(e.udhaar_temporary || 0),
        others: acc.others + Number(e.others || 0),
        totalAmount: acc.totalAmount + Number(e.total_amount || 0)
    }), {
        startingMilk: 0, leftoverMilk: 0, distributedMilk: 0,
        cash: 0, upi: 0, card: 0, udhaarPermanent: 0, udhaarTemporary: 0, others: 0, totalAmount: 0
    })

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📋 Daily View Report</h1>
                    <p className="page-subtitle">Detailed day-by-day breakdown</p>
                </div>
                <Button onClick={handleExport} disabled={entries.length === 0}>
                    📥 Export to Excel
                </Button>
            </header>

            <div className="page-content">
                {/* Date Range Filter */}
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-body">
                        <div className="date-filter">
                            <div className="date-filter-group">
                                <label>From:</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    style={{ width: 'auto' }}
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    max={toDate}
                                />
                            </div>
                            <div className="date-filter-group">
                                <label>To:</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    style={{ width: 'auto' }}
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    min={fromDate}
                                    max={formatDateForInput(new Date())}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{entries.length} entries</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                <span className="loading-text">Loading report...</span>
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3 className="empty-state-title">No Entries Found</h3>
                                <p className="empty-state-message">No data for the selected date range</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Starting (L)</th>
                                            <th>Leftover (L)</th>
                                            <th>Distributed (L)</th>
                                            <th>Cash</th>
                                            <th>UPI</th>
                                            <th>Card</th>
                                            <th>Udhaar P</th>
                                            <th>Udhaar T</th>
                                            <th>Others</th>
                                            <th>Total (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map(entry => (
                                            <tr key={entry.id}>
                                                <td style={{ fontWeight: '600' }}>{formatDate(entry.date, 'dd-MMM')}</td>
                                                <td>{Number(entry.starting_milk).toFixed(1)}</td>
                                                <td>{Number(entry.leftover_milk).toFixed(1)}</td>
                                                <td style={{ color: 'var(--success-600)', fontWeight: '500' }}>
                                                    {Number(entry.distributed_milk).toFixed(1)}
                                                </td>
                                                <td>{formatCurrency(entry.cash)}</td>
                                                <td>{formatCurrency(entry.upi)}</td>
                                                <td>{formatCurrency(entry.card)}</td>
                                                <td>{formatCurrency(entry.udhaar_permanent)}</td>
                                                <td>{formatCurrency(entry.udhaar_temporary)}</td>
                                                <td>{formatCurrency(entry.others)}</td>
                                                <td style={{ fontWeight: '600' }}>{formatCurrency(entry.total_amount)}</td>
                                            </tr>
                                        ))}
                                        {/* Totals Row */}
                                        <tr style={{ background: 'var(--gray-100)', fontWeight: '700' }}>
                                            <td>TOTALS</td>
                                            <td>{totals.startingMilk.toFixed(1)}</td>
                                            <td>{totals.leftoverMilk.toFixed(1)}</td>
                                            <td style={{ color: 'var(--success-600)' }}>{totals.distributedMilk.toFixed(1)}</td>
                                            <td>{formatCurrency(totals.cash)}</td>
                                            <td>{formatCurrency(totals.upi)}</td>
                                            <td>{formatCurrency(totals.card)}</td>
                                            <td>{formatCurrency(totals.udhaarPermanent)}</td>
                                            <td>{formatCurrency(totals.udhaarTemporary)}</td>
                                            <td>{formatCurrency(totals.others)}</td>
                                            <td style={{ color: 'var(--primary-600)' }}>{formatCurrency(totals.totalAmount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default DailyReport
