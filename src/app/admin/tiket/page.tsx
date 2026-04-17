'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Inbox, Filter, Download, ArrowRight, MessageSquare, Clock, X, CheckCircle, ShieldCheck, Mail, Edit, FileText, AlertTriangle, History as HistoryIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import * as xlsx from 'xlsx'
import { generateFormalPDF } from '@/utils/pdfExport'

export default function AdminTiketPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<any>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const supabase = createClient()
    const [isGenerating, setIsGenerating] = useState(false)
    const [units, setUnits] = useState<any[]>([])
    const [profiles, setProfiles] = useState<any[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [ticketHistory, setTicketHistory] = useState<any[]>([])
    const [actionForm, setActionForm] = useState({
        actionType: 'respon',
        lapor_ke_role: '',
        lapor_unit_id: '',
        eskalasi_unit_id: '',
        tembusan_unit_id: '',
        catatan: '',
        statusUpdate: '' // auto status: 'eskalasi' or 'selesai'
    })

    // Setup for formal print report matching app_settings
    const [printDate, setPrintDate] = useState(new Date().toISOString().slice(0, 10))
    const [signerName, setSignerName] = useState('')
    const [signerRole, setSignerRole] = useState('')
    const [appSettings, setAppSettings] = useState({ kop_nama: 'Pemerintah Kota Sejahtera', kop_rs: 'Rumah Sakit Umum Daerah', kop_alamat: 'Jl. Jend. Sudirman No. 123, Telepon: (021) 555-0192', kop_kontak: 'Email: rsud@sejahtera.go.id | Website: rsud.sejahtera.go.id' })
    const [whatsappKontak, setWhatsappKontak] = useState('')

    // Hidden keys to exclude from data display
    // Hidden keys to exclude from data display
    const HIDDEN_KEYS = ['unit_id', 'id', 'submitter_id', 'original_unit_id', 'tindakan_terakhir', 'unitId', 'unit Id', 'rating', 'ratings']

    const fetchData = async () => {
        setIsLoading(true)

        // Settings - fetch as key-value pairs
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
            setWhatsappKontak(settingsMap['whatsapp_kontak'] || '')
        } else {
            setSignerName('Dr. Mulyadi Saputra, MARS')
            setSignerRole('Direktur Utama RSUD Kota Sejahtera')
        }

        // Tickets
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*, units!unit_id(nama)')
                .eq('id', session.user.id)
                .single()

            const effectiveProfile = profile || { role: 'superadmin', unit_id: null }
            setCurrentUser(effectiveProfile)

            let query = supabase.from('tickets').select('*, units!unit_id(nama)').order('created_at', { ascending: false })

            if (effectiveProfile.role !== 'superadmin' && effectiveProfile.role !== 'admin' && effectiveProfile.unit_id) {
                query = query.or(`unit_id.eq.${effectiveProfile.unit_id},original_unit_id.eq.${effectiveProfile.unit_id}`)
            }

            const { data, error } = await query
            if (error) console.error('Error fetching tickets:', error)
            setTickets(data || [])
        } else {
            setTickets([])
        }

        // Units & Profiles for Escalation
        const { data: unitsData } = await supabase.from('units').select('id, nama').order('nama')
        setUnits(unitsData || [])
        const { data: profilesData } = await supabase.from('profiles').select('id, nama_lengkap, role, unit_id').order('nama_lengkap')
        setProfiles(profilesData || [])

        setIsLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenDetail = async (ticket: any) => {
        setSelectedTicket(ticket)
        setIsDetailOpen(true)
        // Reset action form
        setActionForm({
            actionType: 'respon',
            lapor_ke_role: '',
            lapor_unit_id: '',
            eskalasi_unit_id: '',
            tembusan_unit_id: '',
            catatan: '',
            statusUpdate: ''
        })

        // Fetch History
        const { data: history } = await supabase
            .from('ticket_history')
            .select('*, units!from_unit_id(nama)')
            .eq('ticket_id', ticket.id)
            .order('updated_at', { ascending: false })
        setTicketHistory(history || [])
    }

    const handleExecuteAction = async () => {
        if (!selectedTicket) return;
        setIsUpdating(true);

        const payload = {
            action: actionForm.actionType,
            ...actionForm,
            timestamp: new Date().toISOString()
        };

        const newPayload = {
            ...(selectedTicket.data_payload || {}),
            tindakan_terakhir: payload
        }

        // Determine new status based on checklist
        let newStatus = selectedTicket.status
        if (actionForm.statusUpdate === 'eskalasi') {
            newStatus = 'Diproses'
        } else if (actionForm.statusUpdate === 'selesai') {
            newStatus = 'Selesai'
        }

        // Build the update object
        const updateObj: any = {
            data_payload: newPayload,
            status: newStatus
        }

        // If escalating to another unit, update unit_id so the target sees it
        if (actionForm.actionType === 'eskalasi' && actionForm.eskalasi_unit_id) {
            // Preserve original unit_id for audit trail
            if (!selectedTicket.original_unit_id) {
                updateObj.original_unit_id = selectedTicket.unit_id
            }
            updateObj.unit_id = actionForm.eskalasi_unit_id
        }

        const { error } = await supabase.from('tickets').update(updateObj).eq('id', selectedTicket.id);

        if (!error) {
            const { error: historyError } = await supabase.from('ticket_history').insert({
                ticket_id: selectedTicket.id,
                from_unit_id: currentUser?.unit_id,
                to_unit_id: actionForm.actionType === 'eskalasi' ? actionForm.eskalasi_unit_id :
                    actionForm.actionType === 'lapor' ? actionForm.lapor_unit_id : null,
                status: newStatus,
                notes: actionForm.catatan || (actionForm.actionType === 'eskalasi' ? 'Tiket dieskalasikan' : 'Respon diberikan'),
                updated_by: currentUser?.id
            })

            if (historyError) {
                console.error('History Error:', historyError)
                alert('Peringatan: Tiket diupdate tapi riwayat gagal dicatat: ' + historyError.message)
            }

            setActionForm({ actionType: 'respon', catatan: '', lapor_ke_role: '', lapor_unit_id: '', eskalasi_unit_id: '', tembusan_unit_id: '', statusUpdate: '' });
            fetchData();
            setIsDetailOpen(false);
            alert('Tindakan berhasil dikirim!');
        } else {
            alert('Gagal mengirim tindakan: ' + error.message);
        }
        setIsUpdating(false);
    }

    const handleExportExcel = () => {
        setIsGenerating(true)
        setTimeout(() => {
            const worksheetData = tickets.map((t, index) => {
                const reporter = t.data_pelapor?.nama || t.data_payload?.nama || '-'
                const phone = t.data_pelapor?.hp || t.data_payload?.hp || '-'
                const detail = t.data_payload?.uraian || t.data_payload?.feedback || t.data_payload?.informasi_diminta || '-'

                return {
                    No: index + 1,
                    'ID Tiket': t.tracking_number,
                    Tanggal: new Date(t.created_at).toLocaleString('id-ID'),
                    Kategori: t.jenis.replace('_', ' ').toUpperCase(),
                    Unit: t.units?.nama || 'Global',
                    Status: t.status,
                    'Nama Pemohon / Pelapor': reporter,
                    'Nomor HP Pemohon': phone,
                    'Keperluan / Uraian Detail': detail,
                    'Tindakan Terakhir': t.data_payload?.tindakan_terakhir?.action || '-'
                }
            })

            // Create worksheet
            const worksheet = xlsx.utils.json_to_sheet([])

            // Add Header Rows
            xlsx.utils.sheet_add_aoa(worksheet, [
                [appSettings.kop_nama.toUpperCase()],
                [appSettings.kop_rs.toUpperCase()],
                [`${appSettings.kop_alamat} | ${appSettings.kop_kontak}`],
                [],
                ['LAPORAN MANAJEMEN TIKET KOMPREHENSIF'],
                [`Tanggal Cetak: ${new Date(printDate).toLocaleDateString('id-ID')}`],
                [`Penanggung Jawab Laporan: ${signerName} (${signerRole})`],
                [],
                ['1. Tabulasi Data Tiket Masuk']
            ], { origin: 'A1' })

            // Add actual data starting from A10
            xlsx.utils.sheet_add_json(worksheet, worksheetData, { origin: 'A10' })

            const workbook = xlsx.utils.book_new()
            xlsx.utils.book_append_sheet(workbook, worksheet, "Raw_Tiket")
            xlsx.writeFile(workbook, `Data_Tiket_${new Date().toISOString().slice(0, 10)}.xlsx`)
            setIsGenerating(false)
        }, 1000)
    }

    const handleExportPDF = () => {
        setIsGenerating(true)
        setTimeout(() => {
            const tableHeaders = ['No', 'ID Tiket', 'Tanggal', 'Kategori', 'Unit', 'Status', 'Saran/Uraian'];
            const tableData = tickets.map((t, index) => {
                const detail = t.data_payload?.uraian || t.data_payload?.feedback || t.data_payload?.informasi_diminta || '-'
                return [
                    index + 1,
                    t.tracking_number,
                    new Date(t.created_at).toLocaleString('id-ID'),
                    t.jenis.replace('_', ' ').toUpperCase(),
                    t.units?.nama || 'Global',
                    t.status,
                    detail
                ]
            });

            generateFormalPDF({
                title: 'LAPORAN MANAJEMEN TIKET (KOMPREHENSIF)',
                additionalInfo: [
                    'Laporan ini berisikan rincian seluruh tiket aduan, layanan, dan komplain yang terdaftar dalam sistem.',
                    `Total Laporan: ${tickets.length} Tiket | Tiket Selesai: ${tickets.filter(x => x.status === 'Selesai').length}`,
                    '',
                    '1. Rincian Tiket dan Uraian Laporan:'
                ],
                filename: `Laporan_Tiket_Komprehensif_${new Date().toISOString().slice(0, 10)}.pdf`,
                appSettings,
                printDate,
                signerName,
                signerRole,
                tableHeaders,
                tableData
            });
            setIsGenerating(false)
        }, 500)
    }

    const renderDataSection = (title: string, dataObj: any) => {
        if (!dataObj) return null
        // Filter out hidden keys like unit_id - case insensitive, and also UUID-looking values
        const isUUID = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
        const filteredEntries = Object.entries(dataObj).filter(([key, value]) => {
            const keyLower = key.toLowerCase().replace(/[\s_-]/g, '')
            // Hide technical keys
            if (HIDDEN_KEYS.some(hk => keyLower === hk.toLowerCase().replace(/[\s_-]/g, ''))) return false
            // Hide any key ending with 'id' that has a UUID value
            if (keyLower.endsWith('id') && isUUID(value)) return false
            // Hide internal objects like tindakan_terakhir
            if (key === 'tindakan_terakhir') return false
            return true
        })
        if (filteredEntries.length === 0) return null
        return (
            <div className="mb-6">
                <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{title}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredEntries.map(([key, value]: any) => (
                        <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</p>
                            <p className="text-sm font-semibold text-slate-900">{typeof value === 'object' ? JSON.stringify(value) : (value?.toString() || '-')}</p>
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
                            onClick={handleExportPDF}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 px-4 py-2 text-sm rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                            <FileText className="w-4 h-4" /> {isGenerating ? 'Memroses...' : 'Unduh PDF'}
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
                                <tr key={row.id}>
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

                                {/* HIGHLIGHTED ORIGINAL COMPLAINT NOTE */}
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-black text-emerald-900 text-xs uppercase tracking-widest">Catatan Original Pelapor / Pengirim</h4>
                                    </div>
                                    <div className="bg-white/60 p-4 rounded-xl border border-emerald-100 shadow-inner">
                                        <p className="text-sm font-semibold text-slate-800 leading-relaxed italic">
                                            "{selectedTicket.data_payload?.deskripsi ||
                                                selectedTicket.data_payload?.kronologi ||
                                                selectedTicket.data_payload?.uraian ||
                                                selectedTicket.data_aduan?.deskripsi ||
                                                selectedTicket.data_payload?.feedback ||
                                                'Tidak ada catatan tertulis.'}"
                                        </p>
                                    </div>
                                    {(selectedTicket.data_payload?.saran || selectedTicket.data_aduan?.harapan_pelapor) && (
                                        <div className="mt-4 p-4 bg-white/40 rounded-xl border border-emerald-100 border-dashed">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Harapan / Saran Perbaikan:</p>
                                            <p className="text-xs font-medium text-slate-700">{selectedTicket.data_payload?.saran || selectedTicket.data_aduan?.harapan_pelapor}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Form Data rendering - NO unit_id shown */}
                                <div className="space-y-4">
                                    {renderDataSection('Data Pemohon / Pelapor', selectedTicket.data_pelapor)}
                                    {renderDataSection('Data Kejadian', selectedTicket.data_kejadian)}
                                    {renderDataSection('Aduan & Detail', selectedTicket.data_aduan)}

                                    {/* Fallback if unstructured jsonb */}
                                    {selectedTicket.data_payload && renderDataSection('Informasi Form Survei', selectedTicket.data_payload)}
                                    {selectedTicket.form_data && renderDataSection('Informasi Form', selectedTicket.form_data)}

                                    {/* SLA MONITORING & HISTORY */}
                                    <div className="mt-8 pt-8 border-t border-slate-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wider mb-6">
                                                <HistoryIcon className="w-4 h-4 text-emerald-500" /> Histori Penanganan & SLA
                                            </h4>
                                            {(() => {
                                                const created = new Date(selectedTicket.created_at).getTime()
                                                const now = new Date().getTime()
                                                const hoursDiff = (now - created) / (1000 * 60 * 60)
                                                const isHighPriority = selectedTicket.prioritas === 'high' || selectedTicket.prioritas === 'High'
                                                const slaLimit = isHighPriority ? 4 : 24
                                                const isOverSLA = hoursDiff > slaLimit && selectedTicket.status !== 'Selesai'

                                                return isOverSLA ? (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-tighter rounded-md border border-red-200 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" /> Melebihi SLA ({Math.floor(hoursDiff)} Jam)
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-emerald-100">
                                                        <Clock className="w-3 h-3" /> SLA Aman
                                                    </span>
                                                )
                                            })()}
                                        </div>

                                        <div className="space-y-4">
                                            {ticketHistory.length === 0 ? (
                                                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                    <p className="text-xs text-slate-400 font-medium">Belum ada riwayat eskalasi atau respon unit.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-100 before:z-0">
                                                    {ticketHistory.map((h, idx) => (
                                                        <div key={h.id} className="relative z-10 pl-8">
                                                            <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-4 ring-emerald-50" />
                                                            <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{h.units?.nama || 'Admin'}</span>
                                                                    <span className="text-[9px] text-slate-400 font-bold">{new Date(h.updated_at).toLocaleString('id-ID')}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-700 font-semibold">{h.notes}</p>
                                                                <div className="mt-2 flex items-center gap-1.5">
                                                                    <span className={cn(
                                                                        "text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter",
                                                                        h.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                                    )}>
                                                                        {h.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Tindakan: Respon / Eskalasi / Lapor */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 space-y-4">
                                <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl">
                                    <button onClick={() => setActionForm({ ...actionForm, actionType: 'respon' })} className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", actionForm.actionType === 'respon' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Respon Biasa</button>
                                    <button onClick={() => setActionForm({ ...actionForm, actionType: 'eskalasi' })} className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", actionForm.actionType === 'eskalasi' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Eskalasi</button>
                                    <button onClick={() => setActionForm({ ...actionForm, actionType: 'lapor' })} className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", actionForm.actionType === 'lapor' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Lapor Atasan</button>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div key={actionForm.actionType} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">

                                        {actionForm.actionType === 'eskalasi' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tujuan Eskalasi (Unit Kerja)</label>
                                                    <select value={actionForm.eskalasi_unit_id} onChange={e => setActionForm({ ...actionForm, eskalasi_unit_id: e.target.value })} className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-black">
                                                        <option value="" className="text-black">- Pilih Unit Kerja Tujuan -</option>
                                                        {units.map(u => <option key={u.id} value={u.id} className="text-black">{u.nama}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tembusan (Opsional)</label>
                                                    <select value={actionForm.tembusan_unit_id} onChange={e => setActionForm({ ...actionForm, tembusan_unit_id: e.target.value })} className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-black">
                                                        <option value="" className="text-black">- Tanpa Tembusan -</option>
                                                        {units.map(u => <option key={u.id} value={u.id} className="text-black">{u.nama}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {actionForm.actionType === 'lapor' && (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Unit Kerja Tujuan (Lapor Atasan)</label>
                                                    <select value={actionForm.lapor_unit_id} onChange={e => setActionForm({ ...actionForm, lapor_unit_id: e.target.value })} className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white text-black">
                                                        <option value="" className="text-black">- Pilih Unit Kerja -</option>
                                                        {units.map(u => <option key={u.id} value={u.id} className="text-black">{u.nama}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Catatan Tindakan</label>
                                            <textarea
                                                value={actionForm.catatan}
                                                onChange={e => setActionForm({ ...actionForm, catatan: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-black outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-sm"
                                                placeholder="Tuliskan respon, alasan eskalasi, atau hal penting dari laporan..."
                                                rows={3}
                                            />
                                        </div>

                                        {/* STATUS UPDATE CHECKLIST - before submit button */}
                                        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Update Status Otomatis
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                <label className={cn(
                                                    "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold",
                                                    actionForm.statusUpdate === 'eskalasi'
                                                        ? "border-amber-400 bg-amber-50 text-amber-800 shadow-sm shadow-amber-200/50"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                                )}>
                                                    <input
                                                        type="radio"
                                                        name="statusUpdate"
                                                        value="eskalasi"
                                                        checked={actionForm.statusUpdate === 'eskalasi'}
                                                        onChange={() => setActionForm({ ...actionForm, statusUpdate: 'eskalasi' })}
                                                        className="w-4 h-4 accent-amber-500"
                                                    />
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Eskalasi (Diproses)
                                                </label>
                                                <label className={cn(
                                                    "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold",
                                                    actionForm.statusUpdate === 'selesai'
                                                        ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-200/50"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                                )}>
                                                    <input
                                                        type="radio"
                                                        name="statusUpdate"
                                                        value="selesai"
                                                        checked={actionForm.statusUpdate === 'selesai'}
                                                        onChange={() => setActionForm({ ...actionForm, statusUpdate: 'selesai' })}
                                                        className="w-4 h-4 accent-emerald-500"
                                                    />
                                                    <CheckCircle className="w-4 h-4" />
                                                    Selesai
                                                </label>
                                                {actionForm.statusUpdate && (
                                                    <button
                                                        onClick={() => setActionForm({ ...actionForm, statusUpdate: '' })}
                                                        className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" /> Reset
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button disabled={isUpdating} onClick={handleExecuteAction} className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                            {isUpdating ? <span className="animate-pulse">Menyimpan...</span> : <><MessageSquare className="w-4 h-4" /> Simpan & Kirim Tindakan</>}
                                        </button>
                                    </motion.div>
                                </AnimatePresence>
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
