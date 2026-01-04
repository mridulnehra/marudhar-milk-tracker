import { useState, useEffect } from 'react'
import Button from '../../components/Button'
import { getEntriesByMonth, transformEntry } from '../../services/entriesService'
import { formatCurrency, formatLiters, formatDate, getMonthName } from '../../utils/formatters'
import { calculatePercentage } from '../../utils/calculations'
import { exportToExcel } from '../../utils/exportExcel'
import { getWeek, startOfMonth, endOfMonth } from 'date-fns'

function MonthlyReport() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

    useEffect(() => {
        loadEntries()
    }, [selectedYear, selectedMonth])

    async function loadEntries() {
        try {
            setLoading(true)
            const data = await getEntriesByMonth(selectedYear, selectedMonth)
            setEntries(data.map(transformEntry))
        } catch (err) {
            console.error('Error loading monthly data:', err)
        } finally {
            setLoading(false)
        }
    }

    function handleExport() {
        exportToExcel(entries, `monthly-report-${selectedMonth}-${selectedYear}`)
    }

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))

    // Calculate totals and averages
    const totalDistributed = entries.reduce((sum, e) => sum + e.distributedMilk, 0)
    const totalRevenue = entries.reduce((sum, e) => sum + e.totalAmount, 0)
    const totalLeftover = entries.reduce((sum, e) => sum + e.leftoverMilk, 0)
    const avgDistributed = entries.length ? totalDistributed / entries.length : 0
    const avgLeftover = entries.length ? totalLeftover / entries.length : 0

    // Payment breakdown
    const payments = {
        cash: entries.reduce((sum, e) => sum + e.cash, 0),
        upi: entries.reduce((sum, e) => sum + e.upi, 0),
        card: entries.reduce((sum, e) => sum + e.card, 0),
        udhaarPermanent: entries.reduce((sum, e) => sum + e.udhaarPermanent, 0),
        udhaarTemporary: entries.reduce((sum, e) => sum + e.udhaarTemporary, 0),
        others: entries.reduce((sum, e) => sum + e.others, 0)
    }

    // Group by week
    const weeklyData = entries.reduce((acc, entry) => {
        const weekNum = getWeek(new Date(entry.date), { weekStartsOn: 1 })
        if (!acc[weekNum]) {
            acc[weekNum] = { distributed: 0, revenue: 0, leftover: 0, days: 0 }
        }
        acc[weekNum].distributed += entry.distributedMilk
        acc[weekNum].revenue += entry.totalAmount
        acc[weekNum].leftover += entry.leftoverMilk
        acc[weekNum].days += 1
        return acc
    }, {})

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📊 Monthly Summary</h1>
                    <p className="page-subtitle">{getMonthName(selectedMonth)} {selectedYear}</p>
                </div>
                <Button onClick={handleExport} disabled={entries.length === 0}>
                    📥 Export to Excel
                </Button>
            </header>

            <div className="page-content">
                {/* Month/Year Selector */}
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-body">
                        <div className="date-filter">
                            <div className="date-filter-group">
                                <label>Month:</label>
                                <select
                                    className="form-input"
                                    style={{ width: 'auto' }}
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="date-filter-group">
                                <label>Year:</label>
                                <select
                                    className="form-input"
                                    style={{ width: 'auto' }}
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span className="loading-text">Loading monthly data...</span>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <h3 className="empty-state-title">No Data for This Month</h3>
                            <p className="empty-state-message">No entries found for {getMonthName(selectedMonth)} {selectedYear}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="report-summary">
                            <div className="report-card success">
                                <h3>Total Milk Distributed</h3>
                                <div className="value">{formatLiters(totalDistributed)}</div>
                                <div className="subtext">{entries.length} days recorded</div>
                            </div>
                            <div className="report-card">
                                <h3>Avg Daily Distribution</h3>
                                <div className="value">{formatLiters(avgDistributed)}</div>
                            </div>
                            <div className="report-card warning">
                                <h3>Avg Daily Leftover</h3>
                                <div className="value">{formatLiters(avgLeftover)}</div>
                            </div>
                            <div className="report-card" style={{ borderLeftColor: 'var(--info-500)' }}>
                                <h3>Total Revenue</h3>
                                <div className="value">{formatCurrency(totalRevenue)}</div>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                            <div className="card-header">
                                <h3 className="card-title">💰 Payment Method Breakdown</h3>
                            </div>
                            <div className="card-body">
                                <div className="payment-breakdown">
                                    <div className="payment-item">
                                        <div className="payment-item-icon">💵</div>
                                        <div className="payment-item-details">
                                            <div className="payment-item-label">Cash</div>
                                            <div className="payment-item-value">{formatCurrency(payments.cash)}</div>
                                            <div className="payment-item-percent">{calculatePercentage(payments.cash, totalRevenue)}%</div>
                                        </div>
                                    </div>
                                    <div className="payment-item">
                                        <div className="payment-item-icon">📱</div>
                                        <div className="payment-item-details">
                                            <div className="payment-item-label">UPI</div>
                                            <div className="payment-item-value">{formatCurrency(payments.upi)}</div>
                                            <div className="payment-item-percent">{calculatePercentage(payments.upi, totalRevenue)}%</div>
                                        </div>
                                    </div>
                                    <div className="payment-item">
                                        <div className="payment-item-icon">💳</div>
                                        <div className="payment-item-details">
                                            <div className="payment-item-label">Card</div>
                                            <div className="payment-item-value">{formatCurrency(payments.card)}</div>
                                            <div className="payment-item-percent">{calculatePercentage(payments.card, totalRevenue)}%</div>
                                        </div>
                                    </div>
                                    <div className="payment-item">
                                        <div className="payment-item-icon">📝</div>
                                        <div className="payment-item-details">
                                            <div className="payment-item-label">Udhaar Permanent</div>
                                            <div className="payment-item-value">{formatCurrency(payments.udhaarPermanent)}</div>
                                            <div className="payment-item-percent">{calculatePercentage(payments.udhaarPermanent, totalRevenue)}%</div>
                                        </div>
                                    </div>
                                    <div className="payment-item">
                                        <div className="payment-item-icon">⏳</div>
                                        <div className="payment-item-details">
                                            <div className="payment-item-label">Udhaar Temporary</div>
                                            <div className="payment-item-value">{formatCurrency(payments.udhaarTemporary)}</div>
                                            <div className="payment-item-percent">{calculatePercentage(payments.udhaarTemporary, totalRevenue)}%</div>
                                        </div>
                                    </div>
                                    <div className="payment-item">
                                        <div className="payment-item-icon">📦</div>
                                        <div className="payment-item-details">
                                            <div className="payment-item-label">Others</div>
                                            <div className="payment-item-value">{formatCurrency(payments.others)}</div>
                                            <div className="payment-item-percent">{calculatePercentage(payments.others, totalRevenue)}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Week-wise Breakdown */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">📅 Week-wise Breakdown</h3>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Week</th>
                                                <th>Days Recorded</th>
                                                <th>Milk Distributed (L)</th>
                                                <th>Total Revenue (₹)</th>
                                                <th>Avg Leftover (L)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(weeklyData)
                                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                .map(([weekNum, data]) => (
                                                    <tr key={weekNum}>
                                                        <td style={{ fontWeight: '600' }}>Week {weekNum}</td>
                                                        <td>{data.days}</td>
                                                        <td style={{ color: 'var(--success-600)', fontWeight: '500' }}>
                                                            {data.distributed.toFixed(1)}
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>{formatCurrency(data.revenue)}</td>
                                                        <td style={{ color: 'var(--warning-600)' }}>
                                                            {(data.leftover / data.days).toFixed(1)}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default MonthlyReport
