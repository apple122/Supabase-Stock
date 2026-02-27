import React, { useEffect, useRef, useState } from 'react'

export default function Dropdown({ label = 'Manage', onEdit, onDelete, value = null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    function handleDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleDoc)
    return () => document.removeEventListener('mousedown', handleDoc)
  }, [])

  const btnStyle = { border: 'none', background: 'transparent', cursor: 'pointer', padding: 6 }
  const menuStyle = { position: 'absolute', right: 0, top: '100%', background: '#292929', color: '#fff', boxShadow: '0 6px 14px rgba(0,0,0,0.1)', borderRadius: 6, overflow: 'hidden', zIndex: 1000 }
  const itemStyle = { padding: '8px 12px', width: 60, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="commit" onClick={() => setOpen(s => !s)} style={btnStyle}>{label}</button>
      {open && (
        <div style={menuStyle}>
          <button style={itemStyle} className='button-hover' onClick={() => { setOpen(false); onEdit && onEdit(value) }}>ແກ້ໄຂ</button>
          <button style={itemStyle} className='button-hover' onClick={() => { setOpen(false); onDelete && onDelete(value) }}>ລົບ</button>
        </div>
      )}
    </div>
  )
}
