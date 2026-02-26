import React, { useEffect, useRef, useState } from 'react'
// import useFunctions from './usefunctions'
import GET_Product from './GET_Product'
import POST_Product from './POST_Product'

export default function Product() {

    const [Add, setAdd] = useState(null)

    return (
        <div style={{ marginTop: 16 }}>
            <h3>Product</h3>
            {Add && true ? <POST_Product cant_data={setAdd} /> : <GET_Product add_data={setAdd} />}
        </div>
    )
}
