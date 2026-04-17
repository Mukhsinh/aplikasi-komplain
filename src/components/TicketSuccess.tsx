'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, Copy, ArrowLeft, Phone } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface TicketSuccessProps {
    trackingNumber: string
    title?: string
    message?: string
    jenis: string
}

export default function TicketSuccess({ trackingNumber, title = 'Laporan Diterima!', message = 'Data Anda telah tersimpan. Tim kami akan segera menindaklanjuti.', jenis }: TicketSuccessProps) {
    const [csPhone, setCsPhone] = useState('1234567890')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'cs_phone').single()
            if (data?.setting_value) setCsPhone(data.setting_value)
        }
        fetchSettings()
    }, [])

    const copyTrack = () => {
        navigator.clipboard.writeText(trackingNumber)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const now = new Date()
        const content = `
========================================
        TANDA TERIMA LAPORAN
        PUAS - KANAL ADUAN, SURVEI,
        INFORMASI INTERAKTIF
========================================

Jenis Layanan   : ${jenis}
Nomor Tiket     : ${trackingNumber}
Tanggal         : ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
Waktu           : ${now.toLocaleTimeString('id-ID')}

----------------------------------------
Status          : Baru (Menunggu Proses)
----------------------------------------

Gunakan nomor tiket di atas untuk
melacak progres laporan Anda melalui
menu "Lacak Tiket" pada aplikasi PUAS.

Kontak Customer Service:
📞 ${csPhone}
💬 wa.me/${csPhone.replace(/^0/, '62')}

========================================
    Terima kasih atas partisipasi Anda
========================================
`.trim()

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Tiket_${trackingNumber}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <main className="min-h-screen pb-24 bg-slate-50 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-100"
            >
                {/* Green Gradient Banner */}
                <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-8 pb-12 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="relative w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30"
                    >
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">{title}</h2>
                    <p className="text-emerald-50 text-sm mt-2 leading-relaxed max-w-[260px] mx-auto">{message}</p>
                </div>

                {/* Ticket Card */}
                <div className="px-6 -mt-6 relative z-10">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Nomor Pelacakan</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-mono font-extrabold text-slate-800 tracking-wider">{trackingNumber}</p>
                            <button onClick={copyTrack} className="p-2 -m-2 hover:bg-slate-50 rounded-lg transition-colors" title="Salin">
                                <Copy className={`w-4 h-4 transition-colors ${copied ? 'text-emerald-500' : 'text-slate-400'}`} />
                            </button>
                        </div>
                        {copied && <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ Tersalin ke clipboard</p>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pt-5 pb-6 space-y-3">
                    <button onClick={handleDownload} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-colors shadow-md cursor-pointer">
                        <Download className="w-4 h-4" /> Unduh Tanda Terima
                    </button>
                    <Link href={`/lacak?nomor=${trackingNumber}`} className="w-full py-3.5 bg-primary hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-colors shadow-md">
                        Lacak Progres
                    </Link>
                    <Link href="/" className="w-full py-3 bg-white text-slate-500 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                    </Link>

                    {/* CS Contact */}
                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
                        <Phone className="w-3 h-3" />
                        <span>CS: <a href={`https://wa.me/${csPhone.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">{csPhone}</a></span>
                    </div>
                </div>
            </motion.div>
        </main>
    )
}
