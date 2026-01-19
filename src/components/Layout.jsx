import { useState } from 'react'
import Sidebar from './Sidebar'

function Layout({ children, onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

            <main className="main-content">
                {children}
            </main>

            <button
                className="mobile-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>
        </div>
    )
}

export default Layout
