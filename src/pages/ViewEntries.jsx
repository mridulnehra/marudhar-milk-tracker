import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { getEntriesByMonth, deleteEntry, transformEntry } from '../services/entriesService'
import { getAllAtms } from '../services/atmsService'
import { formatCurrency, formatLiters, formatDate, getMonthName } from '../utils/formatters'

function ViewEntries() {
    const [entries, setEntries] = useState([])
    const [atms, setAtms] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedAtm, setSelectedAtm] = useState('all')
    const [viewEntry, setViewEntry] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleting, setDeleting] = useState(false)

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
            console.error('Error loading entries:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!deleteConfirm) return

        try {
            setDeleting(true)
            await deleteEntry(deleteConfirm.id)
            setEntries(entries.filter(e => e.id !== deleteConfirm.id))
            setDeleteConfirm(null)
        } catch (err) {
            console.error('Error deleting entry:', err)
        } finally {
            setDeleting(false)
        }
    }

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }))

    // Calculate totals for filtered entries
    const totals = {
        totalMilk: entries.reduce((sum, e) => sum + (e.totalMilk || 0), 0),
        distributed: entries.reduce((sum, e) => sum + (e.distributedMilk || 0), 0),
        leftover: entries.reduce((sum, e) => sum + (e.leftoverMilk || 0), 0),
        amount: entries.reduce((sum, e) => sum + (e.totalAmount || 0), 0)
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📋 View Entries</h1>
                    <p className="page-subtitle">Browse and manage all milk records</p>
                </div>
                <Link to="/add">
                    <Button>📝 Add Entry</Button>
                </Link>
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

                {/* Summary Stats */}
                {entries.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 'var(--spacing-4)',
                        marginBottom: 'var(--spacing-6)'
                    }}>
                        <div className="calculated-value">
                            <div className="calculated-value-label">Total Milk</div>
                            <div className="calculated-value-number">{formatLiters(totals.totalMilk)}</div>
                        </div>
                        <div className="calculated-value" style={{ borderColor: 'var(--success-200)', background: 'var(--success-50)' }}>
                            <div className="calculated-value-label">Distributed</div>
                            <div className="calculated-value-number" style={{ color: 'var(--success-600)' }}>{formatLiters(totals.distributed)}</div>
                        </div>
                        <div className="calculated-value" style={{ borderColor: 'var(--warning-200)', background: 'var(--warning-50)' }}>
                            <div className="calculated-value-label">Leftover</div>
                            <div className="calculated-value-number" style={{ color: 'var(--warning-600)' }}>{formatLiters(totals.leftover)}</div>
                        </div>
                        <div className="calculated-value" style={{ borderColor: 'var(--primary-200)', background: 'var(--primary-50)' }}>
                            <div className="calculated-value-label">Total Revenue</div>
                            <div className="calculated-value-number" style={{ color: 'var(--primary-600)' }}>{formatCurrency(totals.amount)}</div>
                        </div>
                    </div>
                )}

                {/* Entries Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            {selectedAtm !== 'all' && atms.find(a => a.id === selectedAtm)?.name + ' — '}
                            {getMonthName(selectedMonth)} {selectedYear} — {entries.length} entries
                        </h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                <span className="loading-text">Loading entries...</span>
                            </div>
                        ) : entries.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3 className="empty-state-title">No Entries Found</h3>
                                <p className="empty-state-message">
                                    No entries for {selectedAtm !== 'all' ? atms.find(a => a.id === selectedAtm)?.name + ' in ' : ''}{getMonthName(selectedMonth)} {selectedYear}
                                </p>
                                <Link to="/add">
                                    <Button>Add First Entry</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>ATM</th>
                                            <th>Total (L)</th>
                                            <th>Distributed (L)</th>
                                            <th>Leftover (L)</th>
                                            <th>Revenue</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map(entry => (
                                            <tr key={entry.id}>
                                                <td style={{ fontWeight: '600' }}>{formatDate(entry.date, 'dd MMM')}</td>
                                                <td>
                                                    <span style={{
                                                        padding: 'var(--spacing-1) var(--spacing-2)',
                                                        background: 'var(--gray-100)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: 'var(--font-size-sm)'
                                                    }}>
                                                        {entry.atmName || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td>{(entry.totalMilk || 0).toFixed(1)}</td>
                                                <td style={{ color: 'var(--success-600)', fontWeight: '500' }}>
                                                    {entry.distributedMilk.toFixed(1)}
                                                </td>
                                                <td style={{ color: 'var(--warning-600)' }}>
                                                    {entry.leftoverMilk.toFixed(1)}
                                                </td>
                                                <td style={{ fontWeight: '600' }}>{formatCurrency(entry.totalAmount)}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => setViewEntry(entry)}
                                                        >
                                                            👁️
                                                        </Button>
                                                        <Link to={`/add?atm=${entry.atmId}`}>
                                                            <Button size="sm" variant="secondary">✏️</Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => setDeleteConfirm(entry)}
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Entry Modal */}
            <Modal
                isOpen={!!viewEntry}
                onClose={() => setViewEntry(null)}
                title={`Entry Details - ${viewEntry ? formatDate(viewEntry.date, 'dd MMMM yyyy') : ''}`}
            >
                {viewEntry && (
                    <div>
                        {/* ATM Info */}
                        <div style={{
                            padding: 'var(--spacing-3)',
                            background: 'var(--gray-100)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-4)'
                        }}>
                            <div style={{ fontWeight: '600' }}>🏧 {viewEntry.atmName}</div>
                            {viewEntry.atmLocation && (
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                                    📍 {viewEntry.atmLocation}
                                </div>
                            )}
                        </div>

                        <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--gray-600)' }}>Milk Inventory</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Total Milk</div>
                                    <div className="payment-item-value">{formatLiters(viewEntry.totalMilk)}</div>
                                </div>
                            </div>
                            <div className="payment-item" style={{ background: 'var(--success-50)' }}>
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Distributed</div>
                                    <div className="payment-item-value" style={{ color: 'var(--success-600)' }}>{formatLiters(viewEntry.distributedMilk)}</div>
                                </div>
                            </div>
                            <div className="payment-item" style={{ background: 'var(--warning-50)' }}>
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Leftover</div>
                                    <div className="payment-item-value" style={{ color: 'var(--warning-600)' }}>{formatLiters(viewEntry.leftoverMilk)}</div>
                                </div>
                            </div>
                        </div>

                        <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--gray-600)' }}>Payment Breakdown (Liters / Amount)</h4>
                        <div className="payment-breakdown" style={{ marginBottom: 'var(--spacing-5)' }}>
                            <PaymentRow label="💵 Cash" liters={viewEntry.cashLiters} amount={viewEntry.cash} />
                            <PaymentRow label="📱 UPI" liters={viewEntry.upiLiters} amount={viewEntry.upi} />
                            <PaymentRow label="💳 Card" liters={viewEntry.cardLiters} amount={viewEntry.card} />
                            <PaymentRow label="📒 Udhaar Perm." liters={viewEntry.udhaarPermanentLiters} amount={viewEntry.udhaarPermanent} />
                            <PaymentRow label="📝 Udhaar Temp." liters={viewEntry.udhaarTemporaryLiters} amount={viewEntry.udhaarTemporary} />
                            <PaymentRow label="📦 Others" liters={viewEntry.othersLiters} amount={viewEntry.others} />
                        </div>

                        <div className="calculated-value" style={{
                            background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
                            borderColor: 'var(--primary-500)'
                        }}>
                            <div className="calculated-value-label" style={{ color: 'var(--primary-600)' }}>Total Collection</div>
                            <div className="calculated-value-number" style={{ color: 'var(--primary-600)' }}>
                                {formatCurrency(viewEntry.totalAmount)}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Confirm Delete"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleting}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p>Are you sure you want to delete the entry for <strong>{deleteConfirm && deleteConfirm.atmName}</strong> on <strong>{deleteConfirm && formatDate(deleteConfirm.date, 'dd MMMM yyyy')}</strong>?</p>
                <p style={{ color: 'var(--gray-500)', marginTop: 'var(--spacing-2)' }}>This action cannot be undone.</p>
            </Modal>
        </>
    )
}

// Helper component for payment row in modal
function PaymentRow({ label, liters, amount }) {
    return (
        <div className="payment-item">
            <div className="payment-item-details" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="payment-item-label">{label}</div>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                    <span style={{ color: 'var(--gray-600)' }}>{formatLiters(liters || 0)}</span>
                    <span className="payment-item-value">{formatCurrency(amount || 0)}</span>
                </div>
            </div>
        </div>
    )
}

export default ViewEntries
