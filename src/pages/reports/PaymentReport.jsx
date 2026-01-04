import { useState, useEffect } from 'react'
import Button from '../../components/Button'
import { getEntriesByDateRange, transformEntry } from '../../services/entriesService'
import { formatCurrency, formatDate, formatDateForInput } from '../../utils/formatters'
import { calculatePercentage } from '../../utils/calculations'
import { exportToExcel } from '../../utils/exportExcel'
import { subDays } from 'date-fns'

function PaymentReport() {
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

    const payments = {
        cash: entries.reduce((sum, e) => sum + e.cash, 0),
        upi: entries.reduce((sum, e) => sum + e.upi, 0),
        card: entries.reduce((sum, e) => sum + e.card, 0),
        udhaarPermanent: entries.reduce((sum, e) => sum + e.udhaarPermanent, 0),
        udhaarTemporary: entries.reduce((sum, e) => sum + e.udhaarTemporary, 0),
        others: entries.reduce((sum, e) => sum + e.others, 0)
    }
    const total = Object.values(payments).reduce((sum, val) => sum + val, 0)

    const methods = [
        { key: 'cash', label: 'Cash', icon: '💵', value: payments.cash },
        { key: 'upi', label: 'UPI', icon: '📱', value: payments.upi },
        { key: 'card', label: 'Card', icon: '💳', value: payments.card },
        { key: 'udhaarPermanent', label: 'Udhaar Permanent', icon: '📝', value: payments.udhaarPermanent },
        { key: 'udhaarTemporary', label: 'Udhaar Temporary', icon: '⏳', value: payments.udhaarTemporary },
        { key: 'others', label: 'Others', icon: '📦', value: payments.others }
    ]

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">💳 Payment Methods Report</h1>
                    <p className="page-subtitle">Analyze payment collection</p>
                </div>
                <Button onClick={() => exportToExcel(entries, 'payment-report')} disabled={!entries.length}>📥 Export</Button>
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
                        <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                            <div className="card-header"><h3 className="card-title">💰 Payment Totals</h3></div>
                            <div className="card-body">
                                {methods.map(m => (
                                    <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                                        <span style={{ fontSize: 'var(--font-size-xl)' }}>{m.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{m.label}</span>
                                                <span style={{ fontWeight: '600' }}>{formatCurrency(m.value)} ({calculatePercentage(m.value, total)}%)</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px' }}>
                                                <div style={{ height: '100%', width: `${calculatePercentage(m.value, total)}%`, background: 'var(--primary-500)', borderRadius: '3px' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div style={{ borderTop: '2px solid var(--gray-200)', paddingTop: 'var(--spacing-3)', marginTop: 'var(--spacing-3)', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                                    <span>TOTAL</span><span style={{ color: 'var(--primary-600)' }}>{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">📅 Day-wise Breakdown</h3></div>
                            <div className="card-body" style={{ padding: 0 }}>
                                <div className="table-container">
                                    <table className="table">
                                        <thead><tr><th>Date</th><th>Cash</th><th>UPI</th><th>Card</th><th>Udhaar P</th><th>Udhaar T</th><th>Others</th><th>Total</th></tr></thead>
                                        <tbody>
                                            {entries.map(e => (
                                                <tr key={e.id}>
                                                    <td style={{ fontWeight: '600' }}>{formatDate(e.date, 'dd-MMM')}</td>
                                                    <td>{formatCurrency(e.cash)}</td><td>{formatCurrency(e.upi)}</td><td>{formatCurrency(e.card)}</td>
                                                    <td>{formatCurrency(e.udhaarPermanent)}</td><td>{formatCurrency(e.udhaarTemporary)}</td>
                                                    <td>{formatCurrency(e.others)}</td><td style={{ fontWeight: '600' }}>{formatCurrency(e.totalAmount)}</td>
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

export default PaymentReport
