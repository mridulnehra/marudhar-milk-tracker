import { useState, useEffect } from 'react'
import { getEntriesByDateRange, transformEntry } from '../../services/entriesService'
import { formatLiters, formatDate, formatDateForInput, formatPercentage } from '../../utils/formatters'
import { subDays } from 'date-fns'

function LeftoverReport() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [fromDate, setFromDate] = useState(formatDateForInput(subDays(new Date(), 30)))
    const [toDate, setToDate] = useState(formatDateForInput(new Date()))

    useEffect(() => { loadEntries() }, [fromDate, toDate])

    async function loadEntries() {
        try {
            setLoading(true)
            const data = await getEntriesByDateRange(fromDate, toDate)
            setEntries(data.map(transformEntry))
        } catch (err) { console.error('Error:', err) }
        finally { setLoading(false) }
    }

    const totalLeftover = entries.reduce((sum, e) => sum + e.leftoverMilk, 0)
    const avgLeftover = entries.length ? totalLeftover / entries.length : 0
    const sorted = [...entries].sort((a, b) => b.leftoverMilk - a.leftoverMilk)
    const highest = sorted[0] || null
    const lowest = sorted[sorted.length - 1] || null

    // Last 7, 15, 30 days averages
    const last7 = entries.slice(0, 7)
    const last15 = entries.slice(0, 15)
    const avg7 = last7.length ? last7.reduce((s, e) => s + e.leftoverMilk, 0) / last7.length : 0
    const avg15 = last15.length ? last15.reduce((s, e) => s + e.leftoverMilk, 0) / last15.length : 0

    const suggestion = avgLeftover > 30
        ? `Based on the last ${entries.length} days, you average ${avgLeftover.toFixed(1)}L leftover daily. Consider ordering ${Math.round(entries.reduce((s, e) => s + e.startingMilk, 0) / entries.length - avgLeftover)}L instead to reduce waste.`
        : 'Your leftover milk is within optimal range. Keep up the good work!'

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📦 Leftover Milk Analysis</h1>
                    <p className="page-subtitle">Track and optimize milk wastage</p>
                </div>
            </header>
            <div className="page-content">
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-body">
                        <div className="date-filter">
                            <div className="date-filter-group">
                                <label>From:</label>
                                <input type="date" className="form-input" style={{ width: 'auto' }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} max={toDate} />
                            </div>
                            <div className="date-filter-group">
                                <label>To:</label>
                                <input type="date" className="form-input" style={{ width: 'auto' }} value={toDate} onChange={(e) => setToDate(e.target.value)} min={fromDate} max={formatDateForInput(new Date())} />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? <div className="loading"><div className="spinner"></div></div> : entries.length === 0 ? (
                    <div className="card"><div className="empty-state"><h3>No Data</h3></div></div>
                ) : (
                    <>
                        <div className="report-summary">
                            <div className="report-card warning">
                                <h3>Total Leftover</h3>
                                <div className="value">{formatLiters(totalLeftover)}</div>
                                <div className="subtext">{entries.length} entries</div>
                            </div>
                            <div className="report-card">
                                <h3>Average Daily Leftover</h3>
                                <div className="value">{formatLiters(avgLeftover)}</div>
                            </div>
                            <div className="report-card" style={{ borderLeftColor: 'var(--error-500)' }}>
                                <h3>Highest Leftover</h3>
                                <div className="value">{highest ? formatLiters(highest.leftoverMilk) : '-'}</div>
                                <div className="subtext">
                                    {highest ? `${highest.atmName || 'ATM'} • ${formatDate(highest.date, 'dd MMM')}` : ''}
                                </div>
                            </div>
                            <div className="report-card success">
                                <h3>Lowest Leftover</h3>
                                <div className="value">{lowest ? formatLiters(lowest.leftoverMilk) : '-'}</div>
                                <div className="subtext">
                                    {lowest ? `${lowest.atmName || 'ATM'} • ${formatDate(lowest.date, 'dd MMM')}` : ''}
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                            <div className="card-header"><h3 className="card-title">📊 Average Leftover Trends</h3></div>
                            <div className="card-body">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-4)' }}>
                                    <div className="payment-item"><div className="payment-item-details"><div className="payment-item-label">Last 7 Days</div><div className="payment-item-value">{formatLiters(avg7)}</div></div></div>
                                    <div className="payment-item"><div className="payment-item-details"><div className="payment-item-label">Last 15 Days</div><div className="payment-item-value">{formatLiters(avg15)}</div></div></div>
                                    <div className="payment-item"><div className="payment-item-details"><div className="payment-item-label">Full Period</div><div className="payment-item-value">{formatLiters(avgLeftover)}</div></div></div>
                                </div>
                            </div>
                        </div>

                        <div className="alert alert-info" style={{ marginBottom: 'var(--spacing-6)' }}>
                            <span className="alert-icon">💡</span>
                            <div className="alert-content">
                                <div className="alert-title">Insight</div>
                                <div className="alert-message">{suggestion}</div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header"><h3 className="card-title">📅 Leftover Details</h3></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <div className="table-container">
                                    <table className="table">
                                        <thead><tr><th>Date</th><th>Shift</th><th>ATM</th><th>Starting (L)</th><th>Leftover (L)</th><th>Leftover %</th></tr></thead>
                                        <tbody>
                                            {entries.map(e => {
                                                const pct = e.startingMilk ? (e.leftoverMilk / e.startingMilk * 100) : 0
                                                return (
                                                    <tr key={e.id}>
                                                        <td style={{ fontWeight: '600' }}>{formatDate(e.date, 'dd-MMM')}</td>
                                                        <td>
                                                            <span className={`badge ${e.shift === 'morning' ? 'badge-warning' : 'badge-info'}`}>
                                                                {e.shift === 'morning' ? '🌅 Morning' : '🌙 Evening'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                padding: 'var(--spacing-1) var(--spacing-2)',
                                                                background: 'var(--gray-100)',
                                                                borderRadius: 'var(--radius-md)',
                                                                fontSize: 'var(--font-size-sm)'
                                                            }}>
                                                                {e.atmName || 'Unknown'}
                                                            </span>
                                                        </td>
                                                        <td>{e.startingMilk.toFixed(1)}</td>
                                                        <td style={{ color: pct > 15 ? 'var(--error-500)' : pct > 10 ? 'var(--warning-600)' : 'var(--success-600)', fontWeight: '500' }}>{e.leftoverMilk.toFixed(1)}</td>
                                                        <td>{formatPercentage(pct)}</td>
                                                    </tr>
                                                )
                                            })}
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

export default LeftoverReport
