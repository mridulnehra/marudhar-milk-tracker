import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import Button from '../components/Button'
import { getTodayEntriesAllAtms, getMonthSummary, transformEntry } from '../services/entriesService'
import { getAllAtms } from '../services/atmsService'
import { formatCurrency, formatLiters, formatDate } from '../utils/formatters'

function Dashboard() {
    const [todayEntries, setTodayEntries] = useState([])
    const [atms, setAtms] = useState([])
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
            const [entries, atmsData, summary] = await Promise.all([
                getTodayEntriesAllAtms(),
                getAllAtms(),
                getMonthSummary(today.getFullYear(), today.getMonth() + 1)
            ])

            setTodayEntries(entries.map(transformEntry))
            setAtms(atmsData)
            setMonthSummary(summary)
        } catch (err) {
            console.error('Error loading dashboard data:', err)
            setError('Failed to load data. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    // Calculate combined totals for today
    const todayCombined = {
        totalMilk: todayEntries.reduce((sum, e) => sum + (e?.totalMilk || 0), 0),
        distributedMilk: todayEntries.reduce((sum, e) => sum + (e?.distributedMilk || 0), 0),
        leftoverMilk: todayEntries.reduce((sum, e) => sum + (e?.leftoverMilk || 0), 0),
        totalAmount: todayEntries.reduce((sum, e) => sum + (e?.totalAmount || 0), 0),
        atmCount: todayEntries.length
    }

    // Check which ATMs have entries today
    const atmsWithEntries = new Set(todayEntries.map(e => e.atmId))
    const atmsWithoutEntries = atms.filter(atm => !atmsWithEntries.has(atm.id))

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
                {/* Today's Combined Summary */}
                <section style={{ marginBottom: 'var(--spacing-8)' }}>
                    <h2 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        marginBottom: 'var(--spacing-4)',
                        color: 'var(--gray-700)'
                    }}>
                        Today's Combined Summary
                        {todayCombined.atmCount > 0 && (
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginLeft: 'var(--spacing-2)' }}>
                                ({todayCombined.atmCount} ATM{todayCombined.atmCount > 1 ? 's' : ''})
                            </span>
                        )}
                    </h2>

                    {todayEntries.length > 0 ? (
                        <div className="stat-grid">
                            <StatCard
                                icon="🥛"
                                iconClass="primary"
                                value={formatLiters(todayCombined.totalMilk)}
                                label="Total Milk"
                                variant="info"
                            />
                            <StatCard
                                icon="🚚"
                                iconClass="success"
                                value={formatLiters(todayCombined.distributedMilk)}
                                label="Distributed"
                                variant="success"
                            />
                            <StatCard
                                icon="📦"
                                iconClass="warning"
                                value={formatLiters(todayCombined.leftoverMilk)}
                                label="Leftover"
                                variant="warning"
                            />
                            <StatCard
                                icon="💰"
                                iconClass="info"
                                value={formatCurrency(todayCombined.totalAmount)}
                                label="Total Collection"
                            />
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-4)' }}>📝</div>
                            <h3 style={{ marginBottom: 'var(--spacing-2)' }}>No Entries for Today</h3>
                            <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--spacing-4)' }}>
                                Add entries for your ATMs to see the summary here.
                            </p>
                            <Link to="/add">
                                <Button>Add Today's Entry</Button>
                            </Link>
                        </div>
                    )}
                </section>

                {/* Individual ATM Stats */}
                {(todayEntries.length > 0 || atmsWithoutEntries.length > 0) && (
                    <section style={{ marginBottom: 'var(--spacing-8)' }}>
                        <h2 style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: '600',
                            marginBottom: 'var(--spacing-4)',
                            color: 'var(--gray-700)'
                        }}>
                            ATM Status
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 'var(--spacing-4)'
                        }}>
                            {/* ATMs with entries today */}
                            {todayEntries.map(entry => (
                                <div key={entry.id} className="card" style={{ padding: 'var(--spacing-4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: 'var(--font-size-lg)' }}>
                                                🏧 {entry.atmName}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                                                {entry.atmLocation || 'No location'}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: 'var(--spacing-1) var(--spacing-2)',
                                            background: entry.shift === 'morning' ? 'var(--warning-100)' : 'var(--primary-100)',
                                            color: entry.shift === 'morning' ? 'var(--warning-700)' : 'var(--primary-700)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: '600',
                                            marginRight: 'var(--spacing-1)'
                                        }}>
                                            {entry.shift === 'morning' ? '🌅' : '🌙'}
                                        </span>
                                        <span style={{
                                            padding: 'var(--spacing-1) var(--spacing-2)',
                                            background: 'var(--success-100)',
                                            color: 'var(--success-700)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: '600'
                                        }}>
                                            ✓ Updated
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>Distributed</div>
                                            <div style={{ fontWeight: '600', color: 'var(--success-600)' }}>{formatLiters(entry.distributedMilk)}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>Leftover</div>
                                            <div style={{ fontWeight: '600', color: 'var(--warning-600)' }}>{formatLiters(entry.leftoverMilk)}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'var(--spacing-3)', textAlign: 'center', padding: 'var(--spacing-2)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-600)' }}>Collection</div>
                                        <div style={{ fontWeight: '700', color: 'var(--primary-600)', fontSize: 'var(--font-size-lg)' }}>
                                            {formatCurrency(entry.totalAmount)}
                                        </div>
                                    </div>

                                    <Link to={`/add?atm=${entry.atmId}`} style={{ display: 'block', marginTop: 'var(--spacing-3)' }}>
                                        <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                                            ✏️ Edit Entry
                                        </Button>
                                    </Link>
                                </div>
                            ))}

                            {/* ATMs without entries today */}
                            {atmsWithoutEntries.map(atm => (
                                <div key={atm.id} className="card" style={{
                                    padding: 'var(--spacing-4)',
                                    background: 'var(--gray-50)',
                                    border: '2px dashed var(--gray-300)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: 'var(--font-size-lg)', color: 'var(--gray-600)' }}>
                                                🏧 {atm.name}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                                                {atm.location || 'No location'}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: 'var(--spacing-1) var(--spacing-2)',
                                            background: 'var(--warning-100)',
                                            color: 'var(--warning-700)',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: 'var(--font-size-xs)',
                                            fontWeight: '600'
                                        }}>
                                            ⏳ Pending
                                        </span>
                                    </div>

                                    <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-3)' }}>
                                        No entry added for today yet.
                                    </p>

                                    <Link to={`/add?atm=${atm.id}`} style={{ display: 'block' }}>
                                        <Button size="sm" style={{ width: '100%' }}>
                                            ➕ Add Entry
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

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
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>Manage ATMs & Export</div>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Dashboard
