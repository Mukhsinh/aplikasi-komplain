'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Search, CheckCircle2, Clock, MapPin, Inbox, ShieldCheck, Copy, Phone, MessageCircle, ArrowUpRight, FileText, Building2 } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import AppFooter from '@/components/AppFooter'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/utils/cn'
import { createClient } from '@/utils/supabase/client'

const STEPS = [
    { id: 'Terkirim', label: 'Laporan Diterima', desc: 'Laporan berhasil tercatat dalam sistem', icon: Inbox, color: 'from-blue-500 to-indigo-600' },
    { id: 'Diverifikasi', label: 'Diverifikasi', desc: 'Telah diverifikasi dan diteruskan ke unit terkait', icon: ShieldCheck, color: 'from-violet-500 to-purple-600' },
    { id: 'Diproses', label: 'Sedang Diproses', desc: 'Petugas sedang menindaklanjuti laporan', icon: Clock, color: 'from-amber-500 to-orange-600' },
    { id: 'Selesai', label: 'Selesai', desc: 'Penanganan telah diselesaikan', icon: CheckCircle2, color: 'from-emerald-500 to-green-600' }
]

export default function LacakPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin" /></div>}>
            <LacakContent />
        </Suspense>
    )
}

function LacakContent() {
    const searchParams = useSearchParams()
    const initialNomor = searchParams.get('nomor') || ''

    const [trackingNumber, setTrackingNumber] = useState(initialNomor)
    const [isSearching, setIsSearching] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [copied, setCopied] = useState(false)
    const [whatsappKontak, setWhatsappKontak] = useState('')

    // Simulation: Auto search if param exists
    useEffect(() => {
        // Fetch whatsapp kontak from settings
        const fetchSettings = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('app_settings').select('setting_key, setting_value').eq('setting_key', 'whatsapp_kontak').single()
            if (data?.setting_value) setWhatsappKontak(data.setting_value)
        }
        fetchSettings()
        if (initialNomor) handleSearch(undefined, initialNomor)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSearch = async (e?: React.FormEvent, directNumber?: string) => {
        e?.preventDefault()
        const num = directNumber || trackingNumber
        if (!num) return

        setIsSearching(true)
        setResult(null)

        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('tickets')
                .select('*, units!unit_id(nama)')
                .eq('tracking_number', num.toUpperCase())
                .single()

            if (error || !data) {
                setResult('not_found')
            } else {
                setResult({
                    nomor: data.tracking_number,
                    status: data.status,
                    jenis: data.jenis.replace('_', ' '),
                    tanggal: new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    tanggal_raw: data.created_at,
                    unit: data.units?.nama || 'Global',
                    catatan: data.data_payload?.tindakan_terakhir?.catatan || null,
                    tindakan: data.data_payload?.tindakan_terakhir || null,
                    updated_at: data.updated_at
                })
            }
        } catch (err) {
            setResult('not_found')
        } finally {
            setIsSearching(false)
        }
    }

    const getStepIndex = (status: string) => {
        return STEPS.findIndex(s => s.id === status)
    }

    const handleCopy = () => {
        if (result && result.nomor) {
            navigator.clipboard.writeText(result.nomor)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const getProgressPercent = () => {
        if (!result || result === 'not_found') return 0;
        const idx = getStepIndex(result.status)
        return ((idx + 1) / STEPS.length) * 100
    }

    const getWhatsappUrl = () => {
        if (!whatsappKontak) return '#'
        const number = whatsappKontak.replace(/\D/g, '')
        const text = result
            ? `Halo, saya ingin menanyakan status tiket saya dengan nomor: ${result.nomor}`
            : 'Halo, saya ingin menanyakan status tiket saya.'
        return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    }

    return (
        <main className="min-h-screen pb-24 bg-gradient-to-b from-slate-50 to-slate-100 relative">
            {/* Hero Header */}
            <div className="relative w-full overflow-hidden bg-slate-900 rounded-b-[2.5rem] pt-14 pb-14 px-6 shadow-xl text-white">
                <Link href="/" className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm hover:bg-white/20 transition-all">
                    <ChevronLeft className="w-6 h-6" />
                </Link>

                {/* Dynamic gradient blobs */}
                <div
                    className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl from-accent/80 to-primary/80 rounded-full"
                    style={{ transform: 'translate(40%, -50%) rotate(-15deg)', filter: 'blur(40px)', opacity: 0.8 }}
                />
                <div
                    className="absolute bottom-0 left-0 w-[80%] h-[80%] bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 rounded-full"
                    style={{ transform: 'translate(-40%, 50%)', filter: 'blur(60px)', opacity: 0.5 }}
                />

                <div className="relative z-10 flex flex-col items-center text-center mt-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 shadow-lg"
                    >
                        <MapPin className="w-8 h-8 text-white" />
                    </motion.div>
                    <motion.h1
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="text-3xl font-extrabold tracking-tight drop-shadow-sm mb-1"
                    >
                        Lacak Tiket
                    </motion.h1>
                    <motion.p
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm font-medium text-slate-200 drop-shadow-sm max-w-xs"
                    >
                        Pantau status penanganan laporan Anda secara real-time.
                    </motion.p>

                    <motion.form
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onSubmit={handleSearch}
                        className="w-full max-w-sm mt-8 relative"
                    >
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                            placeholder="Masukkan Nomor Tiket..."
                            className="w-full pl-5 pr-14 py-4 rounded-2xl bg-white text-black font-bold focus:outline-none focus:ring-4 focus:ring-accent/30 shadow-lg placeholder:text-slate-400"
                        />
                        <button
                            disabled={isSearching || !trackingNumber}
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-br from-accent to-emerald-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
                        >
                            {isSearching
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <Search className="w-5 h-5 pointer-events-none" />
                            }
                        </button>
                    </motion.form>
                </div>
            </div>

            <div className="px-6 -mt-6 relative z-20 max-w-lg mx-auto">
                {/* Loading state */}
                <AnimatePresence>
                    {isSearching && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full rounded-3xl p-10 flex flex-col items-center justify-center bg-white shadow-xl border border-slate-100"
                        >
                            <div className="relative mb-5">
                                <div className="w-14 h-14 border-4 border-slate-100 border-t-accent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <p className="text-sm font-bold text-slate-600 animate-pulse">Mencari tiket di sistem...</p>
                            <p className="text-xs text-slate-400 mt-1">Mohon tunggu sebentar</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Not Found state */}
                <AnimatePresence>
                    {result === 'not_found' && !isSearching && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl bg-white mb-6 border border-red-100"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Tiket Tidak Ditemukan</h3>
                            <p className="text-sm text-slate-500">Nomor tiket <strong className="text-red-500 font-mono">{trackingNumber}</strong> tidak dapat ditemukan di sistem.</p>
                            <p className="text-xs text-slate-400 mt-2">Periksa kembali nomor tiket Anda atau hubungi petugas.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* RESULT - Modern tracking card */}
                <AnimatePresence>
                    {result && result !== 'not_found' && !isSearching && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full space-y-5"
                        >
                            {/* Ticket Info Card */}
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                                {/* Progress bar */}
                                <div className="relative h-2 bg-slate-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${getProgressPercent()}%` }}
                                        transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                                        className={cn(
                                            "absolute inset-y-0 left-0 rounded-r-full",
                                            result.status === 'Selesai'
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                : 'bg-gradient-to-r from-accent to-primary'
                                        )}
                                    />
                                </div>

                                <div className="p-6">
                                    {/* Ticket Header */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1 flex items-center gap-1.5">
                                                <FileText className="w-3 h-3" />
                                                {result.jenis}
                                            </p>
                                            <h3 className="text-2xl font-black text-black font-mono tracking-wider">{result.nomor}</h3>
                                            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {result.tanggal}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={cn(
                                                "px-3 py-1.5 text-xs font-extrabold rounded-xl border shadow-sm",
                                                result.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    result.status === 'Diproses' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        result.status === 'Diverifikasi' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                            )}>
                                                {result.status}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                <Building2 className="w-3 h-3" />
                                                {result.unit}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Tracking Timeline */}
                                    <div className="relative mt-6">
                                        {/* Vertical line */}
                                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent z-0 rounded-full" />

                                        <div className="space-y-1">
                                            {STEPS.map((step, idx) => {
                                                const currentIndex = getStepIndex(result.status)
                                                const isCompleted = idx <= currentIndex
                                                const isCurrent = idx === currentIndex
                                                const isPast = idx < currentIndex

                                                return (
                                                    <motion.div
                                                        key={step.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.4 + idx * 0.15 }}
                                                        className={cn(
                                                            "flex items-start gap-4 relative z-10 p-3 rounded-2xl transition-all duration-500",
                                                            isCurrent ? "bg-slate-50 border border-slate-100 shadow-sm" : "",
                                                            !isCompleted ? "opacity-30" : ""
                                                        )}
                                                    >
                                                        {/* Step indicator */}
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm border",
                                                            isCurrent
                                                                ? `bg-gradient-to-br ${step.color} text-white border-transparent shadow-lg`
                                                                : isPast
                                                                    ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                                                                    : "bg-slate-100 text-slate-300 border-slate-200"
                                                        )}>
                                                            <step.icon className="w-5 h-5" />
                                                        </div>

                                                        <div className="flex-1 min-w-0 pt-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={cn(
                                                                    "font-bold text-sm",
                                                                    isCompleted ? "text-black" : "text-slate-400"
                                                                )}>
                                                                    {step.label}
                                                                </h4>
                                                                {isCurrent && (
                                                                    <span className="relative flex h-2.5 w-2.5">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={cn(
                                                                "text-xs mt-0.5",
                                                                isCompleted ? "text-slate-500" : "text-slate-300"
                                                            )}>{step.desc}</p>
                                                            {isCurrent && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: 1 }}
                                                                    className="mt-2 flex items-center gap-2"
                                                                >
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider rounded-lg border border-accent/20">
                                                                        <Clock className="w-3 h-3" />
                                                                        Status Saat Ini
                                                                    </span>
                                                                </motion.div>
                                                            )}
                                                            {isPast && isCompleted && (
                                                                <p className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Selesai
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Notes */}
                            <AnimatePresence>
                                {result.catatan && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
                                    >
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-3 border-b border-amber-100/60 flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                                <MessageCircle className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Catatan Respon Penanganan</p>
                                        </div>
                                        <div className="p-5">
                                            <p className="text-sm font-medium text-black leading-relaxed">
                                                &quot;{result.catatan}&quot;
                                            </p>
                                            {result.tindakan?.actionType && (
                                                <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-wider">
                                                    Jenis Tindakan: <span className="text-slate-600 capitalize">{result.tindakan.actionType}</span>
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Last updated */}
                            {result.updated_at && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                    className="text-center"
                                >
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        Terakhir Diperbarui: {new Date(result.updated_at).toLocaleString('id-ID')}
                                    </p>
                                </motion.div>
                            )}

                            {/* Action buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 }}
                                className="grid grid-cols-2 gap-3"
                            >
                                <button
                                    onClick={handleCopy}
                                    className={cn(
                                        "py-3.5 bg-white border border-slate-200 font-bold text-sm rounded-2xl transition-all hover:-translate-y-0.5 relative overflow-hidden group shadow-sm flex items-center justify-center gap-2",
                                        copied ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-black"
                                    )}
                                >
                                    {copied ? (
                                        <><CheckCircle2 className="w-4 h-4" /> Tersalin!</>
                                    ) : (
                                        <><Copy className="w-4 h-4" /> Salin Nomor</>
                                    )}
                                </button>
                                {whatsappKontak && (
                                    <a
                                        href={getWhatsappUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm rounded-2xl transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
                                    >
                                        <Phone className="w-4 h-4" /> Hubungi WA
                                        <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty state */}
                {!result && !isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="w-full text-center py-10"
                    >
                        <div className="w-20 h-20 mx-auto bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                            <MapPin className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Masukkan Nomor Tiket</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Masukkan nomor pelacakan yang tertera di bukti laporan Anda untuk melihat status terkini.</p>
                    </motion.div>
                )}
            </div>

            <AppFooter />
            <BottomNav />
        </main>
    )
}
