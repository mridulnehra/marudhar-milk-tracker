import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/add', icon: '📝', label: 'Add Entry' },
    { path: '/entries', icon: '📋', label: 'View Entries' },
    {
        icon: '📊',
        label: 'Reports',
        children: [
            { path: '/reports/daily', label: 'Daily Report' },
            { path: '/reports/weekly', label: 'Weekly Summary' },
            { path: '/reports/monthly', label: 'Monthly Summary' },
            { path: '/reports/payment', label: 'Payment Methods' },
            { path: '/reports/leftover', label: 'Leftover Analysis' }
        ]
    },
    { path: '/settings', icon: '⚙️', label: 'Settings' }
]

function Sidebar({ isOpen, onClose, onLogout }) {
    const location = useLocation()
    const [expandedMenu, setExpandedMenu] = useState('Reports')
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    const isActive = (path) => location.pathname === path
    const isReportActive = () => location.pathname.startsWith('/reports')

    const handleLogoutClick = () => {
        setShowLogoutModal(true)
    }

    const confirmLogout = () => {
        setShowLogoutModal(false)
        onLogout()
    }

    const cancelLogout = () => {
        setShowLogoutModal(false)
    }

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🥛</div>
                        <span className="sidebar-logo-text">Marudhar Milk</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Menu</div>
                        {navItems.map((item) => (
                            item.children ? (
                                <div key={item.label}>
                                    <div
                                        className={`nav-item ${isReportActive() ? 'active' : ''}`}
                                        onClick={() => setExpandedMenu(expandedMenu === item.label ? null : item.label)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span className="nav-item-icon">{item.icon}</span>
                                        <span>{item.label}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                                            {expandedMenu === item.label ? '▼' : '▶'}
                                        </span>
                                    </div>
                                    {expandedMenu === item.label && (
                                        <div className="nav-submenu">
                                            {item.children.map((child) => (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    className={`nav-item ${isActive(child.path) ? 'active' : ''}`}
                                                    onClick={onClose}
                                                >
                                                    <span>{child.label}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                    onClick={onClose}
                                >
                                    <span className="nav-item-icon">{item.icon}</span>
                                    <span>{item.label}</span>
                                </NavLink>
                            )
                        ))}
                    </div>

                    {/* Logout Section */}
                    <div className="nav-section">
                        <div className="nav-section-title">Account</div>
                        <button
                            className="nav-item logout-btn"
                            onClick={handleLogoutClick}
                        >
                            <span className="nav-item-icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>

                <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)' }}>
                        © 2025 Marudhar Milk
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="logout-modal-overlay" onClick={cancelLogout}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-icon">🚪</div>
                        <h3>Logout</h3>
                        <p>Are you sure you want to logout?</p>
                        <div className="logout-modal-buttons">
                            <button className="btn btn-secondary" onClick={cancelLogout}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmLogout}>
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Sidebar
