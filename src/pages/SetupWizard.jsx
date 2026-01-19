import { useState } from 'react'
import { setupAuth, SECURITY_QUESTIONS } from '../services/authService'

function SetupWizard({ onSetupComplete }) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [securityQuestion, setSecurityQuestion] = useState('')
    const [securityAnswer, setSecurityAnswer] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (password.length < 4) {
            setError('Password must be at least 4 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (!securityQuestion) {
            setError('Please select a security question')
            return
        }

        if (securityAnswer.trim().length < 2) {
            setError('Please enter a valid answer')
            return
        }

        setLoading(true)

        try {
            await setupAuth(password, securityQuestion, securityAnswer)
            onSetupComplete()
        } catch (err) {
            console.error('Setup error:', err)
            setError('Failed to setup. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card setup-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo">
                            <img src="/milk.svg" alt="Marudhar Milk" className="auth-logo-svg" />
                        </div>
                        <h1 className="auth-title">Welcome!</h1>
                        <p className="auth-subtitle">Let's secure your Marudhar Milk Tracker</p>
                    </div>

                    {/* Setup Form */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Password Section */}
                        <div className="setup-section">
                            <h3 className="setup-section-title">
                                <span>🔐</span> Create Password
                            </h3>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="password-input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Security Question Section */}
                        <div className="setup-section">
                            <h3 className="setup-section-title">
                                <span>🛡️</span> Recovery Option
                            </h3>
                            <p className="setup-hint">This helps you reset your password if you forget it</p>

                            <div className="form-group">
                                <label className="form-label">Security Question</label>
                                <select
                                    className="form-input form-select"
                                    value={securityQuestion}
                                    onChange={(e) => setSecurityQuestion(e.target.value)}
                                    required
                                >
                                    <option value="">Select a question...</option>
                                    {SECURITY_QUESTIONS.map((q, index) => (
                                        <option key={index} value={q}>{q}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Your Answer</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter your answer"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="auth-error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Setting up...
                                </>
                            ) : (
                                <>
                                    Get Started 🚀
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SetupWizard
