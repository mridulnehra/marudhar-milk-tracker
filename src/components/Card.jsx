function Card({ children, className = '', ...props }) {
    return (
        <div className={`card ${className}`} {...props}>
            {children}
        </div>
    )
}

function CardHeader({ children, className = '' }) {
    return (
        <div className={`card-header ${className}`}>
            {children}
        </div>
    )
}

function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`card-title ${className}`}>
            {children}
        </h3>
    )
}

function CardBody({ children, className = '' }) {
    return (
        <div className={`card-body ${className}`}>
            {children}
        </div>
    )
}

function CardFooter({ children, className = '' }) {
    return (
        <div className={`card-footer ${className}`}>
            {children}
        </div>
    )
}

export { Card, CardHeader, CardTitle, CardBody, CardFooter }
