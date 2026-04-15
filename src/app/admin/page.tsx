import React from 'react'
import { Users, AlertTriangle, CheckCircle, Clock, Activity, ArrowRight, TrendingUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const supabase = await createClient()

    const { count: countTotal } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
    const { count: countMenunggu } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'Terkirim')
    const { count: countSelesai } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'Selesai')

    // Fetch latest tickets requiring action
    const { data: latestTickets } = await supabase
        .from('tickets')
        .select('*, units(nama)')
        .neq('status', 'Selesai')
        .order('created_at', { ascending: false })
        .limit(5)

    const STATS = [
        { label: 'Total Tiket', value: countTotal || 0, icon: Users, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
        { label: 'Menunggu Respon', value: countMenunggu || 0, icon: Clock, color: 'from-orange-400 to-amber-500', shadow: 'shadow-amber-500/20' },
        { label: 'Selesai', value: countSelesai || 0, icon: CheckCircle, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
        { label: 'Warning SLA', value: '0', icon: AlertTriangle, color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' },
    ]

    return (
        <div className="animate-in fade-in zoom-in duration-500 pb-8">
            {/* Header Section */}
            <div className="relative mb-8 p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden shadow-2xl">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-3xl -mr-[20rem] -mt-[20rem] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl -ml-[15rem] -mb-[15rem] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Selamat Datang di Dasbor</h1>
                        <p className="text-slate-300 font-medium max-w-xl text-sm leading-relaxed">
                            Pantau ringkasan performa dan metrik layanan rumah sakit secara real-time. Semua data ditarik secara dinamis dari database utama.
                        </p>
                    </div>

                    <div className="shrink-0">
                        <Link href="/admin/tiket" className="relative group inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-extrabold text-white rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 focus:ring-4 focus:outline-none focus:ring-emerald-300 transition-all shadow-xl shadow-emerald-500/30 hover:-translate-y-1">
                            <span className="relative px-6 py-3 transition-all ease-in duration-200 bg-white/10 backdrop-blur-sm rounded-[10px] flex items-center gap-3">
                                <span className="bg-white/20 p-1.5 rounded-lg">
                                    <Activity className="w-5 h-5 text-white group-hover:animate-pulse" />
                                </span>
                                Kelola Tiket Sekarang
                                <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20 -mt-16 px-4">
                {STATS.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-white/80 backdrop-blur-xl p-6 rounded-[1.5rem] shadow-xl border border-white/40 group hover:-translate-y-2 transition-all duration-300"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-4xl font-black text-slate-800 mt-2 tracking-tighter">{stat.value}</h3>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg text-white transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                <stat.icon className="w-7 h-7 stroke-[2.5]" />
                            </div>
                        </div>
                        <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full w-2/3 bg-gradient-to-r ${stat.color} rounded-full opacity-60`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Tiket Terbaru */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" /> Tiket Butuh Tindakan
                            </h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Antrian terbaru belum selesai</p>
                        </div>
                        <Link href="/admin/tiket" className="group flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors bg-slate-100 hover:bg-emerald-50 px-4 py-2.5 rounded-xl">
                            Lihat Semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {(!latestTickets || latestTickets.length === 0) && (
                            <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <CheckCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p className="font-bold text-slate-500">Semua Beres!</p>
                                <p className="text-sm mt-1">Belum ada tiket masuk atau butuh tindakan saat ini.</p>
                            </div>
                        )}
                        {latestTickets?.map((ticket: any, idx: number) => (
                            <div key={ticket.id} className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                        <Clock className="w-5 h-5 stroke-[2.5]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                                                {ticket.jenis.replace('_', ' ')}
                                            </h4>
                                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                                {ticket.tracking_number}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                                            Status: <span className="text-orange-600 font-bold">{ticket.status}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            Tujuan: {ticket.units?.nama || 'Global'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2 text-slate-400">
                                    <span className="text-[11px] font-bold">{new Date(ticket.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    <Link href="/admin/tiket" className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0">
                                        Respon Sekarang
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SLA Status Widget */}
                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-white flex flex-col justify-between border border-slate-800">
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/20 blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-blue-500/20 blur-2xl -ml-10 -mb-10 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" /> Kepatuhan SLA
                                </h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Performa bulan ini</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-slate-300" />
                            </div>
                        </div>

                        <div className="mt-8 mb-4">
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-300 drop-shadow-sm">100</span>
                                <span className="text-2xl font-bold text-emerald-500">%</span>
                            </div>
                            <p className="text-sm font-bold text-slate-300 bg-slate-800/50 inline-block px-3 py-1 rounded-lg border border-slate-700">Target Tahunan: 95%</p>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed mt-4">
                            Persentase tiket diselesaikan tepat waktu sesuai ambang batas Service Level Agreement.
                        </p>

                        <div className="w-full h-4 bg-slate-800 rounded-full mt-8 overflow-hidden border border-slate-700/50 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-full relative">
                                <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
