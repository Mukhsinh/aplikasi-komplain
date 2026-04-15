'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, Send, ShieldAlert, AlertTriangle, FileText, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import FormHeader from '@/components/FormHeader'
import BottomNav from '@/components/BottomNav'
import AppFooter from '@/components/AppFooter'
import TicketSuccess from '@/components/TicketSuccess'
import { cn } from '@/utils/cn'
import { createClient } from '@/utils/supabase/client'

const KATEGORI_MASALAH = [
    { value: 'sarana', label: 'Sarana & Prasarana', desc: 'Kerusakan alat medis, gangguan IT/SIMRS, masalah gedung/listrik/air' },
    { value: 'workflow', label: 'Alur Kerja (Workflow)', desc: 'Koordinasi antar unit buruk, hambatan birokrasi, SOP tidak jelas' },
    { value: 'sdm', label: 'Sumber Daya Manusia', desc: 'Kekurangan tenaga, masalah perilaku/etika, konflik internal' },
    { value: 'k3', label: 'Keselamatan & Kesehatan Kerja (K3)', desc: 'Paparan limbah B3, kecelakaan kerja, risiko keamanan' },
    { value: 'logistik', label: 'Logistik & Farmasi', desc: 'Kekosongan stok obat/BMHP, keterlambatan suplai' },
]
const URGENSI_OPTIONS = [
    { value: 'critical', label: '🔴 Critical', desc: 'Mengganggu pelayanan pasien / mengancam nyawa' },
    { value: 'urgent', label: '🟡 Urgent', desc: 'Menghambat pekerjaan tetapi pelayanan tetap berjalan' },
    { value: 'routine', label: '🟢 Routine', desc: 'Masalah administratif/fasilitas yang tidak mendesak' },
]
const DAMPAK_OPTIONS = ['Penurunan kualitas asuhan pasien', 'Pemborosan waktu/inefisiensi', 'Risiko finansial/kerugian materi', 'Gangguan kesehatan mental/fisik staf']

export default function AduanInternalPage() {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [ticketNumber, setTicketNumber] = useState<string | null>(null)
    const [unitOptions, setUnitOptions] = useState<{ id: string, nama: string }[]>([])

    useEffect(() => {
        const fetchUnits = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('units').select('id, nama').order('nama')
            if (data) setUnitOptions(data)
        }
        fetchUnits()
    }, [])

    const [form, setForm] = useState({
        nama: '', unitAsal: '', jabatan: '',
        kategori: '', urgensi: '',
        waktuLokasi: '', unitDilaporkan: '', kronologi: '',
        dampak: [] as string[], saran: '',
    })

    const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }))
    const toggleDampak = (val: string) => setForm(p => ({ ...p, dampak: p.dampak.includes(val) ? p.dampak.filter(v => v !== val) : [...p.dampak, val] }))

    const canProceed1 = form.unitAsal
    const canProceed2 = form.kategori && form.urgensi
    const canProceed3 = form.kronologi.length >= 20

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const supabase = createClient()
        const trackNo = `ADI-${Math.floor(10000 + Math.random() * 90000)}`
        const { error } = await supabase.from('tickets').insert({
            tracking_number: trackNo,
            jenis: 'aduan_internal',
            status: 'Terkirim',
            data_payload: form
        })
        setTimeout(() => {
            setIsSubmitting(false)
            if (!error) setTicketNumber(trackNo)
            else alert('Gagal mengirim: ' + error.message)
        }, 1000)
    }

    if (ticketNumber) {
        return <TicketSuccess trackingNumber={ticketNumber} title="Aduan Terkirim!" message="Laporan Anda telah masuk ke sistem secara aman. Tim manajemen akan segera menindaklanjuti." jenis="ADUAN INTERNAL" />
    }

    const StepLabel = ({ n, label, active }: { n: number; label: string; active: boolean }) => (
        <div className={cn("flex items-center gap-1.5 transition-all", active ? "opacity-100" : "opacity-40")}>
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2", active ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-400 border-slate-200")}>{n}</div>
            <span className="text-[9px] font-bold text-slate-600 hidden sm:inline">{label}</span>
        </div>
    )

    return (
        <main className="min-h-screen pb-24 bg-slate-50 font-sans">
            <Link href="/" className="absolute top-6 left-6 z-20 w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 border border-white/60 shadow-sm cursor-pointer hover:bg-white transition-colors"><ChevronLeft className="w-6 h-6" /></Link>
            <FormHeader title="Aduan Internal" subtitle="Formulir Pengaduan Internal (Insiden & Fasilitas)" iconUrl="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Police%20car%20light/3D/police_car_light_3d.png" />

            <div className="px-6 -mt-8 relative z-20">
                <div className="flex items-center justify-between mb-6 px-1">
                    {[{ n: 1, l: 'Identitas' }, { n: 2, l: 'Klasifikasi' }, { n: 3, l: 'Kronologi' }, { n: 4, l: 'Dampak & Saran' }].map((s, i) => (
                        <React.Fragment key={s.n}><StepLabel n={s.n} label={s.l} active={step >= s.n} />{i < 3 && <div className={cn("flex-1 h-0.5 mx-1", step > s.n ? "bg-red-600" : "bg-slate-200")} />}</React.Fragment>
                    ))}
                </div>

                <div className="bg-white w-full rounded-[2rem] p-6 shadow-md shadow-slate-200/50 border border-slate-100">

                    {/* STEP 1: Identitas */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><ShieldAlert className="w-5 h-5" /></div>
                                <div><h3 className="font-bold text-slate-800 text-sm">1. Identitas Pelapor</h3><p className="text-[10px] text-slate-500 font-semibold">Sifat: Rahasia / Anonim</p></div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-800 text-xs font-medium">Kerahasiaan data pelapor akan dijaga. Nama dan NIP bersifat opsional untuk perlindungan pelapor.</div>
                            <div className="space-y-4">
                                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Nama / NIK <span className="text-slate-400">(Opsional)</span></label><input value={form.nama} onChange={e => set('nama', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" placeholder="Boleh dikosongkan" /></div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-2 block">Unit Kerja Asal <span className="text-red-500">*</span></label>
                                    <select value={form.unitAsal} onChange={e => set('unitAsal', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all">
                                        <option value="" disabled>Pilih Unit Kerja...</option>
                                        {unitOptions.map(u => <option key={u.id} value={u.nama}>{u.nama}</option>)}
                                    </select>
                                </div>
                                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Jabatan <span className="text-slate-400">(Opsional)</span></label><input value={form.jabatan} onChange={e => set('jabatan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" placeholder="Jabatan Anda" /></div>
                            </div>
                            <button type="button" onClick={() => setStep(2)} disabled={!canProceed1} className="mt-6 w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all hover:bg-slate-800">Lanjutkan &rarr;</button>
                        </div>
                    )}

                    {/* STEP 2: Klasifikasi */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
                                <div><h3 className="font-bold text-slate-800 text-sm">2. Klasifikasi Insiden</h3><p className="text-[10px] text-slate-500 font-semibold">Urgensi dan departemen penanggung jawab</p></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">Kategori Masalah <span className="text-red-500">*</span></label>
                                <div className="space-y-2">
                                    {KATEGORI_MASALAH.map(k => (
                                        <label key={k.value} className={cn("flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all", form.kategori === k.value ? "border-red-500 bg-red-50 ring-1 ring-red-500/20" : "border-slate-200 hover:bg-slate-50")}>
                                            <input type="radio" className="hidden" checked={form.kategori === k.value} onChange={() => set('kategori', k.value)} />
                                            <div><p className="text-sm font-bold text-slate-700">{k.label}</p><p className="text-xs text-slate-500 mt-0.5">{k.desc}</p></div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">Tingkat Urgensi <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {URGENSI_OPTIONS.map(u => (
                                        <label key={u.value} className={cn("flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all text-center", form.urgensi === u.value ? "border-red-500 bg-red-50 ring-1 ring-red-500/20" : "border-slate-200 hover:bg-slate-50")}>
                                            <input type="radio" className="hidden" checked={form.urgensi === u.value} onChange={() => set('urgensi', u.value)} />
                                            <span className="text-lg font-bold">{u.label}</span>
                                            <span className="text-[10px] text-slate-500 mt-1">{u.desc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setStep(1)} className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></button>
                                <button type="button" onClick={() => setStep(3)} disabled={!canProceed2} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all hover:bg-slate-800">Lanjutkan &rarr;</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Detail Kejadian */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                                <div><h3 className="font-bold text-slate-800 text-sm">3. Detail Kejadian</h3><p className="text-[10px] text-slate-500 font-semibold">Data naratif untuk investigasi (5W+1H)</p></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Waktu & Lokasi Kejadian</label><input value={form.waktuLokasi} onChange={e => set('waktuLokasi', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" placeholder="Misal: Senin 14 April, Ruang ICU" /></div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">Unit Kerja yang Dilaporkan</label>
                                    <select value={form.unitDilaporkan} onChange={e => set('unitDilaporkan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all">
                                        <option value="" disabled>Pilih Unit Kerja...</option>
                                        {unitOptions.map(u => <option key={u.id} value={u.nama}>{u.nama}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">Kronologi Kejadian <span className="text-red-500">*</span></label>
                                <p className="text-xs text-slate-500 mb-2">Gunakan metode 5W+1H: Apa, Siapa, Di mana, Kapan, Mengapa, Bagaimana.</p>
                                <textarea value={form.kronologi} onChange={e => set('kronologi', e.target.value)} rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none" placeholder="Ceritakan secara rinci..." />
                                <p className="text-[10px] text-slate-400 mt-1 text-right">{form.kronologi.length} / min 20 karakter</p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setStep(2)} className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></button>
                                <button type="button" onClick={() => setStep(4)} disabled={!canProceed3} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50 transition-all hover:bg-slate-800">Lanjutkan &rarr;</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Dampak & Saran */}
                    {step === 4 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><Lightbulb className="w-5 h-5" /></div>
                                <div><h3 className="font-bold text-slate-800 text-sm">4. Analisis Dampak & Saran</h3><p className="text-[10px] text-slate-500 font-semibold">Libatkan diri Anda dalam perbaikan sistem</p></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">Dampak yang Ditimbulkan</label>
                                <div className="space-y-2">
                                    {DAMPAK_OPTIONS.map(d => (
                                        <label key={d} className={cn("flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all text-sm font-medium", form.dampak.includes(d) ? "border-red-500 bg-red-50 ring-1 ring-red-500/20" : "border-slate-200 hover:bg-slate-50")}>
                                            <input type="checkbox" className="accent-red-600 w-4 h-4" checked={form.dampak.includes(d)} onChange={() => toggleDampak(d)} /><span className="text-slate-800">{d}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">Usulan Perbaikan (Solusi dari Anda)</label>
                                <textarea value={form.saran} onChange={e => set('saran', e.target.value)} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none" placeholder="Saran perbaikan Anda..." />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setStep(3)} className="px-5 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></button>
                                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-80 transition-all drop-shadow-md cursor-pointer">
                                    {isSubmitting ? 'Mengamankan Data...' : 'Kirim Aduan Internal'}
                                    {!isSubmitting && <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <AppFooter />
            <BottomNav />
        </main>
    )
}
