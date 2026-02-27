import React, { useEffect, useState, useRef } from 'react'
import Lottie from 'lottie-react'
import plus from '../../icon/plus.png'
import reload from '../../icon/refresh.json'
import { supabase } from '../../supabaseClient'
import loading_animations from '../../icon/loading.json'

export default function GET_Order({ add_data}) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)

    async function fetchOrders() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('Order')
                .select('id, total_qty, sale_price, pm_type, created_at')
                .order('created_at', { ascending: false })
            if (error) throw error
            setOrders(data || [])
        } catch (err) {
            console.error('fetchOrders', err)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const [isOpen, setIsOpen] = useState(false);
    const lottieRef = useRef();

    const handleClick = () => {
        if (!isOpen) {
            lottieRef.current.playSegments([0, 56], true);
        } else {
            lottieRef.current.playSegments([0, 56], true);
        }
        setIsOpen(!isOpen);
    }

    useEffect(() => { fetchOrders() }, [])

    return (
        <div style={{ marginTop: 16 }}>
            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 0, gap: 8 }}>
                <div style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="button" onClick={() => add_data(true)} disabled={loading} style={{ padding: '4px 6px' }}>
                        <img src={plus} alt="Add" style={{ width: 12, marginRight: 8, color: '#ffffff' }} />
                        ເພີມສີນຄ້າ
                    </button>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button className="button" onClick={() => {
                            fetchOrders()
                            handleClick()
                        }} disabled={loading} style={{ padding: '0 8px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lottie
                                onClick={handleClick}
                                lottieRef={lottieRef}
                                className='menu-icon'
                                animationData={reload}
                                loop={false}
                                autoplay={true}
                                style={{ width: 15, marginTop: 6 }}
                            />
                            {loading ? 'Loading...' : 'Refresh'}

                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : orders.length === 0 ? (
                <p>No orders found.</p>
            ) : (
                <div className="deploy-list">
                    {orders.map(o => (
                        <div key={o.id} className="deploy-item clamp">
                            <div className="project">
                                <div style={{ fontWeight: 600 }}>Order #{o.id}</div>
                                <div style={{ color: '#999' }}>{o.pm_type || '-'}</div>
                            </div>

                            <div className="branch">
                                <div>
                                    <span className="commit" style={{ color: '#02be0b' }}>จำนวนรวม: </span>
                                    {o.total_qty ?? '-'}
                                </div>
                                <div>
                                    <span className="commit" style={{ color: '#be0202' }}>ยอดขาย: </span>
                                    {o.sale_price ? Number(o.sale_price).toLocaleString() + ' ₭' : '-'}
                                </div>
                            </div>

                            <div className="time last-column">
                                <div className="commit">{o.created_at ? new Date(o.created_at).toLocaleString() : '-'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 12 }}>
                <Lottie className='menu-icon laod-icon' animationData={loading_animations} loop={true} style={{ width: 40, display: 'none' }} />
            </div>
        </div>
    )
}
