import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabaseClient'

export default function POST_Order({ cant_data }) {
    const [products, setProducts] = useState([])
    const [showProductForm, setShowProductForm] = useState(false)
    const [selectedId, setSelectedId] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [selectedQty, setSelectedQty] = useState(1)
    const [orderItems, setOrderItems] = useState([])
    const ddRef = useRef()
    const [pmType, setPmType] = useState('ຍັງບໍ່ທັນຈ່າຍ')
    const [promoUnitPrice, setPromoUnitPrice] = useState(null)
    const [recipientName, setRecipientName] = useState('')
    const [recipientPhone, setRecipientPhone] = useState('')
    const [recipientBranch, setRecipientBranch] = useState('')
    const [recipientAddress, setRecipientAddress] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data, error } = await supabase
                    .from('Product')
                    .select('id, pro_name, sell_price, quantity, pro_img')
                    .order('created_at', { ascending: false })
                    .eq('is_archived', true) // only fetch products that are not archived
                if (error) throw error
                setProducts(data || [])
            } catch (err) {
                console.error('fetchProducts', err)
            }
        }
        fetchProducts()
    }, [])

    function getProductById(id) {
        return products.find(p => String(p.id) === String(id))
    }

    // close dropdown on outside click
    useEffect(() => {
        function handleDoc(e) {
            if (ddRef.current && !ddRef.current.contains(e.target)) setDropdownOpen(false)
        }
        document.addEventListener('mousedown', handleDoc)
        return () => document.removeEventListener('mousedown', handleDoc)
    }, [ddRef])

    function add_product() {
        localStorage.setItem('Navigate', JSON.stringify(['Product', true]))
        window.location.reload()
    }

    function addProduct(prod, qty = 1) {
        if (!prod) return
        const stock = Number(prod.quantity) || 0
        setOrderItems(items => {
            const exist = items.find(i => String(i.id) === String(prod.id))
            if (exist) {
                const desired = (exist.qty || 0) + qty
                const newQty = desired > stock ? stock : desired
                return items.map(i => String(i.id) === String(prod.id) ? { ...i, qty: newQty } : i)
            }
            const initialQty = qty > stock ? stock : qty
            if (initialQty <= 0) return items
            return [...items, { id: prod.id, name: prod.pro_name, price: prod.sell_price || 0, qty: initialQty }]
        })
    }

    function changeQty(id, delta) {
        setOrderItems(items => {
            const prod = getProductById(id)
            const stock = Number(prod?.quantity) || 0
            return items.reduce((acc, it) => {
                if (String(it.id) === String(id)) {
                    let newQty = (it.qty || 0) + delta
                    if (newQty > stock) newQty = stock
                    if (newQty > 0) acc.push({ ...it, qty: newQty })
                    // if newQty <= 0 we drop the item
                } else acc.push(it)
                return acc
            }, [])
        })
    }

    function setItemQty(id, qty) {
        let n = Number(qty) || 0
        const prod = getProductById(id)
        const stock = Number(prod?.quantity) || 0
        if (n <= 0) {
            setOrderItems(items => items.filter(i => String(i.id) !== String(id)))
            return
        }
        if (n > stock) n = stock
        setOrderItems(items => items.map(i => String(i.id) === String(id) ? { ...i, qty: n } : i))
    }
    const totalQty = orderItems.reduce((s, it) => s + (Number(it.qty) || 0), 0)
    const promoUnit = Number(promoUnitPrice ?? 0) || 0
    const totalSale = orderItems.reduce((s, it) => {
        const unit = Number(it.price) || 0
        const qty = Number(it.qty) || 0
        const effective = promoUnit > 0 ? promoUnit : unit // if promo provided, use promo price per piece
        return s + effective * qty
    }, 0)

    // POST Order to Supabase
    async function submitOrder() {
        if (!orderItems || orderItems.length === 0) {
            alert('ไม่มีรายการสินค้า')
            return
        }

        setSubmitting(true)

        try {
            const addressArr = [
                recipientName,
                recipientPhone,
                recipientBranch,
                recipientAddress
            ]

            // 1️⃣ Insert Order ก่อน
            const { data: orderData, error: orderError } = await supabase
                .from('Order')
                .insert([{
                    pm_type: pmType,
                    user_id: localStorage.getItem('data_id'),
                    sale_price: totalSale,
                    total_qty: totalQty,
                    address: addressArr,
                    promotion: promoUnitPrice,
                    readme: 'ຍັງບໍ່ທັນຈັດສົ່ງ',
                }])
                .select()
                .single()

            if (orderError) throw orderError

            const orderId = orderData.id

            // 2️⃣ เตรียม OrderItem หลายแถว
            const itemsPayload = orderItems.map(item => ({
                order_id: orderId,
                pro_id: item.id,
                qty: item.qty,
                price: promoUnit > 0 ? promoUnit : item.price
            }))

            // 3️⃣ Insert OrderItem
            const { error: itemError } = await supabase
                .from('OrderItem')
                .insert(itemsPayload)

            if (itemError) throw itemError

            // 4️⃣ Update Product quantities in DB (decrement by ordered qty)
            const updatePromises = orderItems.map(async (it) => {
                const prod = products.find(p => String(p.id) === String(it.id))
                const currentStock = Number(prod?.quantity) || 0
                const newQty = Math.max(currentStock - Number(it.qty || 0), 0)
                const { error: updErr } = await supabase
                    .from('Product')
                    .update({ quantity: newQty })
                    .eq('id', it.id)
                if (updErr) throw updErr
                return { id: it.id, newQty }
            })

            await Promise.all(updatePromises)

            // update local products state to reflect new quantities
            setProducts(prev => prev.map(p => {
                const match = orderItems.find(it => String(it.id) === String(p.id))
                if (!match) return p
                return { ...p, quantity: Math.max(Number(p.quantity || 0) - Number(match.qty || 0), 0) }
            }))

            alert('ສ້າງອໍເດີ້ສຳເລັດ!')
            cant_data(false)

            // reset
            setOrderItems([])
            setRecipientName('')
            setRecipientPhone('')
            setRecipientBranch('')
            setRecipientAddress('')
            setPromoUnitPrice('')
            setPmType('ຍັງບໍ່ທັນຈ່າຍ')

        } catch (err) {
            console.error('submitOrder', err)
            alert('ເກີດຂໍ້ຜິດພາດ: ' + (err.message || JSON.stringify(err)))
        } finally {
            setSubmitting(false)
        }
    }

    function ANavigate ()  {
        cant_data(false)
        localStorage.setItem('Navigate', JSON.stringify(['Order', false]))
    } 

    return (
        <div style={{ marginTop: 16, zIndex: 1 }}>
            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                <button className="button" onClick={ANavigate} style={{ padding: '2px 4px' }}>
                    <span> {'<'} ຍ້ອນກັບ </span>
                </button>

                <div className="project">
                    <span style={{ fontSize: '14px' }}>ລາຍການຂາຍ / ບັນທືຂໍ້ມູນສິນຄ້າຂາຍ</span>
                </div>

                <div className="branch">
                    <div className="commit"> </div>
                </div>
                <div className="status ready"> </div>
                <div className="time">
                    <div className="commit" style={{ display: 'flex', right: '-50%' }}>

                    </div>
                </div>
            </div>

            {/* Select product to order:  */}
            <div className='gid-colum-select' style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }} >
                <label className='label-absolute' style={{ fontSize: 12, color: '#999' }}>ເລືອກສິນຄ້າ ແລະ ຈຳນວນ</label>
                <div className="grid-colum-2" style={{ marginBottom: 2, gap: 8, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <div style={{ position: 'relative' }} ref={ddRef}>
                            <button type="button" className="button" onClick={() => setDropdownOpen(s => !s)} style={{ width: '100%', textAlign: 'left', padding: 8, borderRadius: 6 }}>
                                {selectedId ? (products.find(p => String(p.id) === String(selectedId))?.pro_name || 'ເລືອກສິນຄ້າ') : '-- ເລືອກສິນຄ້າ --'}
                            </button>
                            {dropdownOpen && (
                                <ul style={{ position: 'absolute', zIndex: 50, left: 0, right: 0, maxHeight: 260, overflow: 'auto', margin: 0, padding: 8, listStyle: 'none', background: '#0f0f0f', border: '1px solid #222', borderRadius: 6 }}>
                                    {products.map(p => (
                                        <li className='hover' key={p.id} onClick={() => { addProduct(p, 1); setDropdownOpen(false) }} style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 6 }}>
                                            <img src={p.pro_img} alt={p.pro_name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #222' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{p.pro_name}</div>
                                                <div style={{ fontSize: 12, color: '#999' }}>{p.sell_price ? Number(p.sell_price).toLocaleString() + ' ₭' : '-'} • สต็อก {p.quantity ?? '-'}</div>
                                            </div>
                                        </li>
                                    ))}
                                    <li className='hover' onClick={add_product} style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 6 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}> </div>
                                            <div style={{ fontSize: 12, color: '#999' }}> + ເພີມລາຍການສິນຄ້າໃໝ່</div>
                                        </div>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 style={{ margin: '6px 0' }}>ລາຍການສີນຄ້າ</h4>
                    {orderItems.length === 0 ? <div style={{ color: '#999' }}>ຍັງບໍ່ມີລາຍການ</div> : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {orderItems.map(item => (
                                <div key={item.id} className="order-item">
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div className="thumb">
                                            <img src={products.find(p => String(p.id) === String(item.id))?.pro_img} alt={item.name} />
                                        </div>

                                        <div className="meta">
                                            <div className="meta-title">{item.name}</div>
                                            <div className="meta-price">{Number(item.price).toLocaleString()} ₭</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <div className='flex-display' style={{ gap: 8, alignItems: 'center' }}>
                                            <div className="subtotal" style={{ fontSize: 24 }}>{(item.qty * item.price).toLocaleString()} ₭</div>
                                            <div className="qty" style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                                                <button type="button" className="button" style={{ padding: 1, height: 20, width: 20 }} onClick={() => changeQty(item.id, -1)}><span>-</span></button>
                                                <input
                                                    type=""
                                                    min={1}
                                                    max={products.find(p => String(p.id) === String(item.id))?.quantity || undefined}
                                                    value={item.qty}
                                                    style={{ padding: 1, height: 20, textAlign: 'center' }}
                                                    onChange={(e) => setItemQty(item.id, e.target.value)}
                                                />
                                                <button type="button" className="button" style={{ padding: 1, height: 20, width: 20 }} onClick={() => changeQty(item.id, 1)}><span>+</span></button>
                                            </div>
                                        </div>

                                        <div style={{ marginLeft: 20 }}>
                                            <button className="button" onClick={() => setOrderItems(items => items.filter(i => i.id !== item.id))}>ลบ</button>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Input for customer info, payment method, etc. can go here */}
            <div className='form-order' style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ width: 120, color: '#999' }}>ວິທີ່ສຳລະ</label>
                    <select
                        value={pmType}
                        onChange={e => setPmType(e.target.value)}
                        style={{ padding: 6, background: '#0f0f0f', color: '#fff', border: '1px solid #222' }}
                    >
                        <option value="ຍັງບໍ່ທັນຈ່າຍ" style={{ background: '#0f0f0f', color: '#fff' }}>ຍັງບໍ່ທັນຈ່າຍ</option>
                        <option value="ໂອນ" style={{ background: '#0f0f0f', color: '#fff' }}>ໂອນ</option>
                        <option value="ຈ່າຍສົດ" style={{ background: '#0f0f0f', color: '#fff' }}>ຈ່າຍສົດ</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ width: 120, color: '#999' }}>ຈຳນວນລວມ</label>
                    <input value={totalQty} readOnly style={{ padding: 6, width: 120, textAlign: 'center' }} />
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ width: 120, color: '#999' }}>ໂປຣ/ລາຄາຕໍ່ຊີ້ນ</label>
                    <input
                        type="number"
                        min={0}
                        placeholder="ລາຄາໂປຣຕໍ່ຊີ້ນ (ບໍ່ບັງຄັບ, ຖ້າປ່ອນ 0 ຫຼື ປ່ອນຫວ່າງແທນ, ລາຄາຈະເປັນລາຄາປົກການ)"
                        value={promoUnitPrice}
                        onChange={e => setPromoUnitPrice(e.target.value)}
                        style={{ padding: 6, width: 180, textAlign: 'right' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ width: 120, color: '#999' }}>ເງີນລວມ</label>
                    <input value={totalSale ? Number(totalSale).toLocaleString() + ' ₭' : '0 ₭'} readOnly style={{ padding: 6, flex: 1, textAlign: 'right' }} />
                </div>


                <fieldset style={{ border: '1px solid #222', padding: 8, borderRadius: 6 }}>
                    <legend style={{ color: '#999' }}>ຂໍ້ມູນການຈັດສົ່ງ</legend>
                    <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={{ width: 120, color: '#999' }}>ຊື່ຜູ້ຮັບ</label>
                            <input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="ຊື່" style={{ padding: 6, flex: 1 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={{ width: 120, color: '#999' }}>ເບີໂທ</label>
                            <input value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} placeholder="ເບີໂທ" style={{ padding: 6, flex: 1 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label style={{ width: 120, color: '#999' }}>ສົ່ງສາຂາ</label>
                            <input value={recipientBranch} onChange={e => setRecipientBranch(e.target.value)} placeholder="ສາຂາ" style={{ padding: 6, flex: 1 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <label style={{ width: 120, color: '#999' }}>ທີ່ຢູ່</label>
                            <textarea value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)} placeholder="ທີ່ຢູ່ສຳລັບຈັດສົ່ງ" style={{ padding: 6, flex: 1, minHeight: 64 }} />
                        </div>
                    </div>
                </fieldset>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                        type="button"
                        className="button"
                        onClick={submitOrder}
                        disabled={submitting || orderItems.length === 0}
                        style={{ padding: '8px 12px' }}
                    >
                        {submitting ? 'ກຳລັງສ້າງອໍເດີ້...' : 'ບັນທຶກ / ສ້າງອໍເດີ້'}
                    </button>
                </div>
            </div>
        </div>
    )
}
