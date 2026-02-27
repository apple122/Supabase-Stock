import React, { useState } from 'react'
import POST_Order from './POST_Order'
import GET_Order from './GET_Order'

export default function Order() {

  const [Add, setAdd] = useState(false);

  return (
    <div>
      <h3>ການສັ່ງຊື້</h3>
      {Add && true ? <POST_Order cant_data={setAdd} /> : <GET_Order add_data={setAdd} />}

    </div>
  )
}
