import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import swal from 'sweetalert';

export default function useFunctions() {

    // POST Data Category
    const [Nane, setName] = useState('')
    const [loadingPost, setLoadingPost] = useState(false)
    const [message, setMessage] = useState()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoadingPost(true)
        setMessage(null)
        try {
            const { data, error } = await supabase
                .from('Category')
                .insert([{ name: Nane }])
                .select()

            if (error) throw error
            setMessage('Category created successfully')
            swal({
                title: "ບັນທືກຂໍ້ມູນປະເພດສີນຄ້າສຳເລັດ!",
                text: "success!",
                icon: "success",
                button: "OK!",
            });
            fetchCG()
            setName('')
        } catch (err) {
            console.error('Insert failed:', err)
            setMessage(err.message || 'Insert failed')
        } finally {
            setLoadingPost(false)
        }
    }

    // GET Data Category 
    const [GC, setGC] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchCG = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('Category') // schema-qualified table
                .select(`id, name, created_at`)
                .order("created_at", { ascending: false }) // order by created_at descending

            if (error) throw error
            setGC(data || [])
        } catch (err) {
            console.error('Failed to fetch ap_system.Category:', err)
            alert(err.message || err.error_description || 'Failed to fetch Category')
        } finally {
            setLoading(false)
        }
    }

    // DELETE Data Category
    const deleteUser = async (id) => {
        const willDelete = await swal({
            title: 'ຕ້ອງການລົບຂໍ້ມູນ ຫຼື ບໍ່?',
            icon: "warning",
            buttons: true,
            dangerMode: true,
        });

        if (!willDelete) {
            swal("Your data is safe!");
            return;
        }

        const { data, error } = await supabase
            .from("Category")
            .delete()
            .eq("id", id);

        if (error) {
            console.error(error);
            swal("Delete failed!", { icon: "error" });
        } else {
            fetchCG();
            swal("ລົບຂໍ້ມູນສຳເລັດ!", { icon: "success" });
        }
    };

    // PUT Data Category 
    const updateCategory = async (e) => {

        const value = await swal( {
            title: `ແກ້ໄຂຂໍ້ມູນ: ${e[1]}`,
            content: 'input',
            inputAttributes: {
                style: "color: red"
            }
        });

        // ถ้ากด cancel หรือไม่กรอกอะไร
        if (!value) return;

        const { data, error } = await supabase
            .from("Category")
            .update({ name: value })
            .eq("id", e[0]);

        if (error) {
            console.error("Update error:", error);
            swal("Update failed!", { icon: "error" });
        } else {
            swal("ແກ້ໄຂຂໍ້ມູນສຳເລັດແລ້ວ successfully!", { icon: "success" });
            fetchCG(); // รีเฟรชข้อมูล
        }
    };

    return {
        handleSubmit,
        Nane, setName,
        loadingPost,
        message,
        GC,
        loading,
        fetchCG,

        deleteUser,
        updateCategory
    }
}
