function Input({
    label,
    type = 'text',
    error,
    hint,
    prefix,
    suffix,
    className = '',
    wrapperClassName = '',
    ...props
}) {
    const hasPrefix = !!prefix
    const hasSuffix = !!suffix

    return (
        <div className="form-group">
            {label && <label className="form-label">{label}</label>}
            <div className={`input-group ${hasSuffix ? 'has-suffix' : ''} ${wrapperClassName}`}>
                {hasPrefix && <span className="input-prefix">{prefix}</span>}
                <input
                    type={type}
                    className={`form-input ${error ? 'error' : ''} ${className}`}
                    style={hasPrefix ? { paddingLeft: 'var(--spacing-10)' } : {}}
                    {...props}
                />
                {hasSuffix && <span className="input-suffix">{suffix}</span>}
            </div>
            {hint && !error && <span className="form-hint">{hint}</span>}
            {error && <span className="form-error">{error}</span>}
        </div>
    )
}

export default Input
