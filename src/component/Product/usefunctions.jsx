import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import swal from 'sweetalert';

export default function useFunctions() {

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            // Query the application schema `ap_system.users` table.
            // Ensure your Supabase row-level policies or grants allow this client to select.
            const { data, error } = await supabase
                .from('Product') // schema-qualified table
                .select(`
                    id,
                    pro_img,
                    cost_price,
                    sell_price,
                    sku,
                    pro_name,
                    quantity,
                    created_at,
                    cate_id (
                        id,
                        name
                    ),
                    user (
                        id,
                        fullname,
                        email
                    )
                `)
                .order("created_at", { ascending: false }) // order by created_at descending

            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.error('Failed to fetch ap_system.users:', err)
            alert(err.message || err.error_description || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (item) => {
        const willDelete = await swal({
            title: 'ຕ້ອງການລົບຂໍ້ມູນ ຫຼື ບໍ່?',
            icon: "warning",
            buttons: true,
            dangerMode: true,
        });

        if (!willDelete) {
            // swal("Your data is safe!");
            return;
        }

        const { data, error } = await supabase
            .from("Product")
            .delete()
            .eq("id", item['id']);

        if (error) {
            console.error(error);
            swal(`ບໍ່ສາມາດລົບຂໍ້ມູນ ${item['pro_name']} ໄດ້! ເນືອງຈາກວ່າຂໍ້ມູນນີ້ມີການນຳໃຊ້ຢູ່ (ອໍເດີ້)`, { icon: "error" });
        } else {
            fetchUsers();
            swal("ລົບຂໍ້ມູນສຳເລັດ!", { icon: "success" });
        }
    };

    useEffect(() => {
        fetchUsers()
    }, [])

    return {
        users,
        loading,
        fetchUsers,

        handleDelete
    }
}