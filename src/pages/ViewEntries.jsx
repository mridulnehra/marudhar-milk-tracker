import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { getEntriesByMonth, deleteEntry, transformEntry } from '../services/entriesService'
import { formatCurrency, formatLiters, formatDate, getMonthName } from '../utils/formatters'

function ViewEntries() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [viewEntry, setViewEntry] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadEntries()
    }, [selectedYear, selectedMonth])

    async function loadEntries() {
        try {
            setLoading(true)
            const data = await getEntriesByMonth(selectedYear, selectedMonth)
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

                {/* Entries Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
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
                                    No entries for {getMonthName(selectedMonth)} {selectedYear}
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
                                            <th>Starting (L)</th>
                                            <th>Distributed (L)</th>
                                            <th>Leftover (L)</th>
                                            <th>Total Revenue</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map(entry => (
                                            <tr key={entry.id}>
                                                <td style={{ fontWeight: '600' }}>{formatDate(entry.date, 'dd MMM')}</td>
                                                <td>{entry.startingMilk.toFixed(1)}</td>
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
                                                        <Link to={`/add?date=${entry.date}`}>
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
                        <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--gray-600)' }}>Milk Inventory</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Starting Milk</div>
                                    <div className="payment-item-value">{formatLiters(viewEntry.startingMilk)}</div>
                                </div>
                            </div>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Leftover</div>
                                    <div className="payment-item-value">{formatLiters(viewEntry.leftoverMilk)}</div>
                                </div>
                            </div>
                            <div className="payment-item" style={{ gridColumn: '1 / -1', background: 'var(--success-50)' }}>
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Distributed</div>
                                    <div className="payment-item-value" style={{ color: 'var(--success-600)' }}>
                                        {formatLiters(viewEntry.distributedMilk)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--gray-600)' }}>Payment Breakdown</h4>
                        <div className="payment-breakdown" style={{ marginBottom: 'var(--spacing-5)' }}>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Cash</div>
                                    <div className="payment-item-value">{formatCurrency(viewEntry.cash)}</div>
                                </div>
                            </div>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">UPI</div>
                                    <div className="payment-item-value">{formatCurrency(viewEntry.upi)}</div>
                                </div>
                            </div>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Card</div>
                                    <div className="payment-item-value">{formatCurrency(viewEntry.card)}</div>
                                </div>
                            </div>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Udhaar Permanent</div>
                                    <div className="payment-item-value">{formatCurrency(viewEntry.udhaarPermanent)}</div>
                                </div>
                            </div>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Udhaar Temporary</div>
                                    <div className="payment-item-value">{formatCurrency(viewEntry.udhaarTemporary)}</div>
                                </div>
                            </div>
                            <div className="payment-item">
                                <div className="payment-item-details">
                                    <div className="payment-item-label">Others</div>
                                    <div className="payment-item-value">{formatCurrency(viewEntry.others)}</div>
                                </div>
                            </div>
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
                <p>Are you sure you want to delete the entry for <strong>{deleteConfirm && formatDate(deleteConfirm.date, 'dd MMMM yyyy')}</strong>?</p>
                <p style={{ color: 'var(--gray-500)', marginTop: 'var(--spacing-2)' }}>This action cannot be undone.</p>
            </Modal>
        </>
    )
}

export default ViewEntries
