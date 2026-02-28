import React, { useEffect, useRef, useState } from 'react'
// import useFunctions from './usefunctions'
import GET_Product from './GET_Product'
import POST_Product from './POST_Product'

export default function Product() {

    const [Add, setAdd] = useState(() => {
        const nav = localStorage.getItem('Navigate')
        if (nav) {
            try {
                const parsed = JSON.parse(nav)
                return parsed[0] === 'Product' && parsed[1] === true
            } catch (e) {
                return false
            }
        }
        return false
    })

    return (
        <div>
            <h3>ສະຕ໋ອກສີນຄ້າ</h3>
            {Add && true ? <POST_Product cant_data={setAdd} /> : <GET_Product add_data={setAdd} />}
        </div>
    )
}
