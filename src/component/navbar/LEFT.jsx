import React from 'react'

export default function LEFT({ current, onNavigate }) {
    const items = [
        { id: 'auth', label: 'Auth' },
        { id: 'users', label: 'Users' },
        { id: 'create-user', label: 'Create User' },
    ]

    function onLogout() {
        localStorage.removeItem('user')
        window.location.reload(false)
    }

    return (
        <aside className="sidebar" style={{ width: 200, padding: 12, borderRight: '0.5px solid #2f30312a' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 12 }}>Navigation</div>
            <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((it) => (
                    <button
                        key={it.id}
                        onClick={() => onNavigate?.(it.id)}
                        style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            background: current === it.id ? '#0365d63b' : '#2f30312a',
                            color: current === it.id ? '#fff' : '#ffffff',
                            border: '1px solid #2f30312a',
                            borderRadius: 6,
                            cursor: 'pointer',
                        }}
                    >
                        {it.label}
                    </button>
                ))}
            </nav>
            <div style={{ bottom: 12 }}>
                <button
                    className="button button-danger"
                    onClick={() => onLogout?.()}
                    style={{
                        width: '100%',
                        marginTop: 8,
                        background: '#ff4d4d',
                        color: '#fff'
                    }}
                >
                    Logout
                </button>
            </div>
        </aside>
    )
}
