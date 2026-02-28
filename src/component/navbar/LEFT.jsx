import React, { useEffect, useRef, useState } from 'react'
import Lottie from 'lottie-react'
import animationData from '../../icon/Menu-white.json'
import Hash from '../../icon/category.png'
import order from '../../icon/order.png'
import Dashbarod from '../../icon/grapic.png'
import Product from '../../icon/Product.png'

export default function LEFT({ current, onNavigate }) {

    const items = [
        { id: 'Dashboard', label: 'Dashboard', icons: Dashbarod, },
        { id: 'Category', label: 'ປະເພດສິນຄ້າ', icons: Hash },
        { id: 'Product', label: 'ສະຕ໋ອກສີນຄ້າ', icons: Product },
        { id: 'Order', label: 'ອໍເດີ້', icons: order },
        // { id: 'users', label: 'Users' },
        // { id: 'create-user', label: 'Create User' },
    ]

    function onLogout() {
        localStorage.clear();
        window.location.reload(false)
    }

    const [menuOpen, setMenuOpen] = useState(false)
    const [isOpen, setIsOpen] = useState(false);
    const lottieRef = useRef();

    const handleClick = () => {
        if (!isOpen) {
            lottieRef.current.playSegments([0, 50], true);
            setMenuOpen(true)
        } else {
            lottieRef.current.playSegments([50, 0], true);
            setMenuOpen(false)
        }
        setIsOpen(!isOpen);
    };

    const raw = JSON.parse(localStorage.getItem('data'))

    return (
        <>
            <div className='header'>
                <Lottie
                    onClick={handleClick}
                    lottieRef={lottieRef}
                    className='menu-icon'
                    animationData={animationData}
                    loop={false}
                    autoplay={true}
                    style={{ width: 40, borderLeft: '0.5px solid #2f30312a' }}
                />
                <hr style={{ margin: '6px 10px', borderColor: '#ffffff28' }} />
                <div style={{ fontWeight: 'bold', marginTop: 5, marginLeft: 10 }}>{raw}</div>
                <div className='closs' onClick={handleClick} style={{ display: menuOpen ? 'block' : 'none' }}></div>
            </div>
            <aside className="sidebar position-nav" style={{ left: menuOpen ? '0%' : '-65%', transition: 'left 0.5s ease', width: 250, padding: 12, borderRight: '0.5px solid #2f30312a', background: '#000000' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 22 }}>{raw}</div>

                <nav className="sidebar-nav menu" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {items.map((it) => (
                        <button
                            className='btn-hover'
                            key={it.id}
                            onClick={() => {
                                onNavigate?.(it.id)
                                handleClick()
                                const nav = JSON.parse(localStorage.getItem('Navigate'))
                                if (it.id === nav?.[0] && nav?.[1] === true) {
                                    localStorage.setItem('Navigate', JSON.stringify([it.id, false]))
                                    window.location.reload()
                                    return
                                } else {
                                    localStorage.setItem('Navigate', JSON.stringify([it.id, false]))
                                }
                            }}
                            style={{
                                display: 'flex',
                                flex: '1',
                                textAlign: 'left',
                                padding: '8px 10px',
                                background: current === it.id ? '#ffffff1e' : '',
                                backgroundHover: '#ffffff',
                                color: current === it.id ? '#fff' : '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                            }}
                        >
                            <img src={it.icons} style={{ width: 20, height: 20, borderLeft: '0.5px solid #2f30312a' }} />
                            <hr style={{ margin: '4px 6px', borderColor: '#ffffff28' }} />
                            <span style={{ marginLeft: '6px' }}>{it.label}</span>
                        </button>
                    ))}
                </nav>
                <div style={{ marginTop: 22 }}>
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
        </>
    )
}
