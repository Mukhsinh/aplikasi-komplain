'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Inbox, Filter, Download, ArrowRight, MessageSquare, Clock, X, CheckCircle, ShieldCheck, Mail, Edit, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import * as xlsx from 'xlsx'

export default function AdminTiketPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<any>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const supabase = createClient()
    const [isGenerating, setIsGenerating] = useState(false)

    // Setup for formal print report matching app_settings
    const [printDate, setPrintDate] = useState(new Date().toISOString().slice(0, 10))
    const [signerName, setSignerName] = useState('')
    const [signerRole, setSignerRole] = useState('')
    const [appSettings, setAppSettings] = useState({ kop_nama: 'Pemerintah Kota Sejahtera', kop_rs: 'Rumah Sakit Umum Daerah', kop_alamat: 'Jl. Jend. Sudirman No. 123, Telepon: (021) 555-0192', kop_kontak: 'Email: rsud@sejahtera.go.id | Website: rsud.sejahtera.go.id' })


    const fetchData = async () => {
        setIsLoading(true)

        // Settings
        const { data: settingsData } = await supabase.from('app_settings').select('*').limit(1).single()
        if (settingsData) {
            setAppSettings({
                kop_nama: settingsData.nama_instansi || 'Pemerintah Kota Sejahtera',
                kop_rs: settingsData.nama_sub_instansi || 'Rumah Sakit Umum Daerah',
                kop_alamat: settingsData.alamat_instansi || 'Jl. Jend. Sudirman No. 123',
                kop_kontak: settingsData.kontak_instansi || 'Telp/Email'
            })
            setSignerName(settingsData.nama_penandatangan || 'Dr. Mulyadi Saputra, MARS')
            setSignerRole(settingsData.jabatan_penandatangan || 'Direktur Utama RSUD Kota Sejahtera')
        } else {
            setSignerName('Dr. Mulyadi Saputra, MARS')
            setSignerRole('Direktur Utama RSUD Kota Sejahtera')
        }

        // Tickets
        const { data } = await supabase
            .from('tickets')
            .select('*, units(nama)')
            .order('created_at', { ascending: false })
        setTickets(data || [])
        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenDetail = (ticket: any) => {
        setSelectedTicket(ticket)
        setIsDetailOpen(true)
    }

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedTicket) return
        setIsUpdating(true)
        await supabase.from('tickets').update({ status: newStatus }).eq('id', selectedTicket.id)

        // Optimistic update
        setSelectedTicket({ ...selectedTicket, status: newStatus })
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
        setIsUpdating(false)
    }

    const handleExportExcel = () => {
        setIsGenerating(true)
        setTimeout(() => {
            const worksheetData = tickets.map((t, index) => ({
                No: index + 1,
                'ID Tiket': t.tracking_number,
                Tanggal: new Date(t.created_at).toLocaleString('id-ID'),
                Kategori: t.jenis.replace('_', ' ').toUpperCase(),
                Unit: t.units?.nama || 'Global',
                Status: t.status,
                'Nama Pemohon': t.data_pelapor?.nama || t.data_payload?.nama || '-',
                'Nomor HP': t.data_pelapor?.hp || t.data_payload?.hp || '-'
            }))

            const worksheet = xlsx.utils.json_to_sheet(worksheetData)
            const workbook = xlsx.utils.book_new()
            xlsx.utils.book_append_sheet(workbook, worksheet, "Raw_Tiket")
            xlsx.writeFile(workbook, `Data_Mentah_Tiket_${new Date().toISOString().slice(0, 10)}.xlsx`)
            setIsGenerating(false)
        }, 1000)
    }

    const renderDataSection = (title: string, dataObj: any) => {
        if (!dataObj) return null
        return (
            <div className="mb-6">
                <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{title}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(dataObj).map(([key, value]: any) => (
                        <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-sm font-semibold text-slate-800">{value?.toString() || '-'}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div className="flex-1">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Tiket</h1>
                    <p className="text-sm text-slate-500 font-medium">Kotak masuk untuk seluruh Survei, Komplain Pasien, Permintaan Informasi, dan Aduan Internal.</p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 text-sm rounded-xl font-bold transition-all disabled:opacity-50 hover:bg-emerald-100"
                        >
                            <Download className="w-4 h-4" /> {isGenerating ? 'Memroses...' : 'Ekspor Excel'}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 px-4 py-2 text-sm rounded-xl font-bold transition-all shadow-sm"
                        >
                            <FileText className="w-4 h-4" /> Unduh PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Print config block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 print:hidden flex flex-col md:flex-row gap-4 items-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 min-w-max">
                    <FileText className="w-4 h-4" /> Pengaturan Cetak Formal PDF:
                </div>
                <div className="flex-1 flex gap-3 w-full">
                    <input
                        type="date"
                        value={printDate}
                        onChange={(e) => setPrintDate(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Nama Penandatangan"
                        className="px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-slate-300 flex-1"
                    />
                    <input
                        type="text"
                        value={signerRole}
                        onChange={(e) => setSignerRole(e.target.value)}
                        placeholder="Jabatan"
                        className="px-3 py-2 border rounded-lg text-sm bg-white text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-slate-300 flex-1 hidden md:block"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden relative print:hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">ID Pelacakan</th>
                                <th className="px-6 py-4">Jenis & Waktu</th>
                                <th className="px-6 py-4">Tujuan Eskalasi</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Memuat antrian tiket...</td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Kotak masuk bersih. Belum ada antrian tiket.</td>
                                </tr>
                            ) : (
                                tickets.map((ticket: any) => (
                                    <tr key={ticket.id} onClick={() => handleOpenDetail(ticket)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                {ticket.tracking_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800 capitalize flex items-center gap-2">
                                                {ticket.jenis.replace('_', ' ')}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-indigo-100 tracking-wide">
                                                {ticket.units?.nama || 'Global'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border
                                                ${ticket.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                    ticket.status === 'Diproses' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        ticket.status === 'Diverifikasi' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                                            'bg-orange-100 text-orange-700 border-orange-200'
                                                }
                                            `}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm focus:ring-2 focus:ring-emerald-500/20">
                                                    Detail <ArrowRight className="w-3 h-3" />
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

            {/* --- FORMAL PRINT TEMPLATE (VISIBLE ONLY ON PRINT/PREVIEW) --- */}
            <div className="hidden print:block bg-white p-0 mx-auto max-w-[210mm] w-[100%] min-h-[297mm]">
                {/* Kop Surat MENGGUNAKAN APP_SETTINGS */}
                <div className="flex items-center justify-between border-b-[3px] border-black pb-4 mb-1 border-double">
                    <div className="w-20 h-20 bg-slate-200 flex items-center justify-center font-bold text-slate-500 rounded-lg shrink-0 border border-slate-300">
                        LOGO
                    </div>
                    <div className="text-center flex-1 px-4 text-black">
                        <h1 className="text-xl font-bold uppercase tracking-wider">{appSettings.kop_nama}</h1>
                        <h2 className="text-lg font-bold uppercase tracking-wider">{appSettings.kop_rs}</h2>
                        <p className="text-xs mt-1">{appSettings.kop_alamat}</p>
                        <p className="text-xs">{appSettings.kop_kontak}</p>
                    </div>
                    <div className="w-20 shrink-0" />
                </div>
                <div className="border-b-[1px] border-black mb-6 w-full" />

                {/* Title */}
                <div className="text-center mb-6 text-black">
                    <h3 className="text-sm font-bold uppercase underline underline-offset-4">Dokumen Rekam Data Tiket Mutu Eksternal / Internal</h3>
                    <p className="text-xs mt-1">Tanggal Cetak Dokumen: {new Date(printDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                {/* KPI/Summary in Print */}
                <div className="flex border border-black mb-6 text-black">
                    <div className="flex-1 p-3 flex flex-col justify-center items-center font-bold">
                        <p className="text-[10px] uppercase text-center mb-1">Total Data</p>
                        <h4 className="text-xl text-center">{tickets.length}</h4>
                    </div>
                </div>

                {/* Dynamic Data Table */}
                <div className="font-sans text-black">
                    <p className="text-xs font-bold uppercase mb-2">Metadata Tiket:</p>
                    <table className="w-full text-[10px] text-left border-collapse border border-black">
                        <thead className="bg-slate-100 font-bold">
                            <tr>
                                <th className="border border-black p-1.5 text-center w-8">No</th>
                                <th className="border border-black p-1.5 w-24">ID Tiket</th>
                                <th className="border border-black p-1.5 w-24">Tanggal</th>
                                <th className="border border-black p-1.5">Kategori</th>
                                <th className="border border-black p-1.5">Unit Tujuan</th>
                                <th className="border border-black p-1.5">Pengirim</th>
                                <th className="border border-black p-1.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 && (
                                <tr><td colSpan={7} className="p-4 text-center italic">Memuat data atau data kosong...</td></tr>
                            )}
                            {tickets.map((row, index) => (
                                <tr key={row.no}>
                                    <td className="border border-black p-1.5 text-center">{index + 1}</td>
                                    <td className="border border-black p-1.5 text-center font-mono">{row.tracking_number}</td>
                                    <td className="border border-black p-1.5">{new Date(row.created_at).toLocaleDateString('id-ID')}</td>
                                    <td className="border border-black p-1.5 font-bold uppercase">{row.jenis.replace('_', ' ')}</td>
                                    <td className="border border-black p-1.5">{row.units?.nama || 'Global'}</td>
                                    <td className="border border-black p-1.5">{row.data_pelapor?.nama || row.data_payload?.nama || 'Anonim'}</td>
                                    <td className="border border-black p-1.5 text-center">{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures */}
                <div className="mt-12 flex justify-end text-black font-sans break-inside-avoid">
                    <div className="text-center w-64">
                        <p className="text-xs mb-16">Kota Sejahtera, {new Date(printDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs font-bold underline underline-offset-2">{signerName}</p>
                        <p className="text-[10px] mt-1">{signerRole}</p>
                    </div>
                </div>
            </div>

            {/* Slide-over Panel for Ticket Details (Hidden on print) */}
            <AnimatePresence>
                {isDetailOpen && selectedTicket && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDetailOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:pl-72 print:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%', opacity: 0.5 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.5 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full lg:right-0 lg:left-auto pt-16 lg:pt-0 print:hidden"
                        >
                            {/* Slide-over Header */}
                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
                                        Detail Tiket
                                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md border border-slate-300">
                                            {selectedTicket.tracking_number}
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1 capitalize font-medium">{selectedTicket.jenis.replace('_', ' ')} • {new Date(selectedTicket.created_at).toLocaleString('id-ID')}</p>
                                </div>
                                <button onClick={() => setIsDetailOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shadow-sm">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Slide-over Body */}
                            <div className="flex-1 overflow-y-auto p-6">

                                {/* Ticket Progress Logic */}
                                <div className="mb-8">
                                    <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <Edit className="w-4 h-4 text-primary" /> Status Terkini
                                    </h4>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {['Terkirim', 'Diverifikasi', 'Diproses', 'Selesai'].map((statusOption) => {
                                            const isActive = selectedTicket.status === statusOption
                                            return (
                                                <button
                                                    key={statusOption}
                                                    disabled={isUpdating || isActive}
                                                    onClick={() => handleUpdateStatus(statusOption)}
                                                    className={cn(
                                                        "px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2",
                                                        isActive
                                                            ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    {statusOption === 'Terkirim' && <Mail className="w-3.5 h-3.5" />}
                                                    {statusOption === 'Diverifikasi' && <ShieldCheck className="w-3.5 h-3.5" />}
                                                    {statusOption === 'Diproses' && <Clock className="w-3.5 h-3.5" />}
                                                    {statusOption === 'Selesai' && <CheckCircle className="w-3.5 h-3.5" />}
                                                    {statusOption}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3 font-medium">Klik status lain untuk meng-update tiket ini secara langsung.</p>
                                </div>

                                {/* Form Data rendering */}
                                <div className="space-y-2">
                                    {renderDataSection('Data Pemohon / Pelapor', selectedTicket.data_pelapor)}
                                    {renderDataSection('Data Kejadian', selectedTicket.data_kejadian)}
                                    {renderDataSection('Aduan & Detail', selectedTicket.data_aduan)}

                                    {/* Fallback if unstructured jsonb */}
                                    {selectedTicket.data_payload && renderDataSection('Informasi Form Survei', selectedTicket.data_payload)}
                                    {selectedTicket.form_data && renderDataSection('Informasi Form', selectedTicket.form_data)}
                                </div>
                            </div>

                            {/* Slide-over Footer */}
                            <div className="p-6 border-t border-slate-100 bg-white shrink-0 space-y-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Catatan Respon Publik (Opsional)</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                    placeholder="Tuliskan respon atau balasan yang dapat dilacak via No. Tiket..."
                                    rows={3}
                                />
                                <button className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Simpan & Kirim Respon
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Global Print CSS Override */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body { background: white !important; font-family: 'Times New Roman', Times, serif; }
          main, aside, nav, header { display: none !important; }
        }
      `}} />
        </div>
    )
}
