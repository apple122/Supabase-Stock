import React, { useEffect, useRef, useState } from 'react'
// import useFunctions from './usefunctions'
import GET_Product from './GET_Product'
import POST_Product from './POST_Product'

export default function Product() {

<<<<<<< HEAD
    const [Add, setAdd] = useState(false);

    return (
        <div style={{ marginTop: 16 }}>
            <h3>ສະຕ໋ອກສີນຄ້າ</h3>
=======
    const [Add, setAdd] = useState(null)

    return (
        <div style={{ marginTop: 16 }}>
            <h3>Product</h3>
>>>>>>> 1234b1dff97f49113cd3086a99f37d8c8a8c47ae
            {Add && true ? <POST_Product cant_data={setAdd} /> : <GET_Product add_data={setAdd} />}
        </div>
    )
}
