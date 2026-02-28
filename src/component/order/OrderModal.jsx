import React, { useRef } from 'react'

function renderValue(v) {
    if (v === null || v === undefined) return '-'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
}

export default function OrderModal({ order, items = [], products = [], onClose }) {
    const printRef = useRef()
    if (!order) return null

    const handlePrint = () => {
        if (!printRef.current) return
        const printHtml = printRef.current.innerHTML

        // create print-only container
        const container = document.createElement('div')
        container.className = 'print-only'
        container.style.boxSizing = 'border-box'
        container.innerHTML = printHtml
        document.body.appendChild(container)

        // temporary print styles to hide other content
        const style = document.createElement('style')
        style.id = 'print-only-style'
        style.innerHTML = `@media print { body *{visibility:hidden} .print-only, .print-only *{visibility:visible} .print-only{position:fixed;left:0;top:0;width:100%} }`
        document.head.appendChild(style)

        const cleanup = () => {
            try { document.head.removeChild(style) } catch (e) { }
            try { document.body.removeChild(container) } catch (e) { }
            window.removeEventListener('afterprint', cleanup)
        }

        // ensure cleanup after print
        window.addEventListener('afterprint', cleanup)
        // fallback cleanup in case afterprint not fired
        setTimeout(() => { try { cleanup() } catch (e) {} }, 1000)

        window.print()
    }
    // console.log('OrderModal render', { order, items, products })
    return (
        <div className='clamp prin-class' style={{ position: 'fixed' ,padding: 15, left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
            <div ref={printRef} style={{ background: '#ffffff',color: '#000000' , padding: 20, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '95vw', maxWidth: 500, boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0 ,color: '#000000'  }}>ໃບບີນ #{order.id}</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {/* <div style={{ padding: '4px 8px', background: '#eee', borderRadius: 6 }}>{order.pm_type || '-'}</div> */}
                        <button className='button' style={{ padding: '2px 6px' }} onClick={handlePrint}>Print</button>
                        <button className='button' style={{ padding: '2px 6px' }} onClick={onClose}>ປິດ</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
                    <div style={{ padding: 12, width: '100%', border: '1px solid #79797971', borderRadius: 6 }}>
                        <strong style={{ color: '#000000' }}>ລາຍການຂາຍ</strong>
                        <div style={{ marginTop: 2, maxHeight: 220, overflow: 'auto' }}>
                            {items.length === 0 ? (
                                <div style={{ color: '#666' }}>ບໍ່ມີລາຍການສິນຄ້າ</div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {items.map((it, idx) => {
                                        const prod = it.pro_id || {}
                                        const qty = it.quantity ?? it.qty ?? 0
                                        const unit = it.price ?? it.unit_price ?? prod.price ?? 0
                                        const subtotal = Number(qty) * Number(unit)
                                        return (
                                            <li key={idx} style={{ padding: 8, color: '#000000', borderBottom: '1px solid #79797971', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ color: '#666', fontSize: 13 }}>ລາຍການ #{idx + 1}</div>
                                                    <div style={{ fontWeight: 600, color: '#000000' }}>{prod.pro_name || '-'}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ color: '#000000' }}>{qty} × {Number(unit).toLocaleString() + ' ₭'} =</div>
                                                    <div style={{ fontWeight: 600, color: '#000000' }}>{Number(subtotal).toLocaleString() + ' ₭'}</div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* <strong>Order Fields</strong> */}
                        <ul style={{ margin: 8, paddingLeft: 16, overflow: 'auto' }}>
                            {(() => {
                                const fields = [
                                    { key: 'address', label: 'ຈັດສົ່ງ' },
                                    { key: 'pm_type', label: 'ການຈ່າຍ' },
                                    { key: 'total_qty', label: 'ຈຳນວນທັ້ງໝົດ' },
                                    { key: 'promotion', label: 'ລາຄາໂປຣ' },
                                ]

                                const getField = (obj, key) => {
                                    if (!obj) return undefined
                                    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key]
                                    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
                                    if (Object.prototype.hasOwnProperty.call(obj, camel)) return obj[camel]
                                    return undefined
                                }

                                const formatAddress = (raw) => {
                                    if (raw == null) return '-'
                                    let v = raw
                                    if (typeof v === 'string') {
                                        try { v = JSON.parse(v) } catch (e) { /* keep string */ }
                                    }
                                    if (Array.isArray(v)) {
                                        return (
                                            <ul style={{ margin: 0, paddingLeft: 16, display: 'inline-block' }}>
                                                {v.map((x, i) => (
                                                    <li key={i} style={{ color: '#000000' }}>{typeof x === 'object' ? JSON.stringify(x) : String(x)}</li>
                                                ))}
                                            </ul>
                                        )
                                    }
                                    return String(v)
                                }

                                return fields.map(f => {
                                    const val = getField(order, f.key)
                                    return (
                                        <li key={f.key} style={{ marginBottom: 6 }}>
                                            <span style={{ display: 'inline-block', fontSize: 12, color: '#808080' }}>{f.label}:</span>
                                            <strong style={{ marginLeft: 8, color: '#000000', display: 'flex' }}>
                                                {f.key === 'address'
                                                    ? formatAddress(val)
                                                    : f.key === 'promotion'
                                                        ? (val == null || val === '' || Number.isNaN(Number(val)) ? '-' : Number(val).toLocaleString() + ' ₭')
                                                        : renderValue(val)}
                                            </strong>
                                        </li>
                                    )
                                })
                            })()}
                        </ul>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ color: '#666' }}>ເວລາ: {new Date(order.created_at).toLocaleString() || '-'}</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#000000' }}>Total: {order.sale_price ? Number(order.sale_price).toLocaleString() + ' ₭' : '-'}</div>
                </div>
            </div>
        </div>
    )
}
