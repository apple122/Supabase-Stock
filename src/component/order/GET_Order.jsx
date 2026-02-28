import React, { useEffect, useState, useRef } from 'react'
import Lottie from 'lottie-react'
import plus from '../../icon/plus.png'
import reload from '../../icon/refresh.json'
import { supabase } from '../../supabaseClient'
import loading_animations from '../../icon/loading.json'
import swal from 'sweetalert'
import OrderRow from './OrderRow'
import OrderModal from './OrderModal'


export default function GET_Order({ add_data }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(false)
    const [orderItemsDetails, setOrderItemsDetails] = useState(null)
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
                swal('ເກິດຂໍ້ຜິດພາດໃນການຍົກເລີກລາຍການສິນຄ້າ', { icon: 'error' })
                setOrders(snapshot)
                return
            }

            // Then remove the Order itself
            const { error } = await supabase.from('Order').delete().eq('id', id)
            if (error) {
                console.error('cancelOrder error:', error)
                swal('ເກິດຂໍ້ຜິດພາດໃນການຍົກເລີກ', { icon: 'error' })
                setOrders(snapshot)
            } else {
                swal('ຍົກເລີກອໍເດີ້ສຳເລັດ', { icon: 'success' })
            }
        } catch (err) {
            console.error('cancelOrder', err)
            swal('ເກິດຂໍ້ຜິດພາດ', { icon: 'error' })
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
                    <button className="button clamp" onClick={() => add_data(true)} disabled={loading} style={{ padding: '6px 6px', display: 'flex', alignItems: 'center' }}>
                        <img src={plus} alt="Add" style={{ width: 12, marginRight: 8, color: '#ffffff' }} />
                        ເພີມສີນຄ້າ
                    </button>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button className="button clamp btn-reload" onClick={() => {
                            fetchOrders()
                            handleClick()
                        }} disabled={loading} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
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

                        <button className="button clamp" onClick={async () => {
                            // export Order table only with custom Thai headers
                            setLoading(true)

                            try {
                                const { data, error } = await supabase.from('OrderItem').select('*, pro_id(*), order_id(*, user_id(*))').order('created_at', { ascending: false })
                                if (error) throw error

                                const formatAddr = (raw) => {
                                    if (!raw) return ''
                                    const addr = typeof raw === 'string'
                                        ? (() => { try { return JSON.parse(raw) } catch (e) { return raw } })()
                                        : raw
                                    if (typeof addr !== 'object') return String(addr)
                                    return [
                                        addr[0],
                                        addr[1],
                                        addr[2],
                                        addr[3],
                                    ].filter(Boolean).join(', ')
                                }

                                const rows = (data || []).map(o => (

                                    {
                                        'ສີນຄ້າ': o.pro_id?.pro_name ?? '',
                                        'ລະຫັດສິນຄ້າ': o.pro_id?.sku ?? '',
                                        'ການຊຳລະ': o.order_id?.pm_type ?? '',
                                        'ລາຄາຈີງ': o.pro_id?.sell_price ?? '',
                                        'ຈຳນວນ': o.qty ?? '',
                                        'ໂປຣໂມດຊັ້ນ': o.order_id?.promotion ?? '',
                                        'ຍອດລວມ': o.order_id?.sale_price ?? '',
                                        'ທີ່ຢູ່': formatAddr(o.order_id?.address ?? ''),
                                        'ຈັດສົ່ງ': toBool(o.order_id?.delivery_confirmed ?? o.order_id?.deliveryConfirmed) ? 'ສົງແລ້ວ' : 'ຍັງບໍ່ທັນສົງ',
                                        'ເວລາ': o.created_at ?? '',
                                        'ຜູ້ສ້າງ': o.order_id?.user_id?.fullname ?? '',
                                    }
                                ))

                                console.log('exporting orders', rows)

                                try {
                                    const XLSXmod = await import('xlsx')
                                    const XLSX = XLSXmod.default || XLSXmod
                                    const wb = XLSX.utils.book_new()
                                    const ws = XLSX.utils.json_to_sheet(rows)
                                    XLSX.utils.book_append_sheet(wb, ws, 'Order')
                                    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
                                    const blob = new Blob([wbout], { type: 'application/octet-stream' })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `order_export_${Date.now()}.xlsx`
                                    document.body.appendChild(a)
                                    a.click()
                                    a.remove()
                                    URL.revokeObjectURL(url)
                                    swal('ເລີມໂຫຼດໄຟ່ລາຍການຂ່າຍ Order (Excel)', { icon: 'success' })
                                } catch (e) {
                                    console.warn('xlsx not available, fallback to JSON', e)
                                    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `order_export_${Date.now()}.json`
                                    document.body.appendChild(a)
                                    a.click()
                                    a.remove()
                                    URL.revokeObjectURL(url)
                                    swal('ເລີມໂຫຼດໄຟ່ລາຍການຂ່າຍ (JSON)', { icon: 'info' })
                                }
                            } catch (err) {
                                console.error('exportOrders error', err)
                                swal('ເກີດຂໍ້ຜິດພາດໃນຂະນະສົ່ງອອກຕາຕະລາງ Order', { icon: 'error' })
                            } finally {
                                setLoading(false)
                            }
                        }} disabled={loading} style={{ padding: '4px 8px', marginTop: 8, marginLeft: 8 }}>
                            Export Orders
                        </button>
                    </div>
                </div>
            </div>

            {
                loading ? (
                    <p>Loading...</p>
                ) : orders.length === 0 ? (
                    <p>No orders found.</p>
                ) : (
                    <div className="deploy-list">
                        {orders.map(o => (
                            <OrderRow
                                key={o.id}
                                order={o}
                                onRowClick={async (id) => {
                                    // fetch order details and open modal
                                    setLoading(true)
                                    try {
                                        const { data: orderData, error: orderError } = await supabase.from('Order').select('*').eq('id', id).single()
                                        if (orderError) throw orderError

                                        // Try joined select first (convenient when FK exists).
                                        let itemsWithProduct = null
                                        try {
                                            const { data: itemsData, error: itemsError } = await supabase.from('OrderItem').select('*, pro_id(*)').eq('order_id', id)
                                            if (itemsError) throw itemsError
                                            itemsWithProduct = itemsData || []
                                        } catch (joinErr) {
                                            // If Supabase schema lacks a FK relationship, the joined select will fail.
                                            // Fallback: fetch items, then fetch products separately and merge.
                                            console.warn('joined select failed, falling back to separate queries', joinErr)
                                            const { data: itemsPlain, error: itemsPlainErr } = await supabase.from('OrderItem').select('*').eq('order_id', id)
                                            if (itemsPlainErr) throw itemsPlainErr
                                            const productIds = Array.from(new Set((itemsPlain || []).map(it => it.product_id).filter(Boolean)))
                                            let products = []
                                            if (productIds.length > 0) {
                                                const { data: productsData, error: productsErr } = await supabase.from('Product').select('*').in('id', productIds)
                                                if (productsErr) throw productsErr
                                                products = productsData || []
                                            }
                                            const prodMap = new Map((products || []).map(p => [p.id, p]))
                                            itemsWithProduct = (itemsPlain || []).map(it => ({ ...it, product: prodMap.get(it.product_id) || null }))
                                        }

                                        // extract products from items (dedupe by id)
                                        const products = (itemsWithProduct || [])
                                            .map(i => i.product)
                                            .filter(Boolean)
                                        const prodMap = new Map()
                                        products.forEach(p => { if (p && p.id != null) prodMap.set(p.id, p) })
                                        const uniqueProducts = Array.from(prodMap.values())

                                        setOrderItemsDetails({ items: itemsWithProduct || [], order: orderData, products: uniqueProducts })
                                        setModalOpen(true)
                                    } catch (err) {
                                        console.error('showOrderDetails', err)
                                        swal('ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນການສັ່ງຊື້', { icon: 'error' })
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                                onPaymentClick={async (ord) => {
                                    if (ord.cancelled) return
                                    try {
                                        const cur = (ord.pm_type || '').toString().trim().toLowerCase()
                                        const isPaid = cur.includes('ໂອນ') || cur.includes('ຈ່າຍສົດ')
                                        if (!isPaid) {
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
                                            setOrders(prev => prev.map(x => x.id === ord.id ? { ...x, pm_type: pm } : x))
                                            const { error } = await supabase.from('Order').update({ pm_type: pm }).eq('id', ord.id)
                                            if (error) {
                                                console.error('update pm_type error', error)
                                                swal('ເກີດຂໍ້ຜິດພາດໃນການອັບເດດ', { icon: 'error' })
                                                setOrders(prev => prev.map(x => x.id === ord.id ? { ...x, pm_type: ord.pm_type } : x))
                                            } else {
                                                swal('ອັບເດດການຈ່າຍສຳເລັດ', { icon: 'success' })
                                            }
                                        } else {
                                            const action = await swal({
                                                title: 'ການຈ່າຍ',
                                                text: 'ຕ້ອງການຍົກເລີກການຈ່າຍ ຫຼື ປ່ຽນວິທີການຈ່າຍ?',
                                                icon: 'info',
                                                buttons: {
                                                    cancel: 'ຍົກເລີກ',
                                                    cancelPayment: { text: 'ຍັງບໍ່ຈ່າຍ', value: 'cancel' },
                                                    change: { text: 'ປ່ຽນວິທີການຈ່າຍ', value: 'change' }
                                                }
                                            })
                                            if (!action) return
                                            if (action === 'cancel') {
                                                const newPm = 'ຍັງບໍ່ຈ່າຍ'
                                                setOrders(prev => prev.map(x => x.id === ord.id ? { ...x, pm_type: newPm } : x))
                                                const { error } = await supabase.from('Order').update({ pm_type: newPm }).eq('id', ord.id)
                                                if (error) {
                                                    console.error('cancel pm_type error', error)
                                                    swal('ເກີດຂໍ້ຜິດພາດໃນການຍົກເລີກ', { icon: 'error' })
                                                    setOrders(prev => prev.map(x => x.id === ord.id ? { ...x, pm_type: ord.pm_type } : x))
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
                                                setOrders(prev => prev.map(x => x.id === ord.id ? { ...x, pm_type: pm } : x))
                                                const { error } = await supabase.from('Order').update({ pm_type: pm }).eq('id', ord.id)
                                                if (error) {
                                                    console.error('change pm_type error', error)
                                                    swal('ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນວິທີການຈ່າຍ', { icon: 'error' })
                                                    setOrders(prev => prev.map(x => x.id === ord.id ? { ...x, pm_type: ord.pm_type } : x))
                                                } else {
                                                    swal('ປ່ຽນວິທີການຈ່າຍສຳເລັດ', { icon: 'success' })
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        console.error('payment badge action error', e)
                                    }
                                }}
                                onToggleDelivery={toggleDelivery}
                                onCancel={cancelOrder}
                            />
                        ))}
                    </div>
                )
            }

            <div style={{ marginTop: 12 }}>
                <Lottie className='menu-icon laod-icon' animationData={loading_animations} loop={true} style={{ width: 40, display: 'none' }} />
            </div>
            <OrderModal
                isOpen={modalOpen}
                order={orderItemsDetails?.order || null}
                items={orderItemsDetails?.items || []}
                products={orderItemsDetails?.products || []}
                onClose={() => { setModalOpen(false); setOrderItemsDetails(null); }}
            />
        </div >
    )
}
