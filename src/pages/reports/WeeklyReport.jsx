import { useState, useEffect } from 'react'
import { getEntriesByWeek, transformEntry } from '../../services/entriesService'
import { getAllAtms } from '../../services/atmsService'
import { formatCurrency, formatLiters, formatDate, formatDateForInput } from '../../utils/formatters'
import { calculatePercentage } from '../../utils/calculations'
import { startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns'

function WeeklyReport() {
    const [entries, setEntries] = useState([])
    const [atms, setAtms] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [selectedAtm, setSelectedAtm] = useState('all')

    useEffect(() => {
        loadAtms()
    }, [])

    useEffect(() => {
        loadEntries()
    }, [selectedWeekStart, selectedAtm])

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
            const data = await getEntriesByWeek(selectedWeekStart, atmId)
            setEntries(data.map(transformEntry))
        } catch (err) {
            console.error('Error loading weekly data:', err)
        } finally {
            setLoading(false)
        }
    }

    function prevWeek() {
        setSelectedWeekStart(subWeeks(selectedWeekStart, 1))
    }

    function nextWeek() {
        const next = addWeeks(selectedWeekStart, 1)
        if (next <= new Date()) {
            setSelectedWeekStart(next)
        }
    }

    const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 })

    // Calculate totals and averages
    const totalMilk = entries.reduce((sum, e) => sum + (e.totalMilk || 0), 0)
    const totalDistributed = entries.reduce((sum, e) => sum + e.distributedMilk, 0)
    const totalRevenue = entries.reduce((sum, e) => sum + e.totalAmount, 0)
    const totalLeftover = entries.reduce((sum, e) => sum + e.leftoverMilk, 0)
    const avgDistributed = entries.length ? totalDistributed / entries.length : 0
    const avgLeftover = entries.length ? totalLeftover / entries.length : 0

    // Payment breakdown with liters
    const payments = {
        cash: { liters: entries.reduce((sum, e) => sum + (e.cashLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.cash, 0) },
        upi: { liters: entries.reduce((sum, e) => sum + (e.upiLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.upi, 0) },
        card: { liters: entries.reduce((sum, e) => sum + (e.cardLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.card, 0) },
        udhaarPermanent: { liters: entries.reduce((sum, e) => sum + (e.udhaarPermanentLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.udhaarPermanent, 0) },
        udhaarTemporary: { liters: entries.reduce((sum, e) => sum + (e.udhaarTemporaryLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.udhaarTemporary, 0) },
        others: { liters: entries.reduce((sum, e) => sum + (e.othersLiters || 0), 0), amount: entries.reduce((sum, e) => sum + e.others, 0) }
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📊 Weekly Summary</h1>
                    <p className="page-subtitle">
                        {selectedAtm !== 'all' && atms.find(a => a.id === selectedAtm)?.name + ' — '}
                        {formatDate(selectedWeekStart, 'dd MMM')} - {formatDate(weekEnd, 'dd MMM yyyy')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                    <button className="btn btn-secondary" onClick={prevWeek}>← Prev</button>
                    <button
                        className="btn btn-secondary"
                        onClick={nextWeek}
                        disabled={addWeeks(selectedWeekStart, 1) > new Date()}
                    >
                        Next →
                    </button>
                </div>
            </header>

            <div className="page-content">
                {/* ATM Filter */}
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
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span className="loading-text">Loading weekly data...</span>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <h3 className="empty-state-title">No Data for This Week</h3>
                            <p className="empty-state-message">
                                No entries found for {selectedAtm !== 'all' ? atms.find(a => a.id === selectedAtm)?.name + ' in ' : ''}the selected week
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
                                <div className="value">{formatLiters(avgLeftover)}</div>
                            </div>
                            <div className="report-card" style={{ borderLeftColor: 'var(--info-500)' }}>
                                <h3>Total Revenue</h3>
                                <div className="value">{formatCurrency(totalRevenue)}</div>
                            </div>
                        </div>

                        {/* Payment Breakdown with Liters */}
                        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                            <div className="card-header">
                                <h3 className="card-title">💰 Payment Method Breakdown (Liters / Amount)</h3>
                            </div>
                            <div className="card-body">
                                <div className="payment-breakdown">
                                    <PaymentMethodCard icon="💵" label="Cash" liters={payments.cash.liters} amount={payments.cash.amount} total={totalRevenue} />
                                    <PaymentMethodCard icon="📱" label="UPI" liters={payments.upi.liters} amount={payments.upi.amount} total={totalRevenue} />
                                    <PaymentMethodCard icon="💳" label="Card" liters={payments.card.liters} amount={payments.card.amount} total={totalRevenue} />
                                    <PaymentMethodCard icon="📒" label="Udhaar Permanent" liters={payments.udhaarPermanent.liters} amount={payments.udhaarPermanent.amount} total={totalRevenue} />
                                    <PaymentMethodCard icon="📝" label="Udhaar Temporary" liters={payments.udhaarTemporary.liters} amount={payments.udhaarTemporary.amount} total={totalRevenue} />
                                    <PaymentMethodCard icon="📦" label="Others" liters={payments.others.liters} amount={payments.others.amount} total={totalRevenue} />
                                </div>
                            </div>
                        </div>

                        {/* Daily Breakdown */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">📅 Daily Breakdown</h3>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Day</th>
                                                <th>Date</th>
                                                <th>Shift</th>
                                                {selectedAtm === 'all' && <th>ATM</th>}
                                                <th>Total (L)</th>
                                                <th>Distributed (L)</th>
                                                <th>Leftover (L)</th>
                                                <th>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entries.map(entry => (
                                                <tr key={entry.id}>
                                                    <td>{formatDate(entry.date, 'EEE')}</td>
                                                    <td style={{ fontWeight: '600' }}>{formatDate(entry.date, 'dd MMM')}</td>
                                                    <td>
                                                        <span className={`badge ${entry.shift === 'morning' ? 'badge-warning' : 'badge-info'}`}>
                                                            {entry.shift === 'morning' ? '🌅 Morning' : '🌙 Evening'}
                                                        </span>
                                                    </td>
                                                    {selectedAtm === 'all' && (
                                                        <td>
                                                            <span style={{
                                                                padding: 'var(--spacing-1) var(--spacing-2)',
                                                                background: 'var(--gray-100)',
                                                                borderRadius: 'var(--radius-md)',
                                                                fontSize: 'var(--font-size-sm)'
                                                            }}>
                                                                {entry.atmName}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td>{(entry.totalMilk || 0).toFixed(1)}</td>
                                                    <td style={{ color: 'var(--success-600)', fontWeight: '500' }}>
                                                        {entry.distributedMilk.toFixed(1)}
                                                    </td>
                                                    <td style={{ color: 'var(--warning-600)' }}>
                                                        {entry.leftoverMilk.toFixed(1)}
                                                    </td>
                                                    <td style={{ fontWeight: '600' }}>{formatCurrency(entry.totalAmount)}</td>
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

export default WeeklyReport
