import React, { useEffect, useRef, useState } from 'react'
import useFunctions from './usefunctions'
import Dropdown from './Dropdown'
import Lottie from 'lottie-react'
import reload from '../../icon/refresh.json'
import plus from '../../icon/plus.png'
import { supabase } from '../../supabaseClient'
import loading_animations from '../../icon/loading.json'
import swal from 'sweetalert'

export default function GET_Product({ add_data }) {

    let {
        GET,
        loading,
        fetchUsers,

        handleDelete
    } = useFunctions()

    const [editOpen, setEditOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState({ pro_name: '', sku: '', sell_price: '', cost_price: '', quantity: '', pro_img: '', cate_id: '' })
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [categories, setCategories] = useState([])

    function openEdit(item) {
        setEditItem(item)
        setForm({
            pro_name: item.pro_name || '',
            sku: item.sku || '',
            sell_price: item.sell_price || '',
            cost_price: item.cost_price || '',
            quantity: item.quantity || '',
            pro_img: item.pro_img || '',
            cate_id: item.cate_id?.id || item.cate_id || ''
        })
        setEditOpen(true)
    }

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('Category')
                .select('id, name')
                .order('created_at', { ascending: false })
            if (error) throw error
            setCategories(data || [])
        } catch (err) {
            console.error('Failed to fetch categories', err)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const [LoadPU, setLoadPU] = useState(false)
    async function submitEdit(e) {
        e.preventDefault()
        setLoadPU(true)
        if (!editItem) return
        try {
            const payload = {}

            // only include fields that actually changed (prevents accidental null overwrites)
            if (form.pro_name !== undefined && form.pro_name !== editItem.pro_name) payload.pro_name = form.pro_name
            if (form.sku !== undefined && form.sku !== editItem.sku) payload.sku = form.sku
            if (form.sell_price !== undefined && String(form.sell_price) !== String(editItem.sell_price)) payload.sell_price = form.sell_price || null
            if (form.cost_price !== undefined && String(form.cost_price) !== String(editItem.cost_price)) payload.cost_price = form.cost_price || null
            if (form.quantity !== undefined && String(form.quantity) !== String(editItem.quantity)) payload.quantity = form.quantity || null
            // category
            if (form.cate_id !== undefined) {
                const existingCid = editItem.cate_id?.id || editItem.cate_id || ''
                if (String(form.cate_id) !== String(existingCid)) payload.cate_id = form.cate_id ? Number(form.cate_id) : null
            }

            // If a new file is selected, upload it to Supabase Storage and set payload.pro_img
            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${editItem.id}-${Date.now()}.${fileExt}`
                const { data: uploadData, error: uploadErr } = await supabase.storage
                    .from('ap_system')
                    .upload(fileName, file, { upsert: true })

                if (uploadErr) {
                    const projectRef = 'hbnydksqtfvnerkskuum'
                    const storageConsole = `https://app.supabase.com/project/${projectRef}/storage/buckets`
                    if (uploadErr?.message?.toLowerCase().includes('bucket') || uploadErr?.status === 404) {
                        const openConsole = confirm('Storage bucket "ap_system" not found. Open Supabase Storage console to create it?')
                        if (openConsole) window.open(storageConsole, '_blank')
                    }
                    throw uploadErr
                }

                const publicRes = supabase.storage.from('ap_system').getPublicUrl(fileName)
                const publicUrl = publicRes?.data?.publicUrl || publicRes?.publicURL || publicRes?.data?.publicURL || publicRes?.publicUrl
                if (publicUrl) payload.pro_img = publicUrl
            }

            // if nothing changed, skip update
            if (Object.keys(payload).length === 0) {
                setLoadPU(false)
                setEditOpen(false)
                setEditItem(null)
                return
            }

            const { data, error } = await supabase
                .from('Product')
                .update(payload)
                .eq('id', editItem.id)

            if (error) throw error
            fetchUsers()
            setEditOpen(false)
            setEditItem(null)
            setFile(null)
            if (preview) {
                URL.revokeObjectURL(preview)
                setPreview(null)
            }
            setForm({ pro_name: '', sku: '', sell_price: '', cost_price: '', quantity: '', pro_img: '', cate_id: '' })
            setLoadPU(false)
        } catch (err) {
            console.error('Update failed', err)
            alert(err.message || 'Update failed')
            setLoadPU(false)
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

    function Add_click(e) {
        add_data?.(true);
        localStorage.setItem('Navigate', JSON.stringify(['Product', true]))
    }

    async function plutQty(item) {
        try {
            const choice = await swal({
                title: 'ກະລຸນາເລືອກ',
                text: 'ຕ້ອງການເພີມສິນຄ້າ ຫຼື ຈັດເກັບສິນຄ້າ?',
                buttons: {
                    cancel: 'ຍົກເລີກ',
                    add: { text: 'ເພີ່ມສິນຄ້າ', value: 'add' },
                    archive: { text: 'ຈັດເກັບ', value: 'archive' }
                }
            })

            if (!choice) return

            if (choice === 'add') {
                const val = await swal('ປ້ອນຈຳນວນທີ່ຈະເພີ່ມ', { content: 'input' })
                if (val === null || val === undefined) return
                const add = Number(val)
                if (!add || add <= 0) {
                    swal('ກະລຸນາປ້ອນຈຳນວນທີ່ໃຫ້ເກີນ 0', { icon: 'warning' })
                    return
                }

                const current = Number(item.quantity) || 0
                const newQty = current + add

                const { error } = await supabase
                    .from('Product')
                    .update({ quantity: newQty })
                    .eq('id', item.id)

                if (error) throw error

                swal('ບັນທຶກສຳເລັດ', { icon: 'success' }).then(() => fetchUsers())
            } else if (choice === 'archive') {
                const confirm = await swal({
                    title: 'ຍືນຢັນການຈັດເກັບ',
                    text: 'ຕ້ອງການຈັດເກັບສິນຄ້ານີ້ ຫຼື ບໍ່?',
                    buttons: {
                        cancel: 'ຍົກເລີກ',
                        ok: 'ຈັດເກັບ'
                    }
                })
                if (!confirm) return

                const { error } = await supabase
                    .from('Product')
                    .update({ is_archived: false })
                    .eq('id', item.id)

                if (error) throw error

                swal('ບັນທຶກສຳເລັດ', { icon: 'success' }).then(() => fetchUsers())
            }

        } catch (err) {
            console.error('plutQty error', err)
            swal('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ', { icon: 'error' })
        }
    }

    return (
        <div style={{ marginTop: 16 }}>

            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                <button className="button clamp" onClick={Add_click} disabled={loading} style={{ padding: '6px 6px', display: 'flex', alignItems: 'center' }}>
                    <img src={plus} alt="Add" style={{ width: 12, marginRight: 8, color: '#ffffff' }} />
                    ເພີມສີນຄ້າ
                </button>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="button clamp btn-reload" onClick={() => {
                        fetchUsers()
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
                        // export Product table
                        try {
                            const { data, error } = await supabase.from('Product').select('*, cate_id(*), user(*))').order('created_at', { ascending: false })
                            if (error) throw error

                            // map to custom headers (Thai)
                            const rows = (data || []).map(p => ({
                                'ສິນຄ້າ': p.pro_name ?? '',
                                'ລະຫັດ': p.sku ?? '',
                                'ລາຄາຂາຍ': p.sell_price != null ? Number(p.sell_price) : '',
                                'ຕົ້ນທຸນ': p.cost_price != null ? Number(p.cost_price) : '',
                                'ຈຳນວນ': p.quantity != null ? Number(p.quantity) : '',
                                'ປະເພດ': p.cate_id?.name ?? '',
                                'ຮູບພາບ': p.pro_img ?? '',
                                'ສ້າງເວລາ': p.created_at ?? '',
                                'ຜູ້ສ້າງ': p.user?.fullname ?? '',
                            }))

                            // console.log('Exporting products', rows)

                            try {
                                const XLSXmod = await import('xlsx')
                                const XLSX = XLSXmod.default || XLSXmod
                                const wb = XLSX.utils.book_new()
                                const ws = XLSX.utils.json_to_sheet(rows)
                                XLSX.utils.book_append_sheet(wb, ws, 'Product')
                                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
                                const blob = new Blob([wbout], { type: 'application/octet-stream' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `product_export_${Date.now()}.xlsx`
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                                URL.revokeObjectURL(url)
                                swal('ເລີມໂຫຼດຂໍ້ມູນ Product (Excel)', { icon: 'success' })
                            } catch (e) {
                                console.warn('xlsx not available, fallback to JSON', e)
                                const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `product_export_${Date.now()}.json`
                                document.body.appendChild(a)
                                a.click()
                                a.remove()
                                URL.revokeObjectURL(url)
                                swal('ເລີມໂຫຼດຂໍ້ມູນ Product (JSON)', { icon: 'info' })
                            }
                        } catch (err) {
                            console.error('exportProducts error', err)
                            swal('ເກີດຂໍ້ຜິດພາດໃນການສົ່ງອອກຂໍ້ມູນ Product', { icon: 'error' })
                        } finally {
                        }
                    }} disabled={loading} style={{ padding: '4px 8px', marginTop: 8, marginLeft: 8 }}>
                        Export Products
                    </button>
                </div>

                <div className="project"> </div>

                <div className="branch">
                    <div className="commit"> </div>
                </div>
                <div className="status ready"> </div>
                <div className="time">
                    <div className="commit" style={{ display: 'flex', right: '-50%' }}>

                    </div>
                </div>
            </div>


            {loading ? (
                <p>Loading...</p>
            ) : GET.length === 0 ? (
                <p>No data found.</p>
            ) : (
                <div class="deploy-list">
                    {GET.map((u) => (
                        <div class="deploy-item clamp position-relative" style={{ backgroundColor: u.quantity == 0 ? '#ff00001a' : '' }} key={u.id}>
                            <div className='notification-position' style={{ display: u.quantity == 0 ? '' : 'none' }}>
                                <button className='button' onClick={() => plutQty(u)} style={{ padding: '2px 6px', fontSize: 25, backgroundColor: 'transparent', border: 'none' }}> ສິນຄ້າໝົດ / ກົດເພືອເພີມສີນຄ້າ ......</button>
                            </div>
                            <div class="left">
                                <img src={u.pro_img} style={{ width: 40, height: 40, marginTop: 2, borderRadius: 4, objectFit: 'cover' }} />
                            </div>

                            <div class="project ">
                                <span style={{ color: '#02be0b' }}>{u.cate_id?.name || '-'}: </span>
                                <span>{u.pro_name}</span> <br />
                                <span className='limit-10'>{u.sku || '-'} </span>
                            </div>

                            <div class="branch">
                                <div>
                                    <span class="commit clamp" style={{ color: '#02be0b' }}>ລາຄາຂາຍ: </span>
                                    {u.sell_price ? Number(u.sell_price).toLocaleString("en-US") : '-'} ₭
                                </div>
                                <div>
                                    <span class="commit" style={{ color: '#be0202' }}>ຕົ້ນທຶນ: </span>
                                    {u.cost_price ? Number(u.cost_price).toLocaleString("en-US") : '-'} ₭
                                </div>
                            </div>
                            <div class="branch">
                                <div class="commit">ຈຳນວນ</div>
                                <div>{u.quantity ? Number(u.quantity).toLocaleString("en-US") : '-'}</div>
                            </div>
                            <div class="branch" style={{ display: u.quantity == 0 ? 'none' : '' }}>
                                <Dropdown
                                    label={'ຈັດການ'}
                                    value={u}
                                    onEdit={(item) => openEdit(item)}
                                    onDelete={(item) => handleDelete(item)}
                                />
                            </div>
                            <div class="time last-column">
                                <div class="commit" style={{ display: 'flex' }}>
                                    {u.created_at ? new Date(u.created_at).toLocaleString() : '-'}
                                    <hr style={{ margin: '6px 10px', borderColor: '#ffffff28' }} />
                                    {u.user?.fullname || '-'}
                                </div>
                            </div>
                        </div>
                    ))}

                </div>

            )}

            {editOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <form onSubmit={submitEdit} className='width-img-put' style={{ background: '#111', padding: 16, borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
                        <h3 style={{ marginTop: 0 }}>ແກ້ໄຂສິນຄ້າ</h3>
                        <label>ຮູບສິນຄ້າ</label>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '50%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <label className="upload-box-put">
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const f = e.target.files[0]
                                        setFile(f)
                                        if (f) {
                                            const url = URL.createObjectURL(f)
                                            setPreview(url)
                                        }
                                    }} />
                                    {preview ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} /> : (form.pro_img ? <img src={form.pro_img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} /> : null)}
                                </label>
                            </div>
                            <div style={{ marginLeft: 20 }}>
                                <label>ຊື່</label>
                                <input value={form.pro_name} onChange={(e) => setForm(s => ({ ...s, pro_name: e.target.value }))} />
                                <label>ປະເພດ</label>
                                <select value={form.cate_id || ''} onChange={(e) => setForm(s => ({ ...s, cate_id: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 6, background: 'transparent', border: '1px solid #333' }}>
                                    <option value="">-- ເລືອກປະເພດ --</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label>SKU</label>
                        <input value={form.sku} onChange={(e) => setForm(s => ({ ...s, sku: e.target.value }))} />
                        <label>ລາຄາຂາຍ</label>
                        <input value={form.sell_price} onChange={(e) => setForm(s => ({ ...s, sell_price: e.target.value }))} />
                        <label>ຕົ້ນທຶນ</label>
                        <input value={form.cost_price} onChange={(e) => setForm(s => ({ ...s, cost_price: e.target.value }))} />
                        <label>ຈຳນວນ</label>
                        <input value={form.quantity} onChange={(e) => setForm(s => ({ ...s, quantity: e.target.value }))} />

                        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                            <button type="button" className="button" onClick={() => {
                                setEditOpen(false)
                                setEditItem(null)
                                setFile(null)
                                if (preview) {
                                    URL.revokeObjectURL(preview)
                                    setPreview(null)
                                }
                                setForm({ pro_name: '', sku: '', sell_price: '', cost_price: '', quantity: '', pro_img: '', cate_id: '' })
                            }}>ຍົກເລີກ</button>
                            <button type="submit" className="button primary">{LoadPU ? "ກຳລັງບັນທືກ..." : "ບັນທືກ"}</button>
                        </div>
                    </form>
                </div>
            )}

            {LoadPU ?
                <div className='reload'>
                    <Lottie
                        // lottieRef={lottieRef}
                        className='menu-icon laod-icon'
                        animationData={loading_animations}
                        loop={true}
                    />
                </div>
                : ""}
        </div>
    )
}

