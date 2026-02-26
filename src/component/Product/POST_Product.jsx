import React, { useRef, useState } from 'react'
import plus from '../../icon/plus.png'
import reload from '../../icon/refresh.json'
import { supabase } from '../../supabaseClient'
import success from '../../icon/success.json'
import Lottie from 'lottie-react'

export default function POST_Product({ cant_data }) {

    function Add_click(e) {
        cant_data?.(false);
    }

    const [proName, setProName] = useState("")
    const [quantity, setQuantity] = useState("")
    const [imageFile, setImageFile] = useState(null)
    const [loading, setLoading] = useState(false)

    const [imagePreview, setImagePreview] = useState(null)

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        setImageFile(file)
        if (!file) return
        const imageUrl = URL.createObjectURL(file)
        setImagePreview(imageUrl)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
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
                quantity: Number(quantity),
                user: localStorage.getItem('data_id')
            })

        if (insertError) {
            alert("ບັນທືໍກຂໍ້ມູນສິນຄ້າບໍ່ໄດ້")
            console.log(insertError)
        } else {
            alert("ເພີ່ມສິນຄ້າເລີ່ມຕົ້ນແລ້ວ ✅")
        }

        setLoading(false)
        setImageFile(null)
        setProName("")
        setQuantity("")
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

                    <div className="project" style={{ display: 'grid', gap: 8 }}>
                        <div className="input-group">
                            <input type="text" onChange={(e) => setProName(e.target.value)} value={proName} placeholder=" " required />
                            <label>ສິນຄ້າ</label>
                        </div>
                        <div className="input-group">
                            <input type="number" onChange={(e) => setQuantity(e.target.value)} value={quantity} placeholder=" " required />
                            <label>ຈຳນວນ</label>
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
        </div>
    )
}
