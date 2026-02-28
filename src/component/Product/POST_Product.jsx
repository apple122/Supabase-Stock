import React, { useEffect, useRef, useState } from 'react'
import swal from 'sweetalert';
import plus from '../../icon/plus.png'
import reload from '../../icon/refresh.json'
import { supabase } from '../../supabaseClient'
import success from '../../icon/success.json'
import loading_animations from '../../icon/loading.json'
import Lottie from 'lottie-react'

export default function POST_Product({ cant_data }) {

    function Add_click(e) {
        cant_data?.(false);
        localStorage.setItem('Navigate', JSON.stringify(['Product', false]))
    }

    const [GC, setGC] = useState([])
    const [Loadata, setLoadata] = useState(false)

    const fetchCG = async () => {
        try {
            setLoadata(true)
            const { data, error } = await supabase
                .from('Category') // schema-qualified table
                .select(`id, name, created_at`)
                .order("created_at", { ascending: false }) // order by created_at descending

            if (error) throw error
            setGC(data || [])
        } catch (err) {
            console.error('Failed to fetch ap_system.Category:', err)
            alert(err.message || err.error_description || 'Failed to fetch Category')
        } finally {
            setLoadata(false)
        }
    }

    useEffect(() => {
        fetchCG()
    }, [])

    const [proName, setProName] = useState("")
    const [quantity, setQuantity] = useState("")
    const [SKU, setSKU] = useState("")
    const [cost_price, setcost_price] = useState("")
    const [price, setPrice] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [cate_id, setcate_id] = useState(null)

    const [imagePreview, setImagePreview] = useState(null)

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        setImageFile(file)
        if (!file) return
        const imageUrl = URL.createObjectURL(file)
        setImagePreview(imageUrl)
    }

    const Options = async (e) => {
        const val = e.target.value
        // If user selected to add a new category, prompt and insert into DB immediately
        if (val === 'post-cate') {
            const name = prompt("ກະລຸນາໃສ່ຊື່ປະເພດລາຍການ")
            if (!name) return
            try {
                setLoadata(true)
                const { data: inserted, error } = await supabase
                    .from('Category')
                    .insert({ name })
                    .select('id,name,created_at')
                    .single()

                if (error) throw error
                setGC(prev => [inserted, ...(prev || [])])
                setcate_id(inserted.id)
            } catch (err) {
                console.error('Failed to create Category:', err)
                alert(err.message || 'Failed to create category')
            } finally {
                setLoadata(false)
            }

            return
        }

        setcate_id(val)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!cate_id) {
            alert("ກະລຸນາເລືອກປະເພດສີນຄ້າ")
            return
        }

        if (!imageFile) {
            alert("ກະລຸນາເລືອກຮູບສິນຄ້າ")
            return
        }

        if (localStorage.getItem('data_id') === null) {
            alert("ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອເພີ່ມສິນຄ້າ")
            window.location.reload()
            return
        }

        setLoading(true)

        // Ensure the selected category actually exists on the server.
        try {
            const { data: catCheck, error: catCheckError } = await supabase
                .from('Category')
                .select('id,name')
                .eq('id', Number(cate_id))
                .limit(1)

            if (catCheckError) throw catCheckError

            if (!catCheck || catCheck.length === 0) {
                // If category not found, ask user for a name and create it
                const name = prompt('ປະເພດທີ່ເລືອກບໍ່ມີໃນລະບົບ, ກະລຸນາປ້ອນຊື່')
                if (!name) {
                    alert('ບໍ່ສາມາດເພີ່ມສິນຄ້າໄດ້ ໂດຍບໍ່ມີປະເພດ')
                    setLoading(false)
                    return
                }
                const { data: newCat, error: newCatErr } = await supabase
                    .from('Category')
                    .insert({ name })
                    .select('id')
                    .single()

                if (newCatErr) {
                    console.error('Failed to create category:', newCatErr)
                    alert(newCatErr.message || 'Failed to create category')
                    setLoading(false)
                    return
                }

                setcate_id(newCat.id)
            }
        } catch (err) {
            console.error('Category verification failed:', err)
            alert(err.message || 'Failed to verify category')
            setLoading(false)
            return
        }

        // 1️⃣ Upadoad file to Supabase Storage
        const fileName = Date.now() + "-" + imageFile.name

        const filePath = `img-system/3ls37j_0/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from("ap_system")
            .upload(filePath, imageFile, {
                upsert: true
            })

        if (uploadError) {
            console.log(uploadError)
            alert(uploadError.message)
            return
        }

        // 2️⃣ GET URL IMG
        const { data } = supabase.storage
            .from("ap_system")
            .getPublicUrl(filePath)

        const imageUrl = data.publicUrl

        // 3️⃣ POST table product
        const { error: insertError } = await supabase
            .from("Product")
            .insert({
                pro_name: proName,
                pro_img: imageUrl,
                cate_id: Number(cate_id),
                sku: SKU,
                cost_price: Number(cost_price),
                sell_price: Number(price),
                quantity: Number(quantity),
                user: localStorage.getItem('data_id')
            })

        if (insertError) {
            alert("ບັນທືໍກຂໍ້ມູນສິນຄ້າບໍ່ໄດ້")
            console.log(insertError)
        } else {
            swal({
                title: "ເພີມສີນຄ້າສຳເລັດແລ້ວ✅",
                icon: "success",
            });
            cant_data?.(false);
            localStorage.setItem('Navigate', JSON.stringify(['Product', false]))
        }

        setLoading(false)
        setImageFile(null)
        setProName("")
        setQuantity("")
        setSKU("")
        setcost_price("")
        setPrice("")
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
        setImageFile(null)
        setImagePreview(null)
        setProName("")
        setQuantity("")
        setSKU("")
        setcost_price("")
        setPrice("")
    }


    return (
        <div style={{ marginTop: 16, zIndex: 1 }}>
            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                <button className="button" onClick={Add_click} style={{ padding: '2px 4px' }}>
                    {/* <img src={plus} alt="Add" style={{ width: 12, marginRight: 8, color: '#ffffff' }} /> */}
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <div className="grid-colum-2" style={{ marginBottom: 2, gap: 8 }}>
                    <div className="project" style={{ display: 'grid', gap: 8 }}>
                        <div className="upload-container">
                            <label className="upload-box">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />

                                {imagePreview ? (
                                    <img src={imagePreview} alt="preview" />
                                ) : (
                                    <span>ເລືອກຮູບ</span>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="project screen-width-2" style={{ display: 'grid', gap: 8 }}>
                        <div className='flex-display'>
                            <select className="select-style" onChange={Options} style={{ background: 'none', borderRadius: 8, border: '0.3px solid #ffffff34' }} required>
                                <option value={null}>ເລືອກປະເພດລາຍການ</option>
                                {Loadata ? (
                                    <p>Loading...</p>
                                ) : GC.length === 0 ? (
                                    <p>No data found.</p>
                                ) : (
                                    <>
                                        {GC.map((u) => (
                                            <option value={u.id}>{u.name}</option>
                                        ))}
                                    </>

                                )}
                                <option value={'post-cate'}>+ ເພີມປະເພດລາຍການ</option>
                            </select>
                            <div className="input-group margin-l" style={{ width: '100%' }}>
                                <input type="text" onChange={(e) => setProName(e.target.value)} value={proName} placeholder=" " required />
                                <label>ສິນຄ້າ</label>
                            </div>
                        </div>
                        <div className='flex-display'>
                            <div className="input-group" style={{ width: '100%' }}>
                                <input type="number" onChange={(e) => setQuantity(e.target.value)} value={quantity} placeholder=" " required />
                                <label>ຈຳນວນ</label>
                            </div>
                            <div className="input-group margin-l" style={{ width: '100%' }}>
                                <input type="number" onChange={(e) => setcost_price(e.target.value)} value={cost_price} placeholder=" " required />
                                <label>ຕົ້ນທຸນ</label>
                            </div>
                            <div className="input-group margin-l" style={{ width: '100%' }}>
                                <input type="text" onChange={(e) => setSKU(e.target.value)} value={SKU} placeholder="" />
                                <label>ລະຫັດສີນຄ້າ</label>
                            </div>
                        </div>
                        <div className='flex-display'>
                            <div className="input-group" style={{ width: '100%' }}>
                                <input type="number" onChange={(e) => setPrice(e.target.value)} value={price} placeholder=" " required />
                                <label>ລາຄາຂາຍ / ຕໍ່ຊີ້ນ</label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="button btn-submit" type="submit" disabled={loading} style={{ padding: '8px 16px', alignSelf: 'flex-start' }}>
                                {loading ? "ກຳລັງບັນທືກ..." : "ບັນທືກ"}
                            </button>
                            <button className="button btn-reset" type="reset" onClick={handleClick} style={{ display: 'flex', padding: '8px 8px', alignSelf: 'flex-start' }}>
                                <Lottie
                                    lottieRef={lottieRef}
                                    className='menu-icon'
                                    animationData={reload}
                                    loop={false}
                                    autoplay={true}
                                    style={{ width: 15 }}
                                />
                                <hr style={{ margin: '6px 5px', borderColor: '#ffffff28' }} />
                                ລ້າງ
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            {loading ?
                <div className='reload'>
                    <Lottie
                        // lottieRef={lottieRef}
                        className='menu-icon laod-icon'
                        animationData={loading_animations}
                        loop={true}
                        style={{ width: '100%' }}
                    />
                </div>
                : ""}

        </div>
    )
}
