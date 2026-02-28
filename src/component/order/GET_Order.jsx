import React, { useEffect, useState, useRef } from 'react'
import Lottie from 'lottie-react'
import plus from '../../icon/plus.png'
import reload from '../../icon/refresh.json'
import { supabase } from '../../supabaseClient'
import loading_animations from '../../icon/loading.json'
import swal from 'sweetalert'

export default function GET_Order({ add_data }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)

    const toBool = (v) => {
        if (v === true) return true
        if (v === false) return false
        if (v == null) return false
        const s = String(v).toLowerCase()
        return ['true', 't', '1', 'yes', 'y'].includes(s)
    }

    async function fetchOrders() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('Order')
                .select('id, total_qty, sale_price, pm_type, created_at, delivery_confirmed')
                .order('created_at', { ascending: false })
            if (error) throw error
            // Normalize status fields locally. If the DB already has columns
            // like `transfer_confirmed`, `delivery_confirmed`, `cancelled`,
            // they will be used; otherwise defaults are false.
            const normalized = (data || []).map(o => ({
                ...o,
                transferConfirmed: toBool(o.transfer_confirmed ?? o.transferConfirmed),
                deliveryConfirmed: toBool(o.delivery_confirmed ?? o.deliveryConfirmed),
                cancelled: toBool(o.cancelled),
            }))
            setOrders(normalized)
        } catch (err) {
            console.error('fetchOrders', err)
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    // Handlers to toggle statuses (optimistic UI). They also attempt
    // to persist to Supabase using common column names if present.

    const toggleDelivery = async (id) => {
        const order = orders.find(o => o.id === id)
        if (!order) return

        const willSet = !order.deliveryConfirmed
        const title = willSet ? 'ຍຶນຍັນການຈັດສົ່ງ?' : 'ຍຶນຍັນການຍົກເລີກການຈັດສົ່ງ?'
        const text = willSet
            ? 'ເຈົ້າຕ້ອຍຢືນຢັນວ່າຄຳສັ່ງນີ້ "ສົ່ງແລ້ວ" ຫຼືບໍ່?'
            : 'ເຈົ້າຕ້ອຍຕ້ອງການຍົກເລີກສະຖານະ "ສົ່ງແລ້ວ" ສຳລັບຄຳສັ່ງນີ້ຫຼືບໍ່?'

        const confirm = await swal({
            title,
            text,
            icon: 'warning',
            buttons: ['ຍົກເລີກ', 'ຢືນຢັນ'],
            dangerMode: false,
        })

        if (!confirm) return

        // If setting to delivered, ask for payment method (pm_type)
        let pm_choice = order.pm_type || 'ຍັງບໍ່ຈ່າຍ'
        if (willSet) {
            const pm = await swal({
                title: 'ເລືອກວິທີການຈ່າຍເງິນ',
                text: 'ກະລຸນາເລືອກວິທີການຈ່າຍເງິນສຳລັບຄຳສັ່ງນີ້',
                icon: 'info',
                buttons: {
                    cancel: 'ຍົກເລີກ',
                    transfer: { text: 'ໂອນ', value: 'ໂອນ' },
                    cash: { text: 'ຈ່າຍສົດ', value: 'ຈ່າຍສົດ' }
                }
            })

            if (!pm) return
            pm_choice = pm
        } else {
            // un-confirming delivery -> mark payment as not paid
            pm_choice = 'ຍັງບໍ່ຈ່າຍ'
        }

        // optimistic UI update: set delivery state and pm_type
        setOrders(prev => prev.map(o => o.id === id ? { ...o, deliveryConfirmed: willSet, pm_type: pm_choice } : o))
        try {
            const { error } = await supabase.from('Order').update({ delivery_confirmed: willSet, pm_type: pm_choice }).eq('id', id)
            if (error) {
                console.error('toggleDelivery error:', error)
                swal('ເກີດຂໍ້ຜິດພາດ', { icon: 'error' })
            } else {
                swal(willSet ? `ບັນທືກການຈ່າຍ (${pm_choice})` : 'ຍົກເລີກສະຖານະສົ່ງແລ້ວ', { icon: 'success' })
                // fetchOrders()
            }
        } catch (err) {
            console.error('toggleDelivery', err)
        }
    }

    const cancelOrder = async (id) => {
        const order = orders.find(o => o.id === id)
        if (!order) return

        const confirm = await swal({
            title: 'ຍືນຍັນຄຳສັ່ງຍົກເລີກອໍເດີ້?',
            text: 'ການຍົກເລິກຈະບໍ່ສາມາດກູ້ຄືນໄດ້ — ກະລຸນາຍືນຍັນວ່າຕ້ອງການຍົກເລິກຄຳສັ່ງນີ້?',
            icon: 'warning',
            buttons: ['ຍົກເລີກ', 'ລົບ'],
            dangerMode: true,
        })

        if (!confirm) return

        const snapshot = orders.slice()
        // optimistic remove from UI
        setOrders(prev => prev.filter(o => o.id !== id))

        try {
            const { error } = await supabase.from('Order').delete().eq('id', id)
            if (error) {
                console.error('cancelOrder error:', error)
                swal('เกิดข้อผิดพลาดในการลบ', { icon: 'error' })
                setOrders(snapshot)
            } else {
                swal('ลบคำสั่งซื้อเรียบร้อย', { icon: 'success' })
            }
        } catch (err) {
            console.error('cancelOrder', err)
            swal('เกิดข้อผิดพลาด', { icon: 'error' })
            setOrders(snapshot)
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
                        <div key={o.id} className="deploy-item-order clamp">
                            <div className='first-column' style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
                                <div className="project">
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Order #{o.id}</div>
                                        <div style={{ color: '#999' }}>{o.pm_type || '-'}</div>
                                    </div>
                                </div>

                                <div className="branch">
                                    <div>
                                        <div>
                                            <span className="commit" style={{ color: '#02be0b' }}>จำนวนรวม: </span>
                                            {o.total_qty ?? '-'}
                                        </div>
                                        <div>
                                            <span className="commit" style={{ color: '#be0202' }}>ยอดขาย: </span>
                                            {o.sale_price ? Number(o.sale_price).toLocaleString() + ' ₭' : '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='first-column' style={{ justifyContent: 'flex-end', gap: 60, alignItems: 'center' }}>
                                <div className="time ">
                                    <div className="commit">{o.created_at ? new Date(o.created_at).toLocaleString() : '-'}</div>
                                </div>
                                <div className="actions" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '2px 4px',
                                        borderRadius: 6,
                                        color: '#fff',

                                        background: ((o.pm_type || '').toString().toLowerCase().includes('ໂອນ') || (o.pm_type || '').toString().toLowerCase().includes('ຈ່າຍສົດ')) ? '#02be0b' : '#be0202'
                                    }}>
                                        {((o.pm_type || '').toString().trim().length > 0)
                                            ? ((o.pm_type || '').toString().toLowerCase().includes('ໂອນ') ? 'ໂອນ' : ((o.pm_type || '').toString().toLowerCase().includes('ຈ່າຍສົດ') ? 'ຈ່າຍສົດ' : 'ຍັງບໍ່ຈ່າຍ'))
                                            : 'ຍັງບໍ່ຈ່າຍ'
                                        }
                                    </span>
                                    /
                                    <button
                                        className='clamp'
                                        onClick={() => toggleDelivery(o.id)}
                                        disabled={o.cancelled}
                                        style={{
                                            background: o.deliveryConfirmed ? '#02be0b' : '#f0ad4e',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '2px 4px',
                                            borderRadius: 6,
                                            cursor: o.cancelled ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {o.deliveryConfirmed ? 'ສົ່ງແລ້ວ' : 'ຍັງບໍ່ສົ່ງ'}
                                    </button>
                                    /
                                    <button
                                        className='clamp'
                                        onClick={() => cancelOrder(o.id)}
                                        disabled={o.cancelled}
                                        style={{
                                            background: '#be0202',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '2px 4px',
                                            borderRadius: 6,
                                            cursor: o.cancelled ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        ຍົກເລີກ
                                    </button>
                                </div>
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
