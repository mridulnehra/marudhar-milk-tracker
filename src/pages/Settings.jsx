import { useState, useEffect } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { getAllEntries, createEntry } from '../services/entriesService'
import { getAllAtms, updateAtm } from '../services/atmsService'
import { getMilkRate, updateMilkRate } from '../services/settingsService'
import { exportToExcel, exportToJSON, parseJSONBackup } from '../utils/exportExcel'

function Settings() {
    const [defaultStartingMilk, setDefaultStartingMilk] = useState('')
    const [milkRate, setMilkRate] = useState('')
    const [atms, setAtms] = useState([])
    const [editingAtmId, setEditingAtmId] = useState(null)
    const [editAtmName, setEditAtmName] = useState('')
    const [editAtmLocation, setEditAtmLocation] = useState('')
    const [importing, setImporting] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [loadingAtms, setLoadingAtms] = useState(true)
    const [savingRate, setSavingRate] = useState(false)
    const [savingAtm, setSavingAtm] = useState(false)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        const saved = localStorage.getItem('defaultStartingMilk')
        if (saved) setDefaultStartingMilk(saved)
        loadAtmsAndSettings()
    }, [])

    async function loadAtmsAndSettings() {
        try {
            setLoadingAtms(true)
            const [atmsData, rateData] = await Promise.all([
                getAllAtms(),
                getMilkRate()
            ])
            setAtms(atmsData)
            setMilkRate(rateData > 0 ? rateData.toString() : '')
        } catch (err) {
            console.error('Error loading settings:', err)
            setMessage({ type: 'error', text: 'Failed to load ATM settings' })
        } finally {
            setLoadingAtms(false)
        }
    }

    function saveDefaultMilk() {
        localStorage.setItem('defaultStartingMilk', defaultStartingMilk)
        setMessage({ type: 'success', text: 'Default starting milk saved!' })
        setTimeout(() => setMessage(null), 3000)
    }

    async function handleSaveMilkRate() {
        try {
            setSavingRate(true)
            const rate = parseFloat(milkRate) || 0
            await updateMilkRate(rate)
            setMessage({ type: 'success', text: rate > 0 ? `Milk rate set to ₹${rate}/L. Amount will auto-calculate from liters.` : 'Milk rate disabled. Enter amount manually.' })
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save milk rate: ' + err.message })
        } finally {
            setSavingRate(false)
            setTimeout(() => setMessage(null), 4000)
        }
    }

    function startEditAtm(atm) {
        setEditingAtmId(atm.id)
        setEditAtmName(atm.name)
        setEditAtmLocation(atm.location || '')
    }

    function cancelEditAtm() {
        setEditingAtmId(null)
        setEditAtmName('')
        setEditAtmLocation('')
    }

    async function saveEditAtm(atmId) {
        try {
            setSavingAtm(true)
            await updateAtm(atmId, {
                name: editAtmName,
                location: editAtmLocation
            })
            setAtms(prev => prev.map(a => a.id === atmId ? { ...a, name: editAtmName, location: editAtmLocation } : a))
            setMessage({ type: 'success', text: 'ATM updated successfully!' })
            cancelEditAtm()
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update ATM: ' + err.message })
        } finally {
            setSavingAtm(false)
            setTimeout(() => setMessage(null), 3000)
        }
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

                {/* ATM Management */}
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header"><h3 className="card-title">🏧 Milk ATM Machines</h3></div>
                    <div className="card-body">
                        {loadingAtms ? (
                            <div className="loading">
                                <div className="spinner"></div>
                                <span className="loading-text">Loading ATMs...</span>
                            </div>
                        ) : atms.length === 0 ? (
                            <p style={{ color: 'var(--gray-500)' }}>No ATMs configured. Please run the database setup SQL first.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                                {atms.map(atm => (
                                    <div key={atm.id} style={{
                                        padding: 'var(--spacing-4)',
                                        background: 'var(--gray-50)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--gray-200)'
                                    }}>
                                        {editingAtmId === atm.id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                                                <Input
                                                    label="ATM Name"
                                                    value={editAtmName}
                                                    onChange={(e) => setEditAtmName(e.target.value)}
                                                    placeholder="e.g., ATM 1"
                                                />
                                                <Input
                                                    label="Location"
                                                    value={editAtmLocation}
                                                    onChange={(e) => setEditAtmLocation(e.target.value)}
                                                    placeholder="e.g., Main Market"
                                                />
                                                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                                                    <Button size="sm" onClick={() => saveEditAtm(atm.id)} loading={savingAtm}>Save</Button>
                                                    <Button size="sm" variant="secondary" onClick={cancelEditAtm}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: 'var(--font-size-lg)' }}>{atm.name}</div>
                                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                                                        {atm.location || 'No location set'}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={() => startEditAtm(atm)}>
                                                    ✏️ Edit
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Milk Rate Setting */}
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header"><h3 className="card-title">💰 Milk Rate (Optional)</h3></div>
                    <div className="card-body">
                        <div style={{ maxWidth: '300px' }}>
                            <Input
                                label="Price per Liter (₹)"
                                type="number"
                                value={milkRate}
                                onChange={(e) => setMilkRate(e.target.value)}
                                placeholder="e.g., 60"
                                hint="Set to auto-calculate amount from liters. Leave empty for manual entry."
                                prefix="₹"
                            />
                            <Button onClick={handleSaveMilkRate} loading={savingRate} style={{ marginTop: 'var(--spacing-3)' }}>
                                Save Rate
                            </Button>
                        </div>
                        {milkRate && parseFloat(milkRate) > 0 && (
                            <div style={{ marginTop: 'var(--spacing-3)', padding: 'var(--spacing-3)', background: 'var(--success-50)', borderRadius: 'var(--radius-md)', color: 'var(--success-700)' }}>
                                ✓ Auto-calculation enabled: Amount = Liters × ₹{milkRate}
                            </div>
                        )}
                    </div>
                </div>

                {/* Default Values */}
                <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
                    <div className="card-header"><h3 className="card-title">🥛 Default Values</h3></div>
                    <div className="card-body">
                        <div style={{ maxWidth: '300px' }}>
                            <Input label="Default Starting Milk (L)" type="number" value={defaultStartingMilk} onChange={(e) => setDefaultStartingMilk(e.target.value)} placeholder="e.g., 500" hint="Pre-fills in the entry form" />
                            <Button onClick={saveDefaultMilk} style={{ marginTop: 'var(--spacing-3)' }}>Save Default</Button>
                        </div>
                    </div>
                </div>

                {/* Export Data */}
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

                {/* Import Data */}
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

                {/* About */}
                <div className="card">
                    <div className="card-header"><h3 className="card-title">ℹ️ About</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gap: 'var(--spacing-2)' }}>
                            <div><strong>App:</strong> Marudhar Milk Tracker</div>
                            <div><strong>Version:</strong> 2.0.0</div>
                            <div><strong>Developer:</strong> Mridul Nehra</div>
                            <div><strong>Features:</strong> Multi-ATM support, Liters + Amount tracking</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Settings
