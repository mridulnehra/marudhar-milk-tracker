import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { getEntryByDateAtmAndShift, createEntry, updateEntry, transformEntry } from '../services/entriesService'
import { getAllAtms } from '../services/atmsService'
import { getMilkRate } from '../services/settingsService'
import { formatCurrency, formatLiters, formatDateForInput } from '../utils/formatters'

// Helper to determine default shift based on current time
function getDefaultShift() {
    const hour = new Date().getHours()
    return hour < 12 ? 'morning' : 'evening'
}

function AddEntry() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [existingEntry, setExistingEntry] = useState(null)
    const [errors, setErrors] = useState({})
    const [successMessage, setSuccessMessage] = useState('')
    const [atms, setAtms] = useState([])
    const [milkRate, setMilkRate] = useState(0)

    const [formData, setFormData] = useState({
        date: formatDateForInput(new Date()),
        atmId: searchParams.get('atm') || '',
        shift: getDefaultShift(),
        totalMilk: '',
        // Payment methods - each with liters and amount
        cashLiters: '',
        cash: '',
        upiLiters: '',
        upi: '',
        cardLiters: '',
        card: '',
        udhaarPermanentLiters: '',
        udhaarPermanent: '',
        udhaarTemporaryLiters: '',
        udhaarTemporary: '',
        othersLiters: '',
        others: ''
    })

    // Load ATMs and milk rate on mount
    useEffect(() => {
        loadInitialData()
    }, [])

    // Check for existing entry when date, ATM, or shift changes
    useEffect(() => {
        if (formData.date && formData.atmId && formData.shift) {
            checkExistingEntry(formData.date, formData.atmId, formData.shift)
        }
    }, [formData.date, formData.atmId, formData.shift])

    async function loadInitialData() {
        try {
            setLoading(true)
            const [atmsData, rate] = await Promise.all([
                getAllAtms(),
                getMilkRate()
            ])
            setAtms(atmsData)
            setMilkRate(rate)

            // If ATM was passed in URL, set it
            const atmFromUrl = searchParams.get('atm')
            if (atmFromUrl && atmsData.some(a => a.id === atmFromUrl)) {
                setFormData(prev => ({ ...prev, atmId: atmFromUrl }))
            } else if (atmsData.length > 0 && !formData.atmId) {
                // Default to first ATM if none selected
                setFormData(prev => ({ ...prev, atmId: atmsData[0].id }))
            }

            // Load default starting milk from localStorage
            const defaultMilk = localStorage.getItem('defaultStartingMilk')
            if (defaultMilk) {
                setFormData(prev => ({ ...prev, totalMilk: defaultMilk }))
            }
        } catch (err) {
            console.error('Error loading initial data:', err)
        } finally {
            setLoading(false)
        }
    }

    async function checkExistingEntry(date, atmId, shift) {
        if (!date || !atmId || !shift) return

        try {
            const entry = await getEntryByDateAtmAndShift(date, atmId, shift)

            if (entry) {
                const transformed = transformEntry(entry)
                setExistingEntry(transformed)
                setFormData({
                    date: transformed.date,
                    atmId: transformed.atmId,
                    shift: transformed.shift || shift,
                    totalMilk: transformed.totalMilk.toString(),
                    cashLiters: transformed.cashLiters.toString(),
                    cash: transformed.cash.toString(),
                    upiLiters: transformed.upiLiters.toString(),
                    upi: transformed.upi.toString(),
                    cardLiters: transformed.cardLiters.toString(),
                    card: transformed.card.toString(),
                    udhaarPermanentLiters: transformed.udhaarPermanentLiters.toString(),
                    udhaarPermanent: transformed.udhaarPermanent.toString(),
                    udhaarTemporaryLiters: transformed.udhaarTemporaryLiters.toString(),
                    udhaarTemporary: transformed.udhaarTemporary.toString(),
                    othersLiters: transformed.othersLiters.toString(),
                    others: transformed.others.toString()
                })
            } else {
                setExistingEntry(null)
                // Reset payment fields but keep date, ATM, shift, and total milk
                setFormData(prev => ({
                    ...prev,
                    cashLiters: '', cash: '',
                    upiLiters: '', upi: '',
                    cardLiters: '', card: '',
                    udhaarPermanentLiters: '', udhaarPermanent: '',
                    udhaarTemporaryLiters: '', udhaarTemporary: '',
                    othersLiters: '', others: ''
                }))
            }
        } catch (err) {
            console.error('Error checking existing entry:', err)
        }
    }

    function handleChange(field, value) {
        // Only allow numbers and decimal point for numeric fields
        if (field !== 'date' && field !== 'atmId' && field !== 'shift') {
            value = value.replace(/[^0-9.]/g, '')
            const parts = value.split('.')
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('')
            }
        }

        setFormData(prev => {
            const newData = { ...prev, [field]: value }

            // Auto-calculate amount from liters if milk rate is set
            if (milkRate > 0 && field.endsWith('Liters')) {
                const amountField = field.replace('Liters', '')
                const liters = parseFloat(value) || 0
                newData[amountField] = (liters * milkRate).toFixed(2)
            }

            return newData
        })

        setErrors(prev => ({ ...prev, [field]: '' }))
        setSuccessMessage('')
    }

    // Calculate distributed milk (sum of all liters)
    const distributedMilk = [
        formData.cashLiters,
        formData.upiLiters,
        formData.cardLiters,
        formData.udhaarPermanentLiters,
        formData.udhaarTemporaryLiters,
        formData.othersLiters
    ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0)

    // Calculate leftover milk
    const totalMilk = parseFloat(formData.totalMilk) || 0
    const leftoverMilk = Math.max(0, totalMilk - distributedMilk)

    // Calculate total amount
    const totalAmount = [
        formData.cash,
        formData.upi,
        formData.card,
        formData.udhaarPermanent,
        formData.udhaarTemporary,
        formData.others
    ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0)

    function validateForm() {
        const newErrors = {}

        if (!formData.date) newErrors.date = 'Date is required'
        if (!formData.atmId) newErrors.atmId = 'Please select an ATM'
        if (!formData.totalMilk || parseFloat(formData.totalMilk) <= 0) {
            newErrors.totalMilk = 'Total milk is required'
        }
        if (distributedMilk > totalMilk) {
            newErrors.totalMilk = 'Distributed milk cannot exceed total milk'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!validateForm()) return

        const entryData = {
            date: formData.date,
            atmId: formData.atmId,
            shift: formData.shift,
            totalMilk: parseFloat(formData.totalMilk) || 0,
            leftoverMilk,
            distributedMilk,
            cashLiters: parseFloat(formData.cashLiters) || 0,
            cash: parseFloat(formData.cash) || 0,
            upiLiters: parseFloat(formData.upiLiters) || 0,
            upi: parseFloat(formData.upi) || 0,
            cardLiters: parseFloat(formData.cardLiters) || 0,
            card: parseFloat(formData.card) || 0,
            udhaarPermanentLiters: parseFloat(formData.udhaarPermanentLiters) || 0,
            udhaarPermanent: parseFloat(formData.udhaarPermanent) || 0,
            udhaarTemporaryLiters: parseFloat(formData.udhaarTemporaryLiters) || 0,
            udhaarTemporary: parseFloat(formData.udhaarTemporary) || 0,
            othersLiters: parseFloat(formData.othersLiters) || 0,
            others: parseFloat(formData.others) || 0,
            totalAmount
        }

        try {
            setSaving(true)

            if (existingEntry) {
                await updateEntry(existingEntry.id, entryData)
                setSuccessMessage(`✓ Entry updated for ${getAtmName(formData.atmId)} (${formData.shift}) on ${formData.date}`)
            } else {
                await createEntry(entryData)
                setSuccessMessage(`✓ Entry saved for ${getAtmName(formData.atmId)} (${formData.shift}) on ${formData.date}`)
            }

            setTimeout(() => navigate('/'), 1500)
        } catch (err) {
            console.error('Error saving entry:', err)
            setErrors({ submit: 'Failed to save entry. Please try again.' })
        } finally {
            setSaving(false)
        }
    }

    function getAtmName(atmId) {
        const atm = atms.find(a => a.id === atmId)
        return atm?.name || 'Unknown ATM'
    }

    if (loading) {
        return (
            <>
                <header className="page-header">
                    <div>
                        <h1 className="page-title">📝 Add Entry</h1>
                    </div>
                </header>
                <div className="page-content">
                    <div className="loading">
                        <div className="spinner"></div>
                        <span className="loading-text">Loading...</span>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📝 {existingEntry ? 'Edit' : 'Add'} Entry</h1>
                    <p className="page-subtitle">
                        {existingEntry ? 'Update existing entry' : 'Record daily milk and payment data'}
                    </p>
                </div>
            </header>

            <div className="page-content">
                {successMessage && (
                    <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <span className="alert-icon">✓</span>
                        <div className="alert-content">
                            <div className="alert-message">{successMessage}</div>
                        </div>
                    </div>
                )}

                {errors.submit && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-content">
                            <div className="alert-message">{errors.submit}</div>
                        </div>
                    </div>
                )}

                {existingEntry && (
                    <div className="alert alert-warning" style={{ marginBottom: 'var(--spacing-6)' }}>
                        <span className="alert-icon">📅</span>
                        <div className="alert-content">
                            <div className="alert-title">Entry exists for this ATM ({formData.shift}) on this date</div>
                            <div className="alert-message">You are editing an existing entry. Changes will update the record.</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Date and ATM Selection */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span className="form-section-icon">📅</span>
                            Date & ATM
                        </div>

                        <div className="form-grid">
                            <Input
                                type="date"
                                label="Date"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                error={errors.date}
                                max={formatDateForInput(new Date())}
                            />

                            <div className="input-group">
                                <label className="input-label">Select ATM</label>
                                <select
                                    className="input"
                                    value={formData.atmId}
                                    onChange={(e) => handleChange('atmId', e.target.value)}
                                    style={{
                                        height: '48px',
                                        borderColor: errors.atmId ? 'var(--error-500)' : undefined
                                    }}
                                >
                                    <option value="">-- Select ATM --</option>
                                    {atms.map(atm => (
                                        <option key={atm.id} value={atm.id}>
                                            {atm.name} {atm.location ? `(${atm.location})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.atmId && <span className="input-error">{errors.atmId}</span>}
                            </div>
                        </div>

                        {/* Shift Selector */}
                        <div className="input-group" style={{ marginTop: 'var(--spacing-4)' }}>
                            <label className="input-label">Shift</label>
                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-2)',
                                marginTop: 'var(--spacing-2)'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => handleChange('shift', 'morning')}
                                    style={{
                                        flex: 1,
                                        padding: 'var(--spacing-3) var(--spacing-4)',
                                        border: '2px solid',
                                        borderColor: formData.shift === 'morning' ? 'var(--warning-500)' : 'var(--gray-200)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: formData.shift === 'morning'
                                            ? 'linear-gradient(135deg, var(--warning-50) 0%, var(--warning-100) 100%)'
                                            : 'var(--white)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: formData.shift === 'morning' ? '600' : '400',
                                        color: formData.shift === 'morning' ? 'var(--warning-700)' : 'var(--gray-600)'
                                    }}
                                >
                                    🌅 Morning
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleChange('shift', 'evening')}
                                    style={{
                                        flex: 1,
                                        padding: 'var(--spacing-3) var(--spacing-4)',
                                        border: '2px solid',
                                        borderColor: formData.shift === 'evening' ? 'var(--primary-500)' : 'var(--gray-200)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: formData.shift === 'evening'
                                            ? 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)'
                                            : 'var(--white)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: formData.shift === 'evening' ? '600' : '400',
                                        color: formData.shift === 'evening' ? 'var(--primary-700)' : 'var(--gray-600)'
                                    }}
                                >
                                    🌙 Evening
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Milk Inventory */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span className="form-section-icon">🥛</span>
                            Milk Inventory
                        </div>

                        <div style={{ maxWidth: '300px' }}>
                            <Input
                                label="Total Milk Loaded"
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g., 500"
                                suffix="Liters"
                                value={formData.totalMilk}
                                onChange={(e) => handleChange('totalMilk', e.target.value)}
                                error={errors.totalMilk}
                            />
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 'var(--spacing-4)',
                            marginTop: 'var(--spacing-4)'
                        }}>
                            <div className="calculated-value">
                                <div className="calculated-value-label">Distributed</div>
                                <div className="calculated-value-number">{formatLiters(distributedMilk)}</div>
                            </div>
                            <div className="calculated-value" style={{
                                background: leftoverMilk > 0 ? 'var(--warning-50)' : 'var(--success-50)',
                                borderColor: leftoverMilk > 0 ? 'var(--warning-200)' : 'var(--success-200)'
                            }}>
                                <div className="calculated-value-label">Leftover</div>
                                <div className="calculated-value-number">{formatLiters(leftoverMilk)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Collection */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span className="form-section-icon">💰</span>
                            Payment Collection
                            {milkRate > 0 && (
                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginLeft: 'var(--spacing-2)' }}>
                                    (Auto-calc @ ₹{milkRate}/L)
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'grid', gap: 'var(--spacing-5)' }}>
                            {/* Cash */}
                            <PaymentMethodRow
                                label="💵 Cash"
                                litersValue={formData.cashLiters}
                                amountValue={formData.cash}
                                onLitersChange={(v) => handleChange('cashLiters', v)}
                                onAmountChange={(v) => handleChange('cash', v)}
                                autoCalc={milkRate > 0}
                            />

                            {/* UPI */}
                            <PaymentMethodRow
                                label="📱 UPI"
                                litersValue={formData.upiLiters}
                                amountValue={formData.upi}
                                onLitersChange={(v) => handleChange('upiLiters', v)}
                                onAmountChange={(v) => handleChange('upi', v)}
                                autoCalc={milkRate > 0}
                            />

                            {/* Card */}
                            <PaymentMethodRow
                                label="💳 Card"
                                litersValue={formData.cardLiters}
                                amountValue={formData.card}
                                onLitersChange={(v) => handleChange('cardLiters', v)}
                                onAmountChange={(v) => handleChange('card', v)}
                                autoCalc={milkRate > 0}
                            />

                            {/* Udhaar Permanent */}
                            <PaymentMethodRow
                                label="📒 Udhaar Permanent"
                                litersValue={formData.udhaarPermanentLiters}
                                amountValue={formData.udhaarPermanent}
                                onLitersChange={(v) => handleChange('udhaarPermanentLiters', v)}
                                onAmountChange={(v) => handleChange('udhaarPermanent', v)}
                                autoCalc={milkRate > 0}
                            />

                            {/* Udhaar Temporary */}
                            <PaymentMethodRow
                                label="📝 Udhaar Temporary"
                                litersValue={formData.udhaarTemporaryLiters}
                                amountValue={formData.udhaarTemporary}
                                onLitersChange={(v) => handleChange('udhaarTemporaryLiters', v)}
                                onAmountChange={(v) => handleChange('udhaarTemporary', v)}
                                autoCalc={milkRate > 0}
                            />

                            {/* Others */}
                            <PaymentMethodRow
                                label="📦 Others"
                                litersValue={formData.othersLiters}
                                amountValue={formData.others}
                                onLitersChange={(v) => handleChange('othersLiters', v)}
                                onAmountChange={(v) => handleChange('others', v)}
                                autoCalc={milkRate > 0}
                            />
                        </div>

                        {/* Total Liters & Total Amount */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--spacing-4)',
                            marginTop: 'var(--spacing-6)'
                        }}>
                            <div className="calculated-value" style={{
                                background: 'linear-gradient(135deg, var(--success-50) 0%, var(--success-100) 100%)',
                                borderColor: 'var(--success-500)'
                            }}>
                                <div className="calculated-value-label" style={{ color: 'var(--success-600)' }}>Total Liters</div>
                                <div className="calculated-value-number" style={{ color: 'var(--success-600)', fontSize: 'var(--font-size-2xl)' }}>
                                    {formatLiters(distributedMilk)}
                                </div>
                            </div>
                            <div className="calculated-value" style={{
                                background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
                                borderColor: 'var(--primary-500)'
                            }}>
                                <div className="calculated-value-label" style={{ color: 'var(--primary-600)' }}>Total Amount</div>
                                <div className="calculated-value-number" style={{ color: 'var(--primary-600)', fontSize: 'var(--font-size-2xl)' }}>
                                    {formatCurrency(totalAmount)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'flex-end' }}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            loading={saving}
                            disabled={loading || !formData.atmId}
                        >
                            {existingEntry ? '💾 Update Entry' : '💾 Save Entry'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}

// Reusable component for payment method row
function PaymentMethodRow({ label, litersValue, amountValue, onLitersChange, onAmountChange, autoCalc }) {
    return (
        <div className="payment-method-row">
            <div style={{ fontWeight: '500', fontSize: 'var(--font-size-sm)' }}>{label}</div>
            <Input
                placeholder="0"
                suffix="L"
                inputMode="decimal"
                wrapperClassName="short-suffix"
                value={litersValue}
                onChange={(e) => onLitersChange(e.target.value.replace(/[^0-9.]/g, ''))}
                style={{ marginBottom: 0 }}
            />
            <Input
                prefix="₹"
                placeholder="0"
                inputMode="decimal"
                value={amountValue}
                onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ''))}
                disabled={autoCalc}
                style={{ marginBottom: 0, opacity: autoCalc ? 0.7 : 1 }}
            />
        </div>
    )
}

export default AddEntry
