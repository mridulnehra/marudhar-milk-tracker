import { useState, useEffect } from 'react'
import { getSecurityQuestion, verifySecurityAnswer, resetPassword } from '../services/authService'

function ForgotPassword({ onPasswordReset, onBackToLogin }) {
    const [step, setStep] = useState(1) // 1 = verify answer, 2 = new password
    const [securityQuestion, setSecurityQuestion] = useState('')
    const [answer, setAnswer] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [loadingQuestion, setLoadingQuestion] = useState(true)

    useEffect(() => {
        loadSecurityQuestion()
    }, [])

    const loadSecurityQuestion = async () => {
        try {
            const question = await getSecurityQuestion()
            setSecurityQuestion(question || 'No security question set')
        } catch (err) {
            console.error('Error loading security question:', err)
            setError('Failed to load security question')
        } finally {
            setLoadingQuestion(false)
        }
    }

    const handleVerifyAnswer = async (e) => {
        e.preventDefault()
        setError('')

        if (!answer.trim()) {
            setError('Please enter your answer')
            return
        }

        setLoading(true)

        try {
            const isCorrect = await verifySecurityAnswer(answer)

            if (isCorrect) {
                setStep(2)
            } else {
                setError('Incorrect answer. Please try again.')
            }
        } catch (err) {
            console.error('Verification error:', err)
            setError('Verification failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setError('')

        if (newPassword.length < 4) {
            setError('Password must be at least 4 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            await resetPassword(newPassword)
            onPasswordReset()
        } catch (err) {
            console.error('Reset error:', err)
            setError('Failed to reset password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (loadingQuestion) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-loading">
                            <span className="spinner large"></span>
                            <p>Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo forgot-password-logo">
                            <span className="auth-logo-icon">🔑</span>
                        </div>
                        <h1 className="auth-title">
                            {step === 1 ? 'Reset Password' : 'New Password'}
                        </h1>
                        <p className="auth-subtitle">
                            {step === 1
                                ? 'Answer the security question to continue'
                                : 'Create your new password'}
                        </p>
                    </div>

                    {step === 1 ? (
                        /* Step 1: Verify Security Answer */
                        <form onSubmit={handleVerifyAnswer} className="auth-form">
                            <div className="security-question-display">
                                <span className="question-icon">❓</span>
                                <p>{securityQuestion}</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Your Answer</label>
                                <input
                                    type="text"
                                    className={`form-input form-input-lg ${error ? 'error' : ''}`}
                                    placeholder="Enter your answer"
                                    value={answer}
                                    onChange={(e) => {
                                        setAnswer(e.target.value)
                                        setError('')
                                    }}
                                    autoFocus
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="auth-error">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg auth-submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Answer'
                                )}
                            </button>

                            <button
                                type="button"
                                className="forgot-password-link"
                                onClick={onBackToLogin}
                            >
                                ← Back to Login
                            </button>
                        </form>
                    ) : (
                        /* Step 2: Create New Password */
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="success-badge">
                                <span>✅</span> Answer verified!
                            </div>

                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div className="password-input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input form-input-lg"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoFocus
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
                                    className="form-input form-input-lg"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="auth-error">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg auth-submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
