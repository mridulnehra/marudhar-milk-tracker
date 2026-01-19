import { useState } from 'react'
import { login } from '../services/authService'

function Login({ onLoginSuccess, onForgotPassword }) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!password) {
            setError('Please enter your password')
            return
        }

        setLoading(true)

        try {
            const success = await login(password, rememberMe)

            if (success) {
                onLoginSuccess()
            } else {
                setError('Incorrect password')
                setShake(true)
                setTimeout(() => setShake(false), 500)
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className={`auth-card ${shake ? 'shake' : ''}`}>
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo">
                            <img src="/milk.svg" alt="Marudhar Milk" className="auth-logo-svg" />
                        </div>
                        <h1 className="auth-title">Marudhar Milk</h1>
                        <p className="auth-subtitle">Enter password to continue</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="password-input-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-input form-input-lg ${error ? 'error' : ''}`}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError('')
                                    }}
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

                        {/* Remember Me */}
                        <div className="remember-me">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="checkbox-custom"></span>
                                Remember me
                            </label>
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
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>

                        {/* Forgot Password */}
                        <button
                            type="button"
                            className="forgot-password-link"
                            onClick={onForgotPassword}
                        >
                            Forgot Password?
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p>Marudhar Milk Tracker v1.0</p>
                </div>
            </div>
        </div>
    )
}

export default Login
