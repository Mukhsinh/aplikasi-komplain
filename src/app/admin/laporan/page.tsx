'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Download, Calendar, Filter, Activity, Users, Zap, Briefcase } from 'lucide-react'
import * as xlsx from 'xlsx'
import { createClient } from '@/utils/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'

export default function LaporanEksportPage() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [filterUnit, setFilterUnit] = useState('Semua')
    const [filterJenis, setFilterJenis] = useState('Semua')
    const [ticketData, setTicketData] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])

    // Print configuration
    const [printDate, setPrintDate] = useState(new Date().toISOString().slice(0, 10))
    const [signerName, setSignerName] = useState('')
    const [signerRole, setSignerRole] = useState('')
    const [appSettings, setAppSettings] = useState({ kop_nama: 'Pemerintah Kota Sejahtera', kop_rs: 'Rumah Sakit Umum Daerah', kop_alamat: 'Jl. Jend. Sudirman No. 123, Telepon: (021) 555-0192', kop_kontak: 'Email: rsud@sejahtera.go.id | Website: rsud.sejahtera.go.id' })

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            // 1. Fetch available units
            const { data: unitsData } = await supabase.from('units').select('id, nama').order('nama')
            if (unitsData) setUnits(unitsData)

            // 2. Fetch app settings (key-value pairs)
            const { data: allSettings } = await supabase.from('app_settings').select('setting_key, setting_value')
            if (allSettings) {
                const settingsMap: Record<string, string> = {}
                allSettings.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value })
                setAppSettings({
                    kop_nama: settingsMap['nama_instansi'] || 'Pemerintah Kota Sejahtera',
                    kop_rs: settingsMap['nama_sub_instansi'] || 'Rumah Sakit Umum Daerah',
                    kop_alamat: settingsMap['alamat_instansi'] || 'Jl. Jend. Sudirman No. 123',
                    kop_kontak: settingsMap['kontak_instansi'] || 'Telp/Email'
                })
                setSignerName(settingsMap['nama_penandatangan'] || 'Dr. Mulyadi Saputra, MARS')
                setSignerRole(settingsMap['jabatan_penandatangan'] || 'Direktur Utama RSUD Kota Sejahtera')
            } else {
                setSignerName('Dr. Mulyadi Saputra, MARS')
                setSignerRole('Direktur Utama RSUD Kota Sejahtera')
            }

            // 3. Fetch all tickets
            const { data } = await supabase.from('tickets').select('*, units!unit_id(nama)').order('created_at', { ascending: false })
            if (data) {
                const formatted = data.map((d: any, i: number) => ({
                    id_raw: d.id,
                    no: i + 1,
                    id_tiket: d.tracking_number,
                    tanggal: new Date(d.created_at).toLocaleDateString('id-ID'),
                    raw_date: d.created_at,
                    pengirim: d.data_payload?.nama || 'Anonim',
                    kategori: d.jenis.replace('_', ' ').toUpperCase(),
                    unit: d.units?.nama || 'Global',
                    unit_id: d.unit_id,
                    status: d.status,
                    kepuasan: d.data_payload?.ratings ? 'Dinilai' : '-'
                }))
                setTicketData(formatted)
            }
        }
        fetchData()
    }, [])

    // FILTER LOGIC
    const filteredData = ticketData.filter(t => {
        let matchDate = true
        let matchUnit = true
        let matchJenis = true

        if (dateRange.start && dateRange.end) {
            const ticketDate = new Date(t.raw_date).getTime()
            const sDate = new Date(dateRange.start).getTime()
            // Add 1 day to end date to make it inclusive
            const eDate = new Date(dateRange.end).getTime() + (24 * 60 * 60 * 1000)
            if (ticketDate < sDate || ticketDate > eDate) matchDate = false
        }

        if (filterUnit !== 'Semua' && t.unit_id !== filterUnit) matchUnit = false
        if (filterJenis !== 'Semua' && t.kategori !== filterJenis) matchJenis = false

        return matchDate && matchUnit && matchJenis
    })

    // METRICS
    const totalCount = filteredData.length
    const selesaiCount = filteredData.filter(d => d.status === 'Selesai').length
    const surveiCount = filteredData.filter(d => d.kategori === 'SURVEI').length
    const pengaduanCount = filteredData.filter(d => d.kategori === 'PENGADUAN LAYANAN' || d.kategori === 'ADUAN').length

    // CHART DATA (Trend grouped by category)
    const categoryGroup = filteredData.reduce((acc, curr) => {
        acc[curr.kategori] = (acc[curr.kategori] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const chartData = Object.keys(categoryGroup).map(k => ({
        name: k,
        total: categoryGroup[k]
    }))

    const handleExportExcel = () => {
        setIsGenerating(true)
        setTimeout(() => {
            try {
                const worksheet = xlsx.utils.json_to_sheet(filteredData.map(e => ({
                    No: e.no,
                    'ID Tiket': e.id_tiket,
                    Tanggal: e.tanggal,
                    Pengirim: e.pengirim,
                    Kategori: e.kategori,
                    Unit: e.unit,
                    Status: e.status
                })))
                const workbook = xlsx.utils.book_new()
                xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan_Tiket")
                xlsx.writeFile(workbook, `Laporan_PUAS_${new Date().toISOString().slice(0, 10)}.xlsx`)
            } catch (error) {
                console.error("XLSX export failed:", error)
                alert("Gagal melakukan ekspor.")
            }
            setIsGenerating(false)
        }, 1000)
    }

    const handlePrintPDF = () => {
        window.print()
    }

    return (
        <div className="w-full relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <FileText className="w-8 h-8 text-emerald-500" />
                        Laporan Analisis
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Buat rekapitulasi data layanan berdasarkan jenis, waktu, dan unit instansi.</p>
                </div>
            </div>

            {/* FILTERS & CONTROLS */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> Rentang Waktu
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Briefcase className="w-4 h-4" /> Unit Kerja
                        </label>
                        <select
                            value={filterUnit}
                            onChange={(e) => setFilterUnit(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="Semua">Semua Unit Kerja</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>{u.nama}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Filter className="w-4 h-4" /> Jenis Laporan
                        </label>
                        <select
                            value={filterJenis}
                            onChange={(e) => setFilterJenis(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="Semua">Seluruh Kategori</option>
                            <option value="SURVEI">Survei Kepuasan</option>
                            <option value="PENGADUAN LAYANAN">Pengaduan Layanan</option>
                            <option value="PERMINTAAN INFORMASI">Permintaan Informasi</option>
                        </select>
                    </div>

                    {/* SETTINGS FOR PRINT (INLINE) */}
                    <div className="md:col-span-12 mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1 w-full gap-3 flex flex-col sm:flex-row">
                            <input
                                type="text"
                                value={signerName}
                                onChange={(e) => setSignerName(e.target.value)}
                                placeholder="Nama Penandatangan"
                                className="px-4 py-2 border rounded-xl text-sm font-semibold bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 flex-1"
                            />
                            <input
                                type="text"
                                value={signerRole}
                                onChange={(e) => setSignerRole(e.target.value)}
                                placeholder="Jabatan"
                                className="px-4 py-2 border rounded-xl text-sm font-semibold bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 flex-1 hidden md:block"
                            />
                            <input
                                type="date"
                                value={printDate}
                                onChange={(e) => setPrintDate(e.target.value)}
                                className="px-4 py-2 border rounded-xl text-sm font-semibold bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-slate-200 w-auto"
                            />
                        </div>

                        <div className="flex gap-3 shrink-0">
                            <button
                                disabled={isGenerating}
                                onClick={handleExportExcel}
                                className="px-5 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2 border border-emerald-200"
                            >
                                <Download className="w-5 h-5" />
                                {isGenerating ? 'Memproses...' : 'Ekspor Excel'}
                            </button>

                            <button
                                onClick={handlePrintPDF}
                                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-md shadow-slate-900/20"
                            >
                                <FileText className="w-5 h-5" />
                                Unduh PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SCORE CARDS PREVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:hidden">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Activity className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Data</p>
                        <h4 className="text-2xl font-black text-slate-800">{totalCount}</h4>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Zap className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tiket Selesai</p>
                        <h4 className="text-2xl font-black text-slate-800">{selesaiCount}</h4>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <FileText className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Survei</p>
                        <h4 className="text-2xl font-black text-slate-800">{surveiCount}</h4>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <Users className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Terkait Aduan</p>
                        <h4 className="text-2xl font-black text-slate-800">{pengaduanCount}</h4>
                    </div>
                </motion.div>
            </div>

            {/* TABULAR PREVIEW */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 print:hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-800 text-lg">Pratinjau Data Tabel</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">Data di bawah ini akan di-render saat mencetak PDF berdasarkan filter.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold tracking-wider">Tanggal</th>
                                <th className="px-6 py-4 font-bold tracking-wider">ID Tiket</th>
                                <th className="px-6 py-4 font-bold tracking-wider">Kategori</th>
                                <th className="px-6 py-4 font-bold tracking-wider">Unit Kerja</th>
                                <th className="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.slice(0, 50).map((row) => (
                                <tr key={row.no} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{row.tanggal}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{row.id_tiket}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block mt-3 ml-6">{row.kategori}</td>
                                    <td className="px-6 py-4 font-medium text-slate-600">{row.unit}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${row.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length > 50 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm font-medium text-slate-500 italic">
                                        Menampilkan 50 entri teratas. Ekspor ke Excel untuk melihat semua {filteredData.length} baris data.
                                    </td>
                                </tr>
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
                    <h3 className="text-sm font-bold uppercase underline underline-offset-4">Rekapitulasi Layanan Komplain & Survei</h3>
                    <p className="text-xs mt-1">
                        Filter: Unit ({filterUnit === 'Semua' ? 'Keseluruhan' : units.find(u => u.id === filterUnit)?.nama || filterUnit}) | Kategori ({filterJenis === 'Semua' ? 'Keseluruhan' : filterJenis})
                    </p>
                    <p className="text-xs mt-1">Periode Data: {dateRange.start ? `${dateRange.start} s/d ${dateRange.end || 'Sekarang'}` : 'Seluruh Riwayat'}</p>
                </div>

                {/* KPI/Summary in Print */}
                <div className="flex border border-black mb-6 text-black">
                    <div className="flex-1 p-3 border-r border-black flex flex-col justify-center items-center">
                        <p className="text-[10px] uppercase font-bold text-center mb-1">Total Data Filter</p>
                        <h4 className="text-lg font-bold text-center">{totalCount}</h4>
                    </div>
                    <div className="flex-1 p-3 border-r border-black flex flex-col justify-center items-center">
                        <p className="text-[10px] uppercase font-bold text-center mb-1">Tindakan Selesai</p>
                        <h4 className="text-lg font-bold text-center">{selesaiCount}</h4>
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-center items-center">
                        <p className="text-[10px] uppercase font-bold text-center mb-1">Rasio Selesai</p>
                        <h4 className="text-lg font-bold text-center">
                            {totalCount > 0 ? Math.round((selesaiCount / totalCount) * 100) : 0}%
                        </h4>
                    </div>
                </div>

                {/* Chart Image rendering inside print (Recharts is rendered dynamically in print) */}
                <div className="mb-6 h-[200px] w-full text-black">
                    <p className="text-xs font-bold uppercase mb-2">Sebaran Kategori Layanan:</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#000' }} interval={0} />
                            <YAxis tick={{ fontSize: 10, fill: '#000' }} axisLine={false} tickLine={false} />
                            <Bar dataKey="total" fill="#0f172a" barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={'#64748b'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Dynamic Data Table */}
                <div className="font-sans text-black">
                    <p className="text-xs font-bold uppercase mb-2">Daftar Rekapitulasi Baris:</p>
                    <table className="w-full text-[10px] text-left border-collapse border border-black">
                        <thead className="bg-slate-100 font-bold">
                            <tr>
                                <th className="border border-black p-1.5 text-center w-8">No</th>
                                <th className="border border-black p-1.5 w-24">ID Tiket</th>
                                <th className="border border-black p-1.5">Tanggal</th>
                                <th className="border border-black p-1.5">Kategori</th>
                                <th className="border border-black p-1.5">Unit Tujuan</th>
                                <th className="border border-black p-1.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 && (
                                <tr><td colSpan={6} className="p-4 text-center italic">Memuat data atau data kosong...</td></tr>
                            )}
                            {filteredData.map((row, index) => (
                                <tr key={row.no}>
                                    <td className="border border-black p-1.5 text-center">{index + 1}</td>
                                    <td className="border border-black p-1.5 text-center font-mono">{row.id_tiket}</td>
                                    <td className="border border-black p-1.5">{row.tanggal}</td>
                                    <td className="border border-black p-1.5 font-bold">{row.kategori}</td>
                                    <td className="border border-black p-1.5">{row.unit}</td>
                                    <td className="border border-black p-1.5 text-center">{row.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures */}
                <div className="mt-12 flex justify-end text-black font-sans break-inside-avoid">
                    <div className="text-center w-64">
                        <p className="text-xs mb-16">{appSettings.kop_nama.replace('Pemerintah ', '').replace('Provinsi ', '').replace('Kabupaten ', '')}, {new Date(printDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-xs font-bold underline underline-offset-2">{signerName}</p>
                        <p className="text-[10px] mt-1">{signerRole}</p>
                    </div>
                </div>
            </div>

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
