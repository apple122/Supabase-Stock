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
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [orderItemsDetails, setOrderItemsDetails] = useState([])
    const [modalOpen, setModalOpen] = useState(false)

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
                .select('*')
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

    // Fetch and show full order details (order + items + product) in a modal
    const showOrderDetails = async (id) => {
        setLoading(true)
        try {
            const { data: orderData, error: orderError } = await supabase.from('Order').select('*').eq('id', id).single()
            if (orderError) throw orderError

            // Try to load related order items and product info
            const { data: itemsData, error: itemsError } = await supabase.from('OrderItem').select('*, Product(*)').eq('order_id', id)
            if (itemsError) throw itemsError

            setSelectedOrder(orderData)
            setOrderItemsDetails(itemsData || [])
            setModalOpen(true)
            console.log(itemsData)
        } catch (err) {
            console.error('showOrderDetails', err)
            swal('เกิดข้อผิดพลาดในการโหลดรายละเอียดคำสั่งซื้อ', { icon: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const closeModal = () => {
        setModalOpen(false)
        setSelectedOrder(null)
        setOrderItemsDetails([])
    }

    const printReceipt = () => {
        if (!selectedOrder) return
        const items = orderItemsDetails || []
        const total = items.reduce((s, it) => s + ((it.quantity || 0) * (it.price || it.unit_price || 0)), 0)
        const w = window.open('', '_blank')
                const html = `
                        <html>
                        <head>
                            <title>Receipt - Order #${selectedOrder.id}</title>
                            <style>
                                html,body{height:100%;margin:0}
                                body{font-family:Arial,Helvetica,sans-serif;padding:20px;background:#000;color:#fff; -webkit-print-color-adjust: exact; print-color-adjust: exact}
                                table{width:100%;border-collapse:collapse}
                                th,td{border:1px solid #444;padding:8px;text-align:left;color:#fff}
                                th{background:#111;color:#fff}
                                thead th{background:#111}
                                tfoot th{background:transparent}
                                @media print {
                                    body { background: #000 !important; color: #fff !important }
                                    th, td { -webkit-print-color-adjust: exact; print-color-adjust: exact }
                                }
                            </style>
                        </head>
                        <body>
                            <h2 style="color:#fff">Receipt - Order #${selectedOrder.id}</h2>
                            <p style="color:#fff">Created: ${selectedOrder.created_at || ''}</p>
                            <p style="color:#fff">Payment: ${selectedOrder.pm_type || ''}</p>
                            <table>
                                <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                ${items.map((it, idx) => {
                                        const prod = it.product || {}
                                        const qty = it.quantity || it.qty || 0
                                        const unit = it.price || it.unit_price || prod.price || 0
                                        const subtotal = qty * unit
                                        return `<tr><td>${idx+1}</td><td>${prod.name || prod.title || it.product_name || '-'}</td><td>${qty}</td><td>${unit}</td><td>${subtotal}</td></tr>`
                                }).join('')}
                                </tbody>
                                <tfoot><tr><th colspan="4">Total</th><th>${total}</th></tr></tfoot>
                            </table>
                        </body>
                        </html>
                `
        w.document.write(html)
        w.document.close()
        w.focus()
        w.print()
        // optionally close after printing
        // w.close()
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

        // If setting to delivered, prefer existing paid method; only ask if not already paid
        let pm_choice = order.pm_type || 'ຍັງບໍ່ຈ່າຍ'
        if (willSet) {
            const pmRaw = (order.pm_type || '').toString().trim().toLowerCase()
            const alreadyPaid = pmRaw.includes('ໂອນ') || pmRaw.includes('ຈ່າຍສົດ')
            if (!alreadyPaid) {
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
                // keep existing paid method
                pm_choice = order.pm_type
            }
        } else {
            // un-confirming delivery -> if already paid, keep existing method; otherwise mark unpaid
            const pmRawUn = (order.pm_type || '').toString().trim().toLowerCase()
            const alreadyPaidUn = pmRawUn.includes('ໂອນ') || pmRawUn.includes('ຈ່າຍສົດ')
            pm_choice = alreadyPaidUn ? order.pm_type : 'ຍັງບໍ່ຈ່າຍ'
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
            // First remove related OrderItem rows (if any)
            const { error: itemError } = await supabase.from('OrderItem').delete().eq('order_id', id)
            if (itemError) {
                console.error('cancelOrder delete OrderItem error:', itemError)
                swal('เกิดข้อผิดพลาดในการลบรายการสินค้า', { icon: 'error' })
                setOrders(snapshot)
                return
            }

            // Then remove the Order itself
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
                        <div key={o.id} className="deploy-item-order clamp" name='item-order' onClick={() => showOrderDetails(o.id)}>
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
                                    {(() => {
                                        const pmRaw = (o.pm_type || '').toString().trim()
                                        const pmLower = pmRaw.toLowerCase()
                                        let badgeColor = '#be0202' // default red = unpaid
                                        let label = 'ຍັງບໍ່ຈ່າຍ'
                                        if (pmRaw.length > 0) {
                                            if (pmLower.includes('ໂອນ')) {
                                                badgeColor = '#02be0b'
                                                label = 'ໂອນ'
                                            } else if (pmLower.includes('ຈ່າຍສົດ')) {
                                                badgeColor = '#02be0b'
                                                label = 'ຈ່າຍສົດ'
                                            }
                                        }
                                        return (
                                            <span
                                                onClick={async (e) => {
                                                    e.stopPropagation()
                                                    if (o.cancelled) return
                                                    try {
                                                        const cur = (o.pm_type || '').toString().trim().toLowerCase()
                                                        const isPaid = cur.includes('ໂອນ') || cur.includes('ຈ່າຍສົດ')
                                                        if (!isPaid) {
                                                            // choose a payment method to mark paid
                                                            const pm = await swal({
                                                                title: 'ເລືອກວິທີການຈ່າຍ',
                                                                text: 'ເລືອກວິທີການຈ່າຍເງິນສຳລັບຄຳສັ່ງນີ້',
                                                                icon: 'info',
                                                                buttons: {
                                                                    cancel: 'ຍົກເລີກ',
                                                                    transfer: { text: 'ໂອນ', value: 'ໂອນ' },
                                                                    cash: { text: 'ຈ່າຍສົດ', value: 'ຈ່າຍສົດ' }
                                                                }
                                                            })
                                                            if (!pm) return
                                                            // optimistic UI
                                                            setOrders(prev => prev.map(x => x.id === o.id ? { ...x, pm_type: pm } : x))
                                                            const { error } = await supabase.from('Order').update({ pm_type: pm }).eq('id', o.id)
                                                            if (error) {
                                                                console.error('update pm_type error', error)
                                                                swal('ເກີດຂໍ້ຜິດພາດໃນການອັບເດດ', { icon: 'error' })
                                                                // revert
                                                                setOrders(prev => prev.map(x => x.id === o.id ? { ...x, pm_type: o.pm_type } : x))
                                                            } else {
                                                                swal('ອັບເດດການຈ່າຍສຳເລັດ', { icon: 'success' })
                                                            }
                                                        } else {
                                                            // already paid -> offer cancel or change
                                                            const action = await swal({
                                                                title: 'ການຈ່າຍ',
                                                                text: 'ຕ້ອງການຍົກເລີກການຈ່າຍ ຫຼື ປ່ຽນວິທີການຈ່າຍ?',
                                                                icon: 'info',
                                                                buttons: {
                                                                    cancel: 'ຍົກເລີກ',
                                                                    cancelPayment: { text: 'ຍົກເລີກການຈ່າຍ', value: 'cancel' },
                                                                    change: { text: 'ປ່ຽນວິທີການຈ່າຍ', value: 'change' }
                                                                }
                                                            })
                                                            if (!action) return
                                                            if (action === 'cancel') {
                                                                const newPm = 'ຍັງບໍ່ຈ່າຍ'
                                                                setOrders(prev => prev.map(x => x.id === o.id ? { ...x, pm_type: newPm } : x))
                                                                const { error } = await supabase.from('Order').update({ pm_type: newPm }).eq('id', o.id)
                                                                if (error) {
                                                                    console.error('cancel pm_type error', error)
                                                                    swal('ເກີດຂໍ້ຜິດພາດໃນການຍົກເລີກການຈ່າຍ', { icon: 'error' })
                                                                    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, pm_type: o.pm_type } : x))
                                                                } else {
                                                                    swal('ຍົກເລີກການຈ່າຍສຳເລັດ', { icon: 'success' })
                                                                }
                                                            } else if (action === 'change') {
                                                                const pm = await swal({
                                                                    title: 'ເລືອກວິທີການຈ່າຍໃໝ່',
                                                                    icon: 'info',
                                                                    buttons: {
                                                                        cancel: 'ຍົກເລີກ',
                                                                        transfer: { text: 'ໂອນ', value: 'ໂອນ' },
                                                                        cash: { text: 'ຈ່າຍສົດ', value: 'ຈ່າຍສົດ' }
                                                                    }
                                                                })
                                                                if (!pm) return
                                                                setOrders(prev => prev.map(x => x.id === o.id ? { ...x, pm_type: pm } : x))
                                                                const { error } = await supabase.from('Order').update({ pm_type: pm }).eq('id', o.id)
                                                                if (error) {
                                                                    console.error('change pm_type error', error)
                                                                    swal('ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນວິທີການຈ່າຍ', { icon: 'error' })
                                                                    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, pm_type: o.pm_type } : x))
                                                                } else {
                                                                    swal('ປ່ຽນວິທີການຈ່າຍສຳເລັດ', { icon: 'success' })
                                                                }
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.error('payment badge action error', e)
                                                    }
                                                }}
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '2px 4px',
                                                    borderRadius: 6,
                                                    color: '#fff',
                                                    background: badgeColor,
                                                    cursor: o.cancelled ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {label}
                                            </span>
                                        )
                                    })()}
                                    /
                                    <button
                                        className='clamp'
                                        onClick={(e) => { e.stopPropagation(); toggleDelivery(o.id) }}
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
                                        onClick={(e) => { e.stopPropagation(); cancelOrder(o.id) }}
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

                {modalOpen && selectedOrder && (
                    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={closeModal}>
                        <div style={{background:'#292929',padding:20,width:'90%',maxWidth:800,borderRadius:8}} onClick={(e) => e.stopPropagation()}>
                            <h3>Order #{selectedOrder.id}</h3>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                                <div>Created: {selectedOrder.created_at}</div>
                                <div>Payment: {selectedOrder.pm_type || '-'}</div>
                            </div>
                            <table style={{width:'100%',borderCollapse:'collapse'}}>
                                <thead>
                                    <tr>
                                        <th style={{border:'1px solid #dddddd27',padding:6}}>#</th>
                                        <th style={{border:'1px solid #dddddd27',padding:6}}>Product</th>
                                        <th style={{border:'1px solid #dddddd27',padding:6}}>Qty</th>
                                        <th style={{border:'1px solid #dddddd27',padding:6}}>Unit</th>
                                        <th style={{border:'1px solid #dddddd27',padding:6}}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItemsDetails.map((it, idx) => {
                                        const prod = it.Product || {}
                                        const qty = it.quantity || it.qty || 0
                                        const unit = it.price || it.unit_price || prod.price || 0
                                        const subtotal = qty * unit
                                        return (
                                            <tr key={idx}>
                                                <td style={{border:'1px solid #dddddd27',padding:6}}>{idx+1}</td>
                                                <td style={{border:'1px solid #dddddd27',padding:6}}>{prod?.pro_name}</td>
                                                <td style={{border:'1px solid #dddddd27',padding:6}}>{qty}</td>
                                                <td style={{border:'1px solid #dddddd27',padding:6}}>{unit}</td>
                                                <td style={{border:'1px solid #dddddd27',padding:6}}>{subtotal}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
                                <button className='button' onClick={printReceipt}>Print</button>
                                <button className='button' onClick={closeModal}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

            <div style={{ marginTop: 12 }}>
                <Lottie className='menu-icon laod-icon' animationData={loading_animations} loop={true} style={{ width: 40, display: 'none' }} />
            </div>
        </div>
    )
}
