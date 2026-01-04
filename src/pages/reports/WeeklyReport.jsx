import { useState, useEffect } from 'react'
import { getEntriesByWeek, transformEntry } from '../../services/entriesService'
import { formatCurrency, formatLiters, formatDate, formatDateForInput } from '../../utils/formatters'
import { calculatePercentage } from '../../utils/calculations'
import { startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns'

function WeeklyReport() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedWeekStart, setSelectedWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

    useEffect(() => {
        loadEntries()
    }, [selectedWeekStart])

    async function loadEntries() {
        try {
            setLoading(true)
            const data = await getEntriesByWeek(selectedWeekStart)
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

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📊 Weekly Summary</h1>
                    <p className="page-subtitle">
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
                            <p className="empty-state-message">No entries found for the selected week</p>
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
                                                <th>Starting (L)</th>
                                                <th>Distributed (L)</th>
                                                <th>Leftover (L)</th>
                                                <th>Total Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entries.map(entry => (
                                                <tr key={entry.id}>
                                                    <td>{formatDate(entry.date, 'EEE')}</td>
                                                    <td style={{ fontWeight: '600' }}>{formatDate(entry.date, 'dd MMM')}</td>
                                                    <td>{entry.startingMilk.toFixed(1)}</td>
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

export default WeeklyReport
