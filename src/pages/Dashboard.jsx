import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import Button from '../components/Button'
import { getTodayEntry, getMonthSummary, transformEntry } from '../services/entriesService'
import { formatCurrency, formatLiters, formatDate } from '../utils/formatters'

function Dashboard() {
    const [todayEntry, setTodayEntry] = useState(null)
    const [monthSummary, setMonthSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            setLoading(true)
            setError(null)

            const today = new Date()
            const [entry, summary] = await Promise.all([
                getTodayEntry(),
                getMonthSummary(today.getFullYear(), today.getMonth() + 1)
            ])

            setTodayEntry(entry ? transformEntry(entry) : null)
            setMonthSummary(summary)
        } catch (err) {
            console.error('Error loading dashboard data:', err)
            setError('Failed to load data. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <>
                <header className="page-header">
                    <div>
                        <h1 className="page-title">📊 Dashboard</h1>
                        <p className="page-subtitle">Welcome to Marudhar Milk Tracker</p>
                    </div>
                </header>
                <div className="page-content">
                    <div className="loading">
                        <div className="spinner"></div>
                        <span className="loading-text">Loading dashboard...</span>
                    </div>
                </div>
            </>
        )
    }

    if (error) {
        return (
            <>
                <header className="page-header">
                    <div>
                        <h1 className="page-title">📊 Dashboard</h1>
                    </div>
                </header>
                <div className="page-content">
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-content">
                            <div className="alert-title">Error</div>
                            <div className="alert-message">{error}</div>
                        </div>
                    </div>
                    <Button onClick={loadData}>Try Again</Button>
                </div>
            </>
        )
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">📊 Dashboard</h1>
                    <p className="page-subtitle">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
                </div>
                <Link to="/add">
                    <Button size="lg">📝 Add Entry</Button>
                </Link>
            </header>

            <div className="page-content">
                {/* Today's Summary */}
                <section style={{ marginBottom: 'var(--spacing-8)' }}>
                    <h2 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        marginBottom: 'var(--spacing-4)',
                        color: 'var(--gray-700)'
                    }}>
                        Today's Summary
                    </h2>

                    {todayEntry ? (
                        <div className="stat-grid">
                            <StatCard
                                icon="🥛"
                                iconClass="primary"
                                value={formatLiters(todayEntry.startingMilk)}
                                label="Starting Milk"
                                variant="info"
                            />
                            <StatCard
                                icon="📦"
                                iconClass="warning"
                                value={formatLiters(todayEntry.leftoverMilk)}
                                label="Leftover Milk"
                                variant="warning"
                            />
                            <StatCard
                                icon="🚚"
                                iconClass="success"
                                value={formatLiters(todayEntry.distributedMilk)}
                                label="Distributed"
                                variant="success"
                            />
                            <StatCard
                                icon="💰"
                                iconClass="info"
                                value={formatCurrency(todayEntry.totalAmount)}
                                label="Total Collection"
                            />
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-4)' }}>📝</div>
                            <h3 style={{ marginBottom: 'var(--spacing-2)' }}>No Entry for Today</h3>
                            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-4)' }}>
                                Add your daily milk and payment data to see the summary here.
                            </p>
                            <Link to="/add">
                                <Button>Add Today's Entry</Button>
                            </Link>
                        </div>
                    )}
                </section>

                {/* This Month's Stats */}
                <section style={{ marginBottom: 'var(--spacing-8)' }}>
                    <h2 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        marginBottom: 'var(--spacing-4)',
                        color: 'var(--gray-700)'
                    }}>
                        This Month's Summary
                    </h2>

                    <div className="stat-grid">
                        <StatCard
                            icon="🚚"
                            iconClass="success"
                            value={formatLiters(monthSummary?.totalDistributed || 0)}
                            label="Total Distributed"
                            variant="success"
                        />
                        <StatCard
                            icon="💵"
                            iconClass="info"
                            value={formatCurrency(monthSummary?.totalRevenue || 0)}
                            label="Total Revenue"
                            variant="info"
                        />
                        <StatCard
                            icon="📊"
                            iconClass="primary"
                            value={formatLiters(monthSummary?.avgDistributed || 0)}
                            label="Avg Daily Distribution"
                        />
                        <StatCard
                            icon="📦"
                            iconClass="warning"
                            value={formatLiters(monthSummary?.avgLeftover || 0)}
                            label="Avg Daily Leftover"
                            variant="warning"
                        />
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        marginBottom: 'var(--spacing-4)',
                        color: 'var(--gray-700)'
                    }}>
                        Quick Actions
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
                        <Link to="/add" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ padding: 'var(--spacing-5)', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>📝</div>
                                <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>Add Entry</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>Record today's data</div>
                            </div>
                        </Link>

                        <Link to="/entries" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ padding: 'var(--spacing-5)', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>📋</div>
                                <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>View Entries</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>Browse all records</div>
                            </div>
                        </Link>

                        <Link to="/reports/monthly" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ padding: 'var(--spacing-5)', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>📊</div>
                                <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>Monthly Report</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>View analytics</div>
                            </div>
                        </Link>

                        <Link to="/settings" style={{ textDecoration: 'none' }}>
                            <div className="card" style={{ padding: 'var(--spacing-5)', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>⚙️</div>
                                <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>Settings</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>Export data</div>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Dashboard
