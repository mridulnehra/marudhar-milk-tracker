import { useState, useEffect } from 'react'
import Button from '../../components/Button'
import { getEntriesByMonth, transformEntry } from '../../services/entriesService'
import { getAllAtms } from '../../services/atmsService'
import { formatCurrency, formatLiters, formatDate, getMonthName } from '../../utils/formatters'
import { calculatePercentage } from '../../utils/calculations'
import { exportToExcel } from '../../utils/exportExcel'
import { getWeek, startOfMonth, endOfMonth } from 'date-fns'

function MonthlyReport() {
    const [entries, setEntries] = useState([])
    const [atms, setAtms] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedAtm, setSelectedAtm] = useState('all')

    useEffect(() => {
        loadAtms()
    }, [])

    useEffect(() => {
        loadEntries()
    }, [selectedYear, selectedMonth, selectedAtm])

    async function loadAtms() {
        try {
            const atmsData = await getAllAtms()
            setAtms(atmsData)
        } catch (err) {
            console.error('Error loading ATMs:', err)
        }
    }

    async function loadEntries() {
        try {
            setLoading(true)
            setEntries([]) // Clear entries immediately to avoid showing stale data
            const atmId = selectedAtm === 'all' ? null : selectedAtm
            const data = await getEntriesByMonth(selectedYear, selectedMonth, atmId)
            setEntries(data.map(transformEntry))
        } catch (err) {
            console.error('Error loading monthly data:', err)
        } finally {
            setLoading(false)
        }
    }

    function handleExport() {
        const filename = selectedAtm !== 'all'
            ? `${atms.find(a => a.id === selectedAtm)?.name}-monthly-${selectedMonth}-${selectedYear}`
            : `all-atms-monthly-${selectedMonth}-${selectedYear}`
        exportToExcel(entries, filename)
    }

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))

    // Calculate totals and averages
    const totalMilk = entries.reduce((sum, e) => sum + (e.totalMilk || 0), 0)
    const totalDistributed = entries.reduce((sum, e) => sum + e.distributedMilk, 0)
    const totalRevenue = entries.reduce((sum, e) => sum + e.totalAmount, 0)
    const totalLeftover = entries.reduce((sum, e) => sum + e.leftoverMilk, 0)
    const avgDistributed = entries.length ? totalDistributed / entries.length : 0
    const avgLeftover = entries.length ? totalLeftover / entries.length : 0

    // Calculate estimated value of leftover milk
    const avgRate = totalDistributed > 0 ? totalRevenue / totalDistributed : 0
    const avgLeftoverValue = avgLeftover * avgRate

    // Payment breakdown with liters
    const payments = {
        cash: { liters: entries.reduce((sum, e) => sum + (e.cashLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.cash, 0) },
        upi: { liters: entries.reduce((sum, e) => sum + (e.upiLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.upi, 0) },
        card: { liters: entries.reduce((sum, e) => sum + (e.cardLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.card, 0) },
        udhaarPermanent: { liters: entries.reduce((sum, e) => sum + (e.udhaarPermanentLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.udhaarPermanent, 0) },
        udhaarTemporary: { liters: entries.reduce((sum, e) => sum + (e.udhaarTemporaryLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.udhaarTemporary, 0) },
        others: { liters: entries.reduce((sum, e) => sum + (e.othersLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.others, 0) }
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

    // Group by ATM (only when viewing all ATMs)
    const atmData = selectedAtm === 'all' ? entries.reduce((acc, entry) => {
        const atmId = entry.atmId || 'unknown'
        if (!acc[atmId]) {
            acc[atmId] = {
                name: entry.atmName || 'Unknown ATM',
                distributed: 0,
                revenue: 0,
                leftover: 0,
                entries: 0
            }
        }
        acc[atmId].distributed += entry.distributedMilk
        acc[atmId].revenue += entry.totalAmount
        acc[atmId].leftover += entry.leftoverMilk
        acc[atmId].entries += 1
        return acc
    }, {}) : null

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📊 Monthly Summary</h1>
                    <p className="page-subtitle">
                        {selectedAtm !== 'all' && atms.find(a => a.id === selectedAtm)?.name + ' — '}
                        {getMonthName(selectedMonth)} {selectedYear}
                    </p>
                </div>
                <Button onClick={handleExport} disabled={entries.length === 0}>
                    📥 Export to Excel
                </Button>
            </header>

            <div className="page-content">
                {/* Filters */}
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-body">
                        <div className="date-filter">
                            <div className="date-filter-group">
                                <label>ATM:</label>
                                <select
                                    className="form-input"
                                    style={{ width: 'auto', minWidth: '150px' }}
                                    value={selectedAtm}
                                    onChange={(e) => setSelectedAtm(e.target.value)}
                                >
                                    <option value="all">All ATMs</option>
                                    {atms.map(atm => (
                                        <option key={atm.id} value={atm.id}>{atm.name}</option>
                                    ))}
                                </select>
                            </div>
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
                            <p className="empty-state-message">
                                No entries found for {selectedAtm !== 'all' ? atms.find(a => a.id === selectedAtm)?.name + ' in ' : ''}{getMonthName(selectedMonth)} {selectedYear}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="report-summary">
                            <div className="report-card success">
                                <h3>Total Milk Distributed</h3>
                                <div className="value">{formatLiters(totalDistributed)}</div>
                                <div className="subtext">{entries.length} entries recorded</div>
                            </div>
                            <div className="report-card">
                                <h3>Avg Daily Distribution</h3>
                                <div className="value">{formatLiters(avgDistributed)}</div>
                            </div>
                            <div className="report-card warning">
                                <h3>Avg Daily Leftover</h3>
                                <div className="value">
                                    {formatLiters(avgLeftover)}
                                    {avgLeftoverValue > 0 && (
                                        <div style={{ fontSize: '0.6em', opacity: 0.9, marginTop: '2px', fontWeight: '600' }}>
                                            {formatCurrency(avgLeftoverValue)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="report-card" style={{ borderLeftColor: 'var(--info-500)' }}>
                                <h3>Total Revenue</h3>
                                <div className="value">{formatCurrency(totalRevenue)}</div>
                            </div>
                        </div>

                        {/* ATM-wise Breakdown (only when viewing all ATMs) */}
                        {atmData && Object.keys(atmData).length > 1 && (
                            <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                                <div className="card-header">
                                    <h3 className="card-title">🏧 ATM-wise Breakdown</h3>
                                </div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>ATM</th>
                                                    <th>Entries</th>
                                                    <th>Distributed (L)</th>
                                                    <th>Leftover (L)</th>
                                                    <th>Revenue (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(atmData).map(([atmId, data]) => (
                                                    <tr key={atmId}>
                                                        <td style={{ fontWeight: '600' }}>🏧 {data.name}</td>
                                                        <td>{data.entries}</td>
                                                        <td style={{ color: 'var(--success-600)', fontWeight: '500' }}>
                                                            {data.distributed.toFixed(1)}
                                                        </td>
                                                        <td style={{ color: 'var(--warning-600)' }}>
                                                            {data.leftover.toFixed(1)}
                                                        </td>
                                                        <td style={{ fontWeight: '600' }}>{formatCurrency(data.revenue)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Breakdown with Liters */}
                        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                            <div className="card-header">
                                <h3 className="card-title">💰 Payment Method Breakdown (Liters / Amount)</h3>
                            </div>
                            <div className="card-body">
                                <div className="payment-breakdown">
                                    <PaymentMethodCard
                                        icon="💵"
                                        label="Cash"
                                        liters={payments.cash.liters}
                                        amount={payments.cash.amount}
                                        total={totalRevenue}
                                    />
                                    <PaymentMethodCard
                                        icon="📱"
                                        label="UPI"
                                        liters={payments.upi.liters}
                                        amount={payments.upi.amount}
                                        total={totalRevenue}
                                    />
                                    <PaymentMethodCard
                                        icon="💳"
                                        label="Card"
                                        liters={payments.card.liters}
                                        amount={payments.card.amount}
                                        total={totalRevenue}
                                    />
                                    <PaymentMethodCard
                                        icon="📒"
                                        label="Udhaar Permanent"
                                        liters={payments.udhaarPermanent.liters}
                                        amount={payments.udhaarPermanent.amount}
                                        total={totalRevenue}
                                    />
                                    <PaymentMethodCard
                                        icon="📝"
                                        label="Udhaar Temporary"
                                        liters={payments.udhaarTemporary.liters}
                                        amount={payments.udhaarTemporary.amount}
                                        total={totalRevenue}
                                    />
                                    <PaymentMethodCard
                                        icon="📦"
                                        label="Others"
                                        liters={payments.others.liters}
                                        amount={payments.others.amount}
                                        total={totalRevenue}
                                    />
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
                                                <th>Entries</th>
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

// Helper component for payment method display
function PaymentMethodCard({ icon, label, liters, amount, total }) {
    return (
        <div className="payment-item">
            <div className="payment-item-icon">{icon}</div>
            <div className="payment-item-details">
                <div className="payment-item-label">{label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-2)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                        {formatLiters(liters)}
                    </span>
                    <span className="payment-item-value">{formatCurrency(amount)}</span>
                </div>
                <div className="payment-item-percent">{calculatePercentage(amount, total)}%</div>
            </div>
        </div>
    )
}

export default MonthlyReport
