import React, { useEffect, useRef } from 'react'
import edit from '../../icon/edit.png'
import claer from '../../icon/clear.png'
import Lottie from 'lottie-react'
import useFunctions from './useFunctions'

export default function Index_CGR() {



    let {
        handleSubmit,
        Nane, setName,
        loadingPost,
        message,

        GC,
        loading,
        fetchCG,

        deleteUser,
        updateCategory,
    } = useFunctions();

    useEffect(() => {
        fetchCG()
    }, []);

    return (
        <div style={{ marginTop: 16 }}>
            <h3>ປະເພດສີນຄ້າ</h3>
            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                <div className="project">
                    <span style={{ fontSize: '14px' }}>ປະເພດສີນຄ້າ / ບັນທືຂໍ້ມູນປະເພດສິນຄ້າ</span>
                </div>
            </div>
            <div className="flex-display" style={{ marginBottom: 2, gap: 8 }}>
                <div className="project" style={{ display: 'grid', gap: 8, }}>
                    <div className="input-group" style={{ display: 'grid', gap: 8, width: '100%', border: '1px solid #ffffff28', padding: '8px 25px', borderRadius: 4 }}>

                        {loading ? (
                            <p>Loading...</p>
                        ) : GC.length === 0 ? (
                            <p>No data found.</p>
                        ) : (
                            <div>
                                {GC.map((u) => (
                                    <div style={{ display: 'flex' }}>
                                        <span className='span-250' style={{ fontSize: '14px', borderBottom: '1px solid #ffffff28', paddingBottom: 8 }}> <span style={{ color: '#02be0b' }}>ປະເພດ:</span> {u.name}</span>
                                        <button className='hover-plus' onClick={() => updateCategory([u.id, u.name])} style={{ marginLeft: 8, padding: '1px 6px', width: 30, height: 30, border: '1px solid #ff9c236c', borderRadius: 4 }}>
                                            <img src={edit} style={{ width: '12px' }} />
                                        </button>
                                        <button className='hover-closs' onClick={() => deleteUser(u.id)} style={{ marginLeft: 8, padding: '1px 6px', width: 30, height: 30, border: '1px solid #ff646441', borderRadius: 4 }}>
                                            <img src={claer} style={{ width: '12px' }} />
                                        </button>
                                    </div>
                                ))}

                            </div>

                        )}


                    </div>
                </div>
                <div className="project" style={{ display: 'grid', gap: 8 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
                        <div className="input-group">
                            <input type="text" onChange={(e) => setName(e.target.value)} value={Nane} placeholder=" " required />
                            <label>ສິນຄ້າ</label>
                        </div>
                        <button className="button btn-submit" type="submit" disabled={loadingPost} style={{ padding: '13px 18px', alignSelf: 'flex-start' }}>
                            ບັນທືກ
                        </button>
                        {/* {message && <div style={{ marginTop: 8 }}>{message}</div>} */}
                    </form>
                </div>
            </div>
        </div>
    )
}
