import React, { useEffect, useState } from 'react'
import useFunctions from './usefunctions'

export default function Product() {

    let {
        users,
        loading,
        fetchUsers
    } = useFunctions()



    return (
        <div style={{ marginTop: 16 }}>
            <h3>Product</h3>
            <div style={{ marginBottom: 8 }}>
                <button className="button" onClick={fetchUsers} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>


            {loading ? (
                <p>Loading...</p>
            ) : users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <div class="deploy-list">
                    {users.map((u) => (
                        <div class="deploy-item">
                            <div class="left">
                                <div class="id">IMG</div>
                                <div class="env">Production</div>
                            </div>

                            <div class="project">{u.pro_name}</div>

                            <div class="branch">
                                <div class="commit">ຈຳນວນ</div>
                                <div>{u.quantity}</div>
                            </div>
                            <div class="status ready">
                                ● Ready
                            </div>
                            <div class="time">
                                <div class="commit" style={{ display: 'flex' }}>
                                    {u.created_at ? new Date(u.created_at).toLocaleString() : '-'}
                                    <hr style={{ margin: '6px 10px', borderColor: '#ffffff28' }} />
                                    {u.user?.fullname || '-'}</div>
                            </div>
                        </div>
                    ))}

                </div>

            )}


        </div>
    )
}
