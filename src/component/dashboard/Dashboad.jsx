import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import swal from 'sweetalert'

export default function Dashboad() {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState([])
  const days = 7

  function getDateKey(d) {
    const tz = new Date(d)
    return tz.toISOString().slice(0, 10)
  }

  async function fetchSummary() {
    setLoading(true)
    try {
      const [{ data: orders = [], error: oErr }, { data: products = [], error: pErr }] = await Promise.all([
        supabase.from('Order').select('id, created_at, sale_price, total_qty').order('created_at', { ascending: false }),
        supabase.from('Product').select('id, created_at').order('created_at', { ascending: false })
      ])

      if (oErr || pErr) throw oErr || pErr

      // build last N days array
      const arr = []
      for (let i = 0; i < days; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        arr.push({ key, date: new Date(key), imports: 0, orders: 0, itemsSold: 0, sales: 0 })
      }

      const map = Object.fromEntries(arr.map(r => [r.key, r]))

      orders.forEach(o => {
        if (!o.created_at) return
        const k = getDateKey(o.created_at)
        if (map[k]) {
          map[k].orders += 1
          map[k].sales += Number(o.sale_price) || 0
          map[k].itemsSold += Number(o.total_qty) || 0
        }
      })

      products.forEach(p => {
        if (!p.created_at) return
        const k = getDateKey(p.created_at)
        if (map[k]) map[k].imports += 1
      })

      const out = Object.values(map).sort((a, b) => b.key.localeCompare(a.key))
      setSummary(out)
    } catch (err) {
      console.error('fetchSummary', err)
      swal('เกิดข้อผิดพลาดในการดึงข้อมูล', { icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSummary() }, [])

  function exportCSV() {
    const rows = [['date', 'imports', 'orders', 'itemsSold', 'sales'], ...summary.map(s => [s.key, s.imports, s.orders, s.itemsSold, s.sales])]
    const csv = rows.map(r => r.map(c => `"${String(c || '')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily_summary_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const totalSales = summary.reduce((s, r) => s + (Number(r.sales) || 0), 0)
  const totalImports = summary.reduce((s, r) => s + (Number(r.imports) || 0), 0)

  return (
    <div style={{ padding: 16 }}>
      <h3>สรุปรายการ (นำเข้า - ขาย) รายวัน</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className='button' onClick={fetchSummary} disabled={loading}>Refresh</button>
        <button className='button' onClick={exportCSV} disabled={loading || summary.length === 0}>Export CSV</button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>ช่วง {days} วันล่าสุด</strong> — ยอดขายรวม: {Number(totalSales).toLocaleString()} — นำเข้า: {totalImports}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 6 }}>วันที่</th>
            <th style={{ textAlign: 'right', padding: 6 }}>นำเข้า</th>
            <th style={{ textAlign: 'right', padding: 6 }}>ออเดอร์</th>
            <th style={{ textAlign: 'right', padding: 6 }}>จำนวนที่ขาย</th>
            <th style={{ textAlign: 'right', padding: 6 }}>ยอดขาย (₭)</th>
          </tr>
        </thead>
        <tbody>
          {summary.map(r => (
            <tr key={r.key}>
              <td style={{ padding: 6 }}>{new Date(r.key).toLocaleDateString()}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{r.imports}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{r.orders}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{r.itemsSold}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{Number(r.sales).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
