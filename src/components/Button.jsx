function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    ...props
}) {
    const sizeClass = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : ''
    const variantClass = `btn-${variant}`

    return (
        <button
            className={`btn ${variantClass} ${sizeClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    Loading...
                </>
            ) : children}
        </button>
    )
}

export default Button
