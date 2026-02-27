import React, { useEffect, useRef, useState } from 'react'
import useFunctions from './usefunctions'
import Lottie from 'lottie-react'
import reload from '../../icon/refresh.json'
import plus from '../../icon/plus.png'
import { supabase } from '../../supabaseClient'


export default function GET_Product({ add_data }) {

    let {
        users,
        loading,
        fetchUsers
    } = useFunctions()

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
    }

    return (
        <div style={{ marginTop: 16 }}>

            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                <button className="button" onClick={Add_click} disabled={loading} style={{ padding: '2px 4px' }}>
                    <img src={plus} alt="Add" style={{ width: 12, marginRight: 8, color: '#ffffff' }} />
                    ເພີມສີນຄ້າ
                </button>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="button" onClick={() => {
                        fetchUsers()
                        handleClick()
                    }} disabled={loading} style={{ padding: '0 8px', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
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
            ) : users.length === 0 ? (
                <p>No data found.</p>
            ) : (
                <div class="deploy-list">
                    {users.map((u) => (
                        <div class="deploy-item clamp">
                            <div class="left">
                                <img src={u.pro_img} style={{ width: 40, height: 40, marginTop: 2, borderRadius: 4, objectFit: 'cover' }} />
                            </div>

                            <div class="project ">
                                <span style={{ color: '#02be0b' }}>{u.cate_id?.name || '-'}: </span>
                                <span>{u.pro_name}</span> <br/>
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
                            <div class="branch">
                                <button class="commit" style={{ border: 'none'}}>ຈັດການ</button>
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

        </div>
    )
}
