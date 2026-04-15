'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Search, CheckCircle2, Clock, MapPin, Inbox, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import AppFooter from '@/components/AppFooter'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/utils/cn'

const STEPS = [
    { id: 'Terkirim', label: 'Laporan Diterima', desc: 'Menunggu verifikasi admin', icon: Inbox },
    { id: 'Diverifikasi', label: 'Diverifikasi', desc: 'Diteruskan ke unit terkait', icon: ShieldCheck },
    { id: 'Diproses', label: 'Sedang Diproses', desc: 'Petugas sedang menindaklanjuti', icon: Clock },
    { id: 'Selesai', label: 'Selesai', desc: 'Penanganan komplain telah rampung', icon: CheckCircle2 }
]

export default function LacakPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin" /></div>}>
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

    // Simulation: Auto search if param exists
    useEffect(() => {
        if (initialNomor) handleSearch(undefined, initialNomor)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSearch = (e?: React.FormEvent, directNumber?: string) => {
        e?.preventDefault()
        const num = directNumber || trackingNumber
        if (!num) return

        setIsSearching(true)

        // Simulate DB fetch
        setTimeout(() => {
            setIsSearching(false)
            // Mock result
            setResult({
                nomor: num.toUpperCase(),
                status: 'Diproses', // 'Terkirim', 'Diverifikasi', 'Diproses', 'Selesai'
                jenis: 'Komplain Pasien',
                tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                unit: 'Poli Umum'
            })
        }, 1000)
    }

    const getStepIndex = (status: string) => {
        return STEPS.findIndex(s => s.id === status)
    }

    return (
        <main className="min-h-screen pb-24 bg-slate-50 relative">
            {/* Dynamic Header directly merged instead of FormHeader for Search Bar focus */}
            <div className="relative w-full overflow-hidden bg-slate-900 rounded-b-[2.5rem] pt-14 pb-12 px-6 shadow-xl text-white">
                <Link href="/" className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-sm hover:bg-white/20">
                    <ChevronLeft className="w-6 h-6" />
                </Link>

                {/* Asymmetrical Graphical Backgrounds */}
                <div
                    className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl from-accent/80 to-primary/80 rounded-full"
                    style={{ transform: 'translate(40%, -50%) rotate(-15deg)', filter: 'blur(40px)', opacity: 0.8 }}
                />

                <div className="relative z-10 flex flex-col items-center text-center mt-4">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm border border-white/20">
                        <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm mb-1">
                        Lacak Tiket
                    </h1>
                    <p className="text-sm font-medium text-slate-200 drop-shadow-sm">
                        Ketahui status laporan layanan Anda secara real-time.
                    </p>

                    <form onSubmit={handleSearch} className="w-full max-w-sm mt-8 relative">
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Masukkan Nomor Tiket..."
                            className="w-full pl-5 pr-14 py-4 rounded-2xl bg-white text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-accent/30 shadow-lg"
                        />
                        <button
                            disabled={isSearching || !trackingNumber}
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-accent text-white rounded-xl flex items-center justify-center disabled:opacity-50"
                        >
                            <Search className="w-5 h-5 pointer-events-none" />
                        </button>
                    </form>
                </div>
            </div>

            <div className="px-6 -mt-6 relative z-20">
                {isSearching && (
                    <div className="glass-panel w-full rounded-3xl p-8 flex flex-col items-center justify-center text-slate-500 min-h-[200px]">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-accent rounded-full animate-spin mb-4" />
                        <p className="text-sm font-bold animate-pulse">Mencari data tiket...</p>
                    </div>
                )}

                {result && !isSearching && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel w-full rounded-3xl p-6 shadow-sm border border-slate-200"
                    >
                        {/* Ticket Information Header */}
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{result.jenis}</p>
                                <h3 className="text-xl font-black text-slate-800 font-mono tracking-wider">{result.nomor}</h3>
                                <p className="text-xs text-slate-500 mt-1">{result.tanggal}</p>
                            </div>
                            <div className="px-3 py-1 bg-primary/10 text-primary font-bold text-xs rounded-full border border-primary/20">
                                {result.unit}
                            </div>
                        </div>

                        {/* Tracking Stepper (Expedition Style) */}
                        <div className="relative pl-6 space-y-8 py-4">
                            {/* the continuous line indicator */}
                            <div className="absolute left-10 top-8 bottom-12 w-0.5 bg-slate-100 rounded-full z-0" />

                            {STEPS.map((step, idx) => {
                                const currentIndex = getStepIndex(result.status)
                                const isCompleted = idx <= currentIndex
                                const isCurrent = idx === currentIndex

                                return (
                                    <div key={step.id} className={cn(
                                        "flex items-start gap-4 relative z-10 transition-all duration-500",
                                        isCompleted ? "opacity-100" : "opacity-40 grayscale"
                                    )}>
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0",
                                            isCompleted
                                                ? (isCurrent ? "bg-accent text-white" : "bg-emerald-500 text-white")
                                                : "bg-slate-200 text-slate-400"
                                        )}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className={cn("font-bold", isCompleted ? "text-slate-800" : "text-slate-400")}>
                                                {step.label}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>

                                            {isCurrent && (
                                                <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider rounded">
                                                    Terakhir Diperbarui
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-6 pt-6 border-t border-slate-100 flex gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(result.nomor)
                                    alert('Nomor tiket berhasil disalin!')
                                }}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                            >
                                Salin Nomor
                            </button>
                        </div>
                    </motion.div>
                )}

                {!result && !isSearching && (
                    <div className="w-full text-center py-10 opacity-60">
                        <p className="text-sm font-medium text-slate-500">Masukkan nomor tiket untuk melihat proses penanganan dokumen/laporan Anda secara real-time.</p>
                    </div>
                )}
            </div>

            <AppFooter />
            <BottomNav />
        </main>
    )
}
