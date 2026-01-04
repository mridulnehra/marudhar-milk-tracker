import { useState, useEffect } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { getAllEntries, createEntry } from '../services/entriesService'
import { exportToExcel, exportToJSON, parseJSONBackup } from '../utils/exportExcel'

function Settings() {
    const [defaultStartingMilk, setDefaultStartingMilk] = useState('')
    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        const saved = localStorage.getItem('defaultStartingMilk')
        if (saved) setDefaultStartingMilk(saved)
    }, [])

    function saveDefaultMilk() {
        localStorage.setItem('defaultStartingMilk', defaultStartingMilk)
        setMessage({ type: 'success', text: 'Default starting milk saved!' })
        setTimeout(() => setMessage(null), 3000)
    }

    async function handleExportExcel() {
        try {
            setExporting(true)
            const entries = await getAllEntries()
            exportToExcel(entries, 'marudhar-milk-all-data')
            setMessage({ type: 'success', text: 'Excel file downloaded!' })
        } catch (err) {
            setMessage({ type: 'error', text: 'Export failed: ' + err.message })
        } finally {
            setExporting(false)
            setTimeout(() => setMessage(null), 3000)
        }
    }

    async function handleExportJSON() {
        try {
            const entries = await getAllEntries()
            exportToJSON(entries)
            setMessage({ type: 'success', text: 'JSON backup downloaded!' })
        } catch (err) {
            setMessage({ type: 'error', text: 'Export failed: ' + err.message })
        }
        setTimeout(() => setMessage(null), 3000)
    }

    async function handleImportJSON(e) {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setImporting(true)
            const data = await parseJSONBackup(file)
            let imported = 0
            for (const entry of data) {
                try {
                    await createEntry({
                        date: entry.date,
                        startingMilk: entry.starting_milk || entry.startingMilk,
                        leftoverMilk: entry.leftover_milk || entry.leftoverMilk,
                        distributedMilk: entry.distributed_milk || entry.distributedMilk,
                        cash: entry.cash, upi: entry.upi, card: entry.card,
                        udhaarPermanent: entry.udhaar_permanent || entry.udhaarPermanent,
                        udhaarTemporary: entry.udhaar_temporary || entry.udhaarTemporary,
                        others: entry.others,
                        totalAmount: entry.total_amount || entry.totalAmount
                    })
                    imported++
                } catch { /* skip duplicates */ }
            }
            setMessage({ type: 'success', text: `Imported ${imported} entries!` })
        } catch (err) {
            setMessage({ type: 'error', text: 'Import failed: ' + err.message })
        } finally {
            setImporting(false)
            e.target.value = ''
            setTimeout(() => setMessage(null), 5000)
        }
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">⚙️ Settings</h1>
                    <p className="page-subtitle">App configuration and data management</p>
                </div>
            </header>
            <div className="page-content">
                {message && (
                    <div className={`alert alert-${message.type}`} style={{ marginBottom: 'var(--spacing-6)' }}>
                        <span className="alert-icon">{message.type === 'success' ? '✓' : '⚠️'}</span>
                        <div className="alert-message">{message.text}</div>
                    </div>
                )}

                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header"><h3 className="card-title">🥛 Default Values</h3></div>
                    <div className="card-body">
                        <div style={{ maxWidth: '300px' }}>
                            <Input label="Default Starting Milk (L)" type="number" value={defaultStartingMilk} onChange={(e) => setDefaultStartingMilk(e.target.value)} placeholder="e.g., 500" hint="Pre-fills in the entry form" />
                            <Button onClick={saveDefaultMilk} style={{ marginTop: 'var(--spacing-3)' }}>Save Default</Button>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header"><h3 className="card-title">📥 Export Data</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                            <Button onClick={handleExportExcel} loading={exporting}>📊 Export to Excel</Button>
                            <Button variant="secondary" onClick={handleExportJSON}>💾 Export JSON Backup</Button>
                        </div>
                        <p style={{ marginTop: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                            Excel export includes all entries with summary sheets. JSON backup can be imported later.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header"><h3 className="card-title">📤 Import Data</h3></div>
                    <div className="card-body">
                        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            {importing ? 'Importing...' : '📁 Import JSON Backup'}
                            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} disabled={importing} />
                        </label>
                        <p style={{ marginTop: 'var(--spacing-3)', fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                            Import a previously exported JSON backup file. Duplicate dates will be skipped.
                        </p>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3 className="card-title">ℹ️ About</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
                            <div><strong>App:</strong> Marudhar Milk Tracker</div>
                            <div><strong>Version:</strong> 1.0.0</div>
                            <div><strong>Developer:</strong> Custom Built</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Settings
