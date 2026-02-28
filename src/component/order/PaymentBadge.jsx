import React from 'react'

export default function PaymentBadge({ label, color, cancelled, onClick }) {
    return (
        <span
            onClick={onClick}
            style={{
                display: 'inline-block',
                padding: '2px 4px',
                borderRadius: 6,
                color: '#fff',
                background: color,
                cursor: cancelled ? 'not-allowed' : 'pointer'
            }}
        >
            {label}
        </span>
    )
}
