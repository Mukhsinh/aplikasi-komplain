'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Building2, Plus, Edit, Trash2, X, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminUnitPage() {
    const [units, setUnits] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({ id: '', nama: '', deskripsi: '' })
    const [isSaving, setIsSaving] = useState(false)
    const supabase = createClient()

    const fetchUnits = async () => {
        setIsLoading(true)
        const { data } = await supabase.from('units').select('*').order('created_at', { ascending: false })
        setUnits(data || [])
        setIsLoading(false)
    }

    useEffect(() => {
        fetchUnits()
    }, [])

    const handleOpenModal = (unit?: any) => {
        if (unit) {
            setFormData({ id: unit.id, nama: unit.nama, deskripsi: unit.deskripsi || '' })
        } else {
            setFormData({ id: '', nama: '', deskripsi: '' })
        }
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus unit ini?')) return
        await supabase.from('units').delete().eq('id', id)
        fetchUnits()
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        if (formData.id) {
            await supabase.from('units').update({
                nama: formData.nama,
                deskripsi: formData.deskripsi
            }).eq('id', formData.id)
        } else {
            await supabase.from('units').insert({
                nama: formData.nama,
                deskripsi: formData.deskripsi
            })
        }
        setIsSaving(false)
        setIsModalOpen(false)
        fetchUnits()
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Master Unit Kerja</h1>
                    <p className="text-sm text-slate-500 font-medium">Kelola daftar unit/departemen di rumah sakit.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md focus:ring-4 focus:ring-primary/20"
                >
                    <Plus className="w-4 h-4" /> Tambah Unit
                </button>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Nama Unit</th>
                                <th className="px-6 py-4">Deskripsi</th>
                                <th className="px-6 py-4">Tgl Dibuat</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Memuat data...</td>
                                </tr>
                            ) : units.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Belum ada data unit kerja.</td>
                                </tr>
                            ) : (
                                units.map((unit: any) => (
                                    <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                {unit.nama}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{unit.deskripsi || '-'}</td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {new Date(unit.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(unit)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm rounded-xl transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(unit.id)} className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 hover:shadow-sm rounded-xl transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[2rem] shadow-xl w-full max-w-md overflow-hidden border border-slate-100"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-extrabold text-slate-800">{formData.id ? 'Edit Unit Kerja' : 'Tambah Unit Baru'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Nama Unit <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        value={formData.nama}
                                        onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Cth: Poli Umum"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Deskripsi</label>
                                    <textarea
                                        rows={3}
                                        value={formData.deskripsi}
                                        onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                        placeholder="Keterangan unit (opsional)..."
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
