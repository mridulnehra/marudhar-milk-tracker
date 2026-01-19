import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import ViewEntries from './pages/ViewEntries'
import DailyReport from './pages/reports/DailyReport'
import WeeklyReport from './pages/reports/WeeklyReport'
import MonthlyReport from './pages/reports/MonthlyReport'
import PaymentReport from './pages/reports/PaymentReport'
import LeftoverReport from './pages/reports/LeftoverReport'
import Settings from './pages/Settings'
import Login from './pages/Login'
import SetupWizard from './pages/SetupWizard'
import ForgotPassword from './pages/ForgotPassword'
import { checkAuthSetup, isLoggedIn, logout } from './services/authService'

function App() {
    const [authState, setAuthState] = useState('loading') // 'loading', 'setup', 'login', 'authenticated'
    const [showForgotPassword, setShowForgotPassword] = useState(false)

    useEffect(() => {
        checkAuthState()
    }, [])

    const checkAuthState = async () => {
        try {
            const isSetup = await checkAuthSetup()

            if (!isSetup) {
                // First time setup needed
                setAuthState('setup')
            } else if (isLoggedIn()) {
                // Already logged in (remember me)
                setAuthState('authenticated')
            } else {
                // Need to login
                setAuthState('login')
            }
        } catch (error) {
            console.error('Auth check error:', error)
            // On error, show login by default
            setAuthState('login')
        }
    }

    const handleSetupComplete = () => {
        setAuthState('authenticated')
    }

    const handleLoginSuccess = () => {
        setAuthState('authenticated')
    }

    const handleForgotPassword = () => {
        setShowForgotPassword(true)
    }

    const handleBackToLogin = () => {
        setShowForgotPassword(false)
    }

    const handlePasswordReset = () => {
        setShowForgotPassword(false)
        setAuthState('authenticated')
    }

    const handleLogout = () => {
        logout()
        setAuthState('login')
    }

    // Loading state
    if (authState === 'loading') {
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

    // First time setup
    if (authState === 'setup') {
        return <SetupWizard onSetupComplete={handleSetupComplete} />
    }

    // Login required
    if (authState === 'login') {
        if (showForgotPassword) {
            return (
                <ForgotPassword
                    onPasswordReset={handlePasswordReset}
                    onBackToLogin={handleBackToLogin}
                />
            )
        }

        return (
            <Login
                onLoginSuccess={handleLoginSuccess}
                onForgotPassword={handleForgotPassword}
            />
        )
    }

    // Authenticated - show main app
    return (
        <Layout onLogout={handleLogout}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add" element={<AddEntry />} />
                <Route path="/entries" element={<ViewEntries />} />
                <Route path="/reports/daily" element={<DailyReport />} />
                <Route path="/reports/weekly" element={<WeeklyReport />} />
                <Route path="/reports/monthly" element={<MonthlyReport />} />
                <Route path="/reports/payment" element={<PaymentReport />} />
                <Route path="/reports/leftover" element={<LeftoverReport />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Layout>
    )
}

export default App
