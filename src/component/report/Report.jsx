import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import swal from 'sweetalert'

export default function Report() {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [orderItems, setOrderItems] = useState([])

  async function fetchAll() {
    setLoading(true)
    try {
      const [{ data: cat, error: catErr }, { data: prod, error: prodErr }, { data: ord, error: ordErr }, { data: oi, error: oiErr }] = await Promise.all([
        supabase.from('Category').select('*').order('created_at', { ascending: false }),
        supabase.from('Product').select('*').order('created_at', { ascending: false }),
        supabase.from('Order').select('*').order('created_at', { ascending: false }),
        supabase.from('OrderItem').select('*').order('created_at', { ascending: false }),
      ])

      if (catErr || prodErr || ordErr || oiErr) {
        const e = catErr || prodErr || ordErr || oiErr
        throw e
      }

      setCategories(cat || [])
      setProducts(prod || [])
      setOrders(ord || [])
      setOrderItems(oi || [])
    } catch (err) {
      console.error('fetchAll', err)
      swal('เกิดข้อผิดพลาดในการดึงข้อมูล', { icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  async function exportWorkbook() {
    try {
      const XLSXmod = await import('xlsx')
      const XLSX = XLSXmod.default || XLSXmod
      const wb = XLSX.utils.book_new()

      const addSheet = (name, rows) => {
        const ws = XLSX.utils.json_to_sheet(rows || [])
        XLSX.utils.book_append_sheet(wb, ws, name)
      }

      addSheet('Category', categories)
      addSheet('Product', products)
      addSheet('Order', orders)
      addSheet('OrderItem', orderItems)

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      swal('ส่งออกสำเร็จ', { icon: 'success' })
    } catch (err) {
      console.error('exportWorkbook', err)
      swal('ไม่สามารถส่งออกไฟล์ได้', { icon: 'error' })
    }
  }

  function exportJSON(name, rows) {
    const blob = new Blob([JSON.stringify(rows || [], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.toLowerCase()}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    swal('ส่งออกสำเร็จ', { icon: 'success' })
  }

  const totalSales = orders.reduce((s, o) => s + (Number(o.sale_price) || 0), 0)
  const totalOrderQty = orders.reduce((s, o) => s + (Number(o.total_qty) || 0), 0)

  return (
    <div style={{ padding: 16 }}>
      <h3>รายงานข้อมูล (Category / Product / Order / OrderItem)</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className='button' onClick={fetchAll} disabled={loading}>รีเฟรช</button>
        <button className='button primary' onClick={exportWorkbook} disabled={loading}>ส่งออกทั้งหมด (Excel)</button>
      </div>

      <section style={{ marginBottom: 12 }}>
        <h4>Category ({categories.length})</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className='button' onClick={() => exportJSON('category', categories)} disabled={loading}>Export JSON</button>
        </div>
      </section>

      <section style={{ marginBottom: 12 }}>
        <h4>Product ({products.length})</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className='button' onClick={() => exportJSON('product', products)} disabled={loading}>Export JSON</button>
        </div>
        <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #222', padding: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>id</th><th>name</th><th>price</th><th>quantity</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 50).map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.pro_name}</td>
                  <td>{p.sell_price}</td>
                  <td>{p.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginBottom: 12 }}>
        <h4>Order ({orders.length})</h4>
        <div>รวมยอดขาย: {Number(totalSales).toLocaleString()} </div>
        <div>รวมจำนวนรายการ: {totalOrderQty}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className='button' onClick={() => exportJSON('order', orders)} disabled={loading}>Export JSON</button>
        </div>
      </section>

      <section style={{ marginBottom: 12 }}>
        <h4>OrderItem ({orderItems.length})</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className='button' onClick={() => exportJSON('orderitem', orderItems)} disabled={loading}>Export JSON</button>
        </div>
      </section>
    </div>
  )
}
