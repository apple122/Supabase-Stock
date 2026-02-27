import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../supabaseClient'

export default function POST_Order() {
    const [products, setProducts] = useState([])
    const [selectedId, setSelectedId] = useState('')
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [selectedQty, setSelectedQty] = useState(1)
    const [orderItems, setOrderItems] = useState([])
    const ddRef = useRef()

    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data, error } = await supabase
                    .from('Product')
                    .select('id, pro_name, sell_price, quantity, pro_img')
                    .order('created_at', { ascending: false })
                if (error) throw error
                setProducts(data || [])
            } catch (err) {
                console.error('fetchProducts', err)
            }
        }
        fetchProducts()
    }, [])

    // close dropdown on outside click
    useEffect(() => {
        function handleDoc(e) {
            if (ddRef.current && !ddRef.current.contains(e.target)) setDropdownOpen(false)
        }
        document.addEventListener('mousedown', handleDoc)
        return () => document.removeEventListener('mousedown', handleDoc)
    }, [ddRef])

    function addProduct(prod, qty = 1) {
        if (!prod) return
        setOrderItems(items => {
            const exist = items.find(i => String(i.id) === String(prod.id))
            if (exist) {
                return items.map(i => i.id === prod.id ? { ...i, qty: i.qty + qty } : i)
            }
            return [...items, { id: prod.id, name: prod.pro_name, price: prod.sell_price || 0, qty }]
        })
    }

    function changeQty(id, delta) {
        setOrderItems(items => {
            return items.reduce((acc, it) => {
                if (String(it.id) === String(id)) {
                    const newQty = (it.qty || 0) + delta
                    if (newQty > 0) acc.push({ ...it, qty: newQty })
                    // if newQty <= 0 we drop the item
                } else acc.push(it)
                return acc
            }, [])
        })
    }

    function setItemQty(id, qty) {
        const n = Number(qty) || 0
        if (n <= 0) {
            setOrderItems(items => items.filter(i => String(i.id) !== String(id)))
            return
        }
        setOrderItems(items => items.map(i => i.id === id ? { ...i, qty: n } : i))
    }
    return (
        <div style={{ marginTop: 16, zIndex: 1 }}>
            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                <button className="button" style={{ padding: '2px 4px' }}>
                    <span> {'<'} ຍ້ອນກັບ </span>
                </button>

                <div className="project">
                    <span style={{ fontSize: '14px' }}>ສະຕ໋ອກສີນຄ້າ / ບັນທືຂໍ້ມູນສິນຄ້າ</span>
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

            <form style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }} onSubmit={(e) => e.preventDefault()}>
                <div className="grid-colum-2" style={{ marginBottom: 2, gap: 8, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                        <label style={{ fontSize: 12, color: '#aaa' }}>เลือกสินค้า</label>
                        <div style={{ position: 'relative' }} ref={ddRef}>
                            <button type="button" className="button" onClick={() => setDropdownOpen(s => !s)} style={{ width: '100%', textAlign: 'left', padding: 8, borderRadius: 6 }}>
                                {selectedId ? (products.find(p => String(p.id) === String(selectedId))?.pro_name || 'เลือกสินค้า') : '-- เลือกสินค้า --'}
                            </button>
                            {dropdownOpen && (
                                <ul style={{ position: 'absolute', zIndex: 50, left: 0, right: 0, maxHeight: 260, overflow: 'auto', margin: 0, padding: 8, listStyle: 'none', background: '#0f0f0f', border: '1px solid #222', borderRadius: 6 }}>
                                    {products.map(p => (
                                        <li key={p.id} onClick={() => { addProduct(p, 1); setDropdownOpen(false) }} style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 6 }}>
                                            <img src={p.pro_img} alt={p.pro_name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #222' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{p.pro_name}</div>
                                                <div style={{ fontSize: 12, color: '#999' }}>{p.sell_price ? Number(p.sell_price).toLocaleString() + ' ₭' : '-'} • สต็อก {p.quantity ?? '-'}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 8 }}>
                    <h4 style={{ margin: '6px 0' }}>รายการสินค้า</h4>
                    {orderItems.length === 0 ? <div style={{ color: '#999' }}>ยังไม่มีรายการ</div> : (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {orderItems.map(item => (
                                <div key={item.id} className="order-item">
                                    <div className="thumb">
                                        <img src={products.find(p => String(p.id) === String(item.id))?.pro_img} alt={item.name} />
                                    </div>

                                    <div className="meta">
                                        <div className="meta-title">{item.name}</div>
                                        <div className="meta-price">{Number(item.price).toLocaleString()} ₭</div>
                                    </div>

                                    <div className="qty" style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                                        <button type="button" className="button" style={{ padding: 4, height: 30, width: 30 }} onClick={() => changeQty(item.id, -1)}>-</button>
                                        <input value={item.qty} style={{ padding: 4, height: 30 }} onChange={(e) => setItemQty(item.id, e.target.value)} />
                                        <button type="button" className="button" style={{ padding: 4, height: 30, width: 30 }} onClick={() => changeQty(item.id, 1)}>+</button>
                                    </div>

                                    <div className="summary">
                                        <div className="subtotal">{(item.qty * item.price).toLocaleString()} ₭</div>
                                    </div>

                                    <div className="summary">
                                        <button className="button" onClick={() => setOrderItems(items => items.filter(i => i.id !== item.id))}>ลบ</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>

        </div>
    )
}
