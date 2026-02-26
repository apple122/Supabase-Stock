import React from 'react'
import plus from '../../icon/plus.png'

export default function POST_Product({ cant_data }) {

    function Add_click(e) {
        cant_data?.(false);
    }

    return (
        <div style={{ marginTop: 16 }}>
            <div className="deploy-item-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 2, gap: 8 }}>
                <button className="button" onClick={Add_click} style={{ padding: '2px 4px' }}>
                    {/* <img src={plus} alt="Add" style={{ width: 12, marginRight: 8, color: '#ffffff' }} /> */}
                    Cancel
                </button>

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
        </div>
    )
}
