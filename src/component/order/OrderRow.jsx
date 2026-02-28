import React from 'react'
import PaymentBadge from './PaymentBadge'

export default function OrderRow({ order, onRowClick, onPaymentClick, onToggleDelivery, onCancel }) {
    const pmRaw = (order.pm_type || '').toString().trim()
    const pmLower = pmRaw.toLowerCase()
    let badgeColor = '#be0202'
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
        <div key={order.id} className="deploy-item-order clamp" name='item-order' onClick={() => onRowClick(order.id)}>
            <div className='first-column' style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
                <div className="project">
                    <div>
                        <div style={{ fontWeight: 600 }}>Order #{order.id}</div>
                        <div style={{ color: '#999' }}>{order.pm_type || '-'}</div>
                    </div>
                </div>

                <div className="branch">
                    <div>
                        <div>
                            <span className="commit" style={{ color: '#02be0b' }}>จำนวนรวม: </span>
                            {order.total_qty ?? '-'}
                        </div>
                        <div>
                            <span className="commit" style={{ color: '#be0202' }}>ยอดขาย: </span>
                            {order.sale_price ? Number(order.sale_price).toLocaleString() + ' ₭' : '-'}
                        </div>
                    </div>
                </div>
            </div>

            <div className='first-column' style={{ justifyContent: 'flex-end', gap: 60, alignItems: 'center' }}>
                <div className="time ">
                    <div className="commit">{order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</div>
                </div>
                <div className="actions" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <PaymentBadge label={label} color={badgeColor} cancelled={order.cancelled} onClick={(e) => { e.stopPropagation(); onPaymentClick(order) }} />
                    /
                    <button
                        className='clamp'
                        onClick={(e) => { e.stopPropagation(); onToggleDelivery(order.id) }}
                        disabled={order.cancelled}
                        style={{
                            background: order.deliveryConfirmed ? '#02be0b' : '#f0ad4e',
                            color: '#fff',
                            border: 'none',
                            padding: '2px 4px',
                            borderRadius: 6,
                            cursor: order.cancelled ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {order.deliveryConfirmed ? 'ສົ່ງແລ້ວ' : 'ຍັງບໍ່ສົ່ງ'}
                    </button>
                    /
                    <button
                        className='clamp'
                        onClick={(e) => { e.stopPropagation(); onCancel(order.id) }}
                        disabled={order.cancelled}
                        style={{
                            background: '#be0202',
                            color: '#fff',
                            border: 'none',
                            padding: '2px 4px',
                            borderRadius: 6,
                            cursor: order.cancelled ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ຍົກເລີກ
                    </button>
                </div>
            </div>
        </div>
    )
}
