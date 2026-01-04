import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { getEntryByDate, createEntry, updateEntry, transformEntry } from '../services/entriesService'
import { calculateDistributed, calculateTotal, validateEntry } from '../utils/calculations'
import { formatCurrency, formatLiters, formatDateForInput } from '../utils/formatters'

function AddEntry() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [existingEntry, setExistingEntry] = useState(null)
    const [errors, setErrors] = useState({})
    const [successMessage, setSuccessMessage] = useState('')

    const [formData, setFormData] = useState({
        date: formatDateForInput(new Date()),
        startingMilk: '',
        leftoverMilk: '',
        cash: '',
        upi: '',
        card: '',
        udhaarPermanent: '',
        udhaarTemporary: '',
        others: ''
    })

    // Check for existing entry when date changes
    useEffect(() => {
        checkExistingEntry(formData.date)
    }, [formData.date])

    async function checkExistingEntry(date) {
        if (!date) return

        try {
            setLoading(true)
            const entry = await getEntryByDate(date)

            if (entry) {
                const transformed = transformEntry(entry)
                setExistingEntry(transformed)
                setFormData({
                    date: transformed.date,
                    startingMilk: transformed.startingMilk.toString(),
                    leftoverMilk: transformed.leftoverMilk.toString(),
                    cash: transformed.cash.toString(),
                    upi: transformed.upi.toString(),
                    card: transformed.card.toString(),
                    udhaarPermanent: transformed.udhaarPermanent.toString(),
                    udhaarTemporary: transformed.udhaarTemporary.toString(),
                    others: transformed.others.toString()
                })
            } else {
                setExistingEntry(null)
            }
        } catch (err) {
            console.error('Error checking existing entry:', err)
        } finally {
            setLoading(false)
        }
    }

    function handleChange(field, value) {
        // Only allow numbers and decimal point
        if (field !== 'date') {
            value = value.replace(/[^0-9.]/g, '')
            // Prevent multiple decimal points
            const parts = value.split('.')
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('')
            }
        }

        setFormData(prev => ({ ...prev, [field]: value }))
        setErrors(prev => ({ ...prev, [field]: '' }))
        setSuccessMessage('')
    }

    // Auto-calculations
    const distributedMilk = calculateDistributed(formData.startingMilk, formData.leftoverMilk)
    const totalAmount = calculateTotal({
        cash: formData.cash,
        upi: formData.upi,
        card: formData.card,
        udhaarPermanent: formData.udhaarPermanent,
        udhaarTemporary: formData.udhaarTemporary,
        others: formData.others
    })

    async function handleSubmit(e) {
        e.preventDefault()

        const validation = validateEntry(formData)
        if (!validation.isValid) {
            setErrors(validation.errors)
            return
        }

        const entryData = {
            date: formData.date,
            startingMilk: parseFloat(formData.startingMilk) || 0,
            leftoverMilk: parseFloat(formData.leftoverMilk) || 0,
            distributedMilk,
            cash: parseFloat(formData.cash) || 0,
            upi: parseFloat(formData.upi) || 0,
            card: parseFloat(formData.card) || 0,
            udhaarPermanent: parseFloat(formData.udhaarPermanent) || 0,
            udhaarTemporary: parseFloat(formData.udhaarTemporary) || 0,
            others: parseFloat(formData.others) || 0,
            totalAmount
        }

        try {
            setSaving(true)

            if (existingEntry) {
                await updateEntry(existingEntry.id, entryData)
                setSuccessMessage(`✓ Entry updated for ${formData.date}`)
            } else {
                await createEntry(entryData)
                setSuccessMessage(`✓ Entry saved for ${formData.date}`)
            }

            // Navigate to dashboard after short delay
            setTimeout(() => navigate('/'), 1500)
        } catch (err) {
            console.error('Error saving entry:', err)
            setErrors({ submit: 'Failed to save entry. Please try again.' })
        } finally {
            setSaving(false)
        }
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
                            <div className="alert-title">Entry exists for this date</div>
                            <div className="alert-message">You are editing an existing entry. Changes will update the record.</div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Date Selection */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span className="form-section-icon">📅</span>
                            Date
                        </div>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            error={errors.date}
                            max={formatDateForInput(new Date())}
                        />
                    </div>

                    {/* Milk Inventory */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span className="form-section-icon">🥛</span>
                            Milk Inventory
                        </div>

                        <div className="form-grid">
                            <Input
                                label="Starting Milk Quantity"
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g., 500"
                                suffix="Liters"
                                value={formData.startingMilk}
                                onChange={(e) => handleChange('startingMilk', e.target.value)}
                                error={errors.startingMilk}
                            />

                            <Input
                                label="Leftover Milk Quantity"
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g., 50"
                                suffix="Liters"
                                value={formData.leftoverMilk}
                                onChange={(e) => handleChange('leftoverMilk', e.target.value)}
                                error={errors.leftoverMilk}
                            />
                        </div>

                        <div className="calculated-value" style={{ marginTop: 'var(--spacing-4)' }}>
                            <div className="calculated-value-label">Distributed Milk</div>
                            <div className="calculated-value-number">{formatLiters(distributedMilk)}</div>
                        </div>
                    </div>

                    {/* Payment Collection */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span className="form-section-icon">💰</span>
                            Payment Collection
                        </div>

                        <div className="form-grid">
                            <Input
                                label="Cash"
                                type="text"
                                inputMode="decimal"
                                prefix="₹"
                                placeholder="0"
                                value={formData.cash}
                                onChange={(e) => handleChange('cash', e.target.value)}
                                error={errors.cash}
                            />

                            <Input
                                label="UPI"
                                type="text"
                                inputMode="decimal"
                                prefix="₹"
                                placeholder="0"
                                value={formData.upi}
                                onChange={(e) => handleChange('upi', e.target.value)}
                                error={errors.upi}
                            />

                            <Input
                                label="Card"
                                type="text"
                                inputMode="decimal"
                                prefix="₹"
                                placeholder="0"
                                value={formData.card}
                                onChange={(e) => handleChange('card', e.target.value)}
                                error={errors.card}
                            />

                            <Input
                                label="Udhaar Permanent"
                                type="text"
                                inputMode="decimal"
                                prefix="₹"
                                placeholder="0"
                                value={formData.udhaarPermanent}
                                onChange={(e) => handleChange('udhaarPermanent', e.target.value)}
                                error={errors.udhaarPermanent}
                            />

                            <Input
                                label="Udhaar Temporary"
                                type="text"
                                inputMode="decimal"
                                prefix="₹"
                                placeholder="0"
                                value={formData.udhaarTemporary}
                                onChange={(e) => handleChange('udhaarTemporary', e.target.value)}
                                error={errors.udhaarTemporary}
                            />

                            <Input
                                label="Others"
                                type="text"
                                inputMode="decimal"
                                prefix="₹"
                                placeholder="0"
                                value={formData.others}
                                onChange={(e) => handleChange('others', e.target.value)}
                                error={errors.others}
                            />
                        </div>

                        <div className="calculated-value" style={{
                            marginTop: 'var(--spacing-4)',
                            background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
                            borderColor: 'var(--primary-500)'
                        }}>
                            <div className="calculated-value-label" style={{ color: 'var(--primary-600)' }}>Total Amount</div>
                            <div className="calculated-value-number" style={{ color: 'var(--primary-600)', fontSize: 'var(--font-size-3xl)' }}>
                                {formatCurrency(totalAmount)}
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
                            disabled={loading}
                        >
                            {existingEntry ? '💾 Update Entry' : '💾 Save Entry'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    )
}

export default AddEntry
