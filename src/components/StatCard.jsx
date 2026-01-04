function StatCard({ icon, iconClass = 'primary', value, label, variant = '' }) {
    return (
        <div className={`stat-card ${variant}`}>
            <div className={`stat-icon ${iconClass}`}>
                {icon}
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    )
}

export default StatCard
