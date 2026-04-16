'use client'

import React, { useState, useEffect } from 'react'
import { Save, Bell, Clock, Building, ShieldCheck, Mail, Sliders, CheckCircle2, AlertCircle, FileText, User, Phone, MapPin, Globe } from 'lucide-react'
import { cn } from '@/utils/cn'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_SETTINGS = {
    nama_instansi: 'Pemerintah Kota Sejahtera',
    nama_sub_instansi: 'Rumah Sakit Umum Daerah Kota Sejahtera',
    alamat_instansi: 'Jl. Jend. Sudirman No. 123',
    kontak_instansi: 'Telp: (021) 555-0192 | Email: rsud@sejahtera.go.id',
    website_instansi: 'rsud.sejahtera.go.id',
    nama_penandatangan: 'Dr. Mulyadi Saputra, MARS',
    jabatan_penandatangan: 'Direktur Utama RSUD Kota Sejahtera',
    nip_penandatangan: '',
    // SLA
    sla_normal_limit: '24',
    sla_normal_warning: '18',
    sla_high_limit: '4',
    sla_high_warning: '2',
    // Print
    print_header: 'PEMERINTAH KOTA SEJAHTERA\nDINAS KESEHATAN\nRUMAH SAKIT UMUM DAERAH KOTA SEJAHTERA',
    print_footer: 'Dokumen ini digenerate secara otomatis oleh Sistem PUAS.\nDicetak secara sah. Segala pemalsuan akan diproses secara hukum.',
    app_name: 'PUAS',
}

const InputField = ({ value, onChange, label, icon: Icon, placeholder, type = 'text', hint }: { value: string, onChange: (val: string) => void, label: string, icon?: any, placeholder?: string, type?: string, hint?: string }) => (
    <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2.5 flex items-center gap-2">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
            {label}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || label}
            className="w-full px-4 py-3 bg-slate-50/80 text-slate-900 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-300"
        />
        {hint && <p className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3 shrink-0" />{hint}</p>}
    </div>
)

const TextAreaField = ({ value, onChange, label, placeholder, rows = 4, hint, positionHint }: { value: string, onChange: (val: string) => void, label: string, placeholder?: string, rows?: number, hint?: string, positionHint?: string }) => (
    <div>
        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
            {label}
            {positionHint && <span className="text-[10px] font-semibold px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg">{positionHint}</span>}
        </label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-semibold text-slate-800 shadow-inner leading-relaxed placeholder:text-slate-300"
            placeholder={placeholder}
            rows={rows}
        />
        {hint && <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{hint}</p>}
    </div>
)

export default function AdminSettingsPage() {
    const [activeMenu, setActiveMenu] = useState('Identitas')
    const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('app_settings').select('*')
            if (data) {
                // Merge database values over defaults
                const merged = { ...DEFAULT_SETTINGS }
                data.forEach(item => {
                    const key = item.setting_key as keyof typeof DEFAULT_SETTINGS
                    if (merged[key] !== undefined && item.setting_value !== undefined && item.setting_value !== null) {
                        merged[key] = String(item.setting_value)
                    }
                })
                setSettings(merged)
            }
            setIsLoaded(true)
        }
        fetchSettings()
    }, [])

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('idle')
        const supabase = createClient()

        try {
            // Upsert each setting key-value pair
            const upsertPromises = Object.entries(settings).map(async ([key, value]) => {
                const { data: existing } = await supabase.from('app_settings').select('id').eq('setting_key', key).single()
                if (existing) {
                    return supabase.from('app_settings').update({ setting_value: value, updated_at: new Date().toISOString() }).eq('id', existing.id)
                } else {
                    return supabase.from('app_settings').insert({ setting_key: key, setting_value: value })
                }
            })
            await Promise.all(upsertPromises)
            setSaveStatus('success')
        } catch (error) {
            console.error("Error saving settings:", error)
            setSaveStatus('error')
        } finally {
            setIsSaving(false)
            setTimeout(() => setSaveStatus('idle'), 4000)
        }
    }

    const MENUS = [
        { id: 'Identitas', icon: Building, desc: 'Profil Institusi', color: 'text-indigo-500 bg-indigo-50' },
        { id: 'SLA & Eskalasi', icon: Clock, desc: 'Batas waktu & peringatan', color: 'text-amber-500 bg-amber-50' },
        { id: 'Format Laporan', icon: FileText, desc: 'Kop surat & tanda tangan', color: 'text-emerald-500 bg-emerald-50' },
    ]

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-500 font-medium text-sm">Memuat konfigurasi sistem...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-extrabold text-slate-800 tracking-tight"
                    >
                        Pengaturan Sistem
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 mt-2 font-medium"
                    >
                        Konfigurasi identitas institusi, batas SLA, dan format cetak dokumen.
                    </motion.p>
                </div>

                <AnimatePresence>
                    {saveStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-emerald-50 text-emerald-700 px-4 py-2 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm"
                        >
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            Semua pengaturan berhasil disimpan!
                        </motion.div>
                    )}
                    {saveStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-red-50 text-red-700 px-4 py-2 border border-red-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm"
                        >
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Gagal menyimpan. Periksa koneksi database.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Navigation Sidebar */}
                <div className="w-full lg:w-72 shrink-0 space-y-2">
                    {MENUS.map((menu, idx) => (
                        <motion.button
                            type="button"
                            key={menu.id}
                            onClick={() => setActiveMenu(menu.id)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all text-left border",
                                activeMenu === menu.id
                                    ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20"
                                    : "bg-white border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                activeMenu === menu.id ? "bg-white/10 text-emerald-400" : menu.color
                            )}>
                                <menu.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm">{menu.id}</div>
                                <div className={cn("text-xs font-medium mt-0.5", activeMenu === menu.id ? "text-slate-300" : "text-slate-400")}>
                                    {menu.desc}
                                </div>
                            </div>
                        </motion.button>
                    ))}

                    {/* Save button in sidebar */}
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" /> Simpan Semua Pengaturan
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {/* ===== IDENTITAS INSTITUSI ===== */}
                        {activeMenu === 'Identitas' && (
                            <motion.div
                                key="identitas"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Profil Institusi</h2>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Informasi identitas yang digunakan pada kop surat, laporan, dan seluruh elemen sistem.</p>
                                </div>

                                {/* Main identity */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <InputField value={settings.app_name || ''} onChange={(val) => handleChange('app_name', val)} label="Nama Aplikasi" icon={Globe} placeholder="PUAS" hint="Akan tampil di header dan judul halaman" />
                                    <InputField value={settings.nama_instansi || ''} onChange={(val) => handleChange('nama_instansi', val)} label="Nama Instansi Induk" icon={Building} placeholder="Pemerintah Kota Sejahtera" />
                                    <div className="sm:col-span-2">
                                        <InputField value={settings.nama_sub_instansi || ''} onChange={(val) => handleChange('nama_sub_instansi', val)} label="Nama Sub Instansi / Satuan Kerja" icon={Building} placeholder="Rumah Sakit Umum Daerah Kota Sejahtera" />
                                    </div>
                                </div>

                                {/* Address & Contact */}
                                <div className="pt-6 border-t border-slate-100 space-y-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-primary" /> Alamat & Kontak
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="sm:col-span-2">
                                            <InputField value={settings.alamat_instansi || ''} onChange={(val) => handleChange('alamat_instansi', val)} label="Alamat Lengkap" icon={MapPin} placeholder="Jl. Jend. Sudirman No. 123" />
                                        </div>
                                        <InputField value={settings.kontak_instansi || ''} onChange={(val) => handleChange('kontak_instansi', val)} label="Kontak (Telp/Email)" icon={Phone} placeholder="Telp: (021) 555-0192" />
                                        <InputField value={settings.website_instansi || ''} onChange={(val) => handleChange('website_instansi', val)} label="Website" icon={Globe} placeholder="rsud.sejahtera.go.id" />
                                    </div>
                                </div>

                                {/* Logo */}
                                <div className="pt-6 border-t border-slate-100">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                        <Building className="w-4 h-4 text-primary" /> Logo Instansi
                                    </h3>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center font-bold text-slate-300 text-3xl overflow-hidden">
                                            {settings.nama_sub_instansi ? settings.nama_sub_instansi.charAt(0).toUpperCase() : 'R'}
                                        </div>
                                        <div>
                                            <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/5 file:text-primary hover:file:bg-primary/10 cursor-pointer transition-colors" />
                                            <p className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Maks. 2MB. Format: SVG / PNG transparan.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ===== SLA & ESKALASI ===== */}
                        {activeMenu === 'SLA & Eskalasi' && (
                            <motion.div
                                key="sla"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Manajemen SLA (Service Level Agreement)</h2>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Tentukan batasan waktu penyelesaian tiket berdasarkan tingkat prioritas.</p>
                                </div>

                                {/* Info Banner */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/60 p-5 rounded-2xl flex gap-4 text-amber-900 text-sm items-start shadow-sm">
                                    <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <p className="font-medium leading-relaxed">Notifikasi eskalasi akan otomatis terpicu saat umur tiket mencapai atau melewati ambang waktu <strong>Peringatan</strong> yang ditentukan di bawah. Eskalasi akan dikirim ke admin terkait.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Normal Priority */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-100 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                                            <h4 className="font-bold text-slate-800 text-sm">Prioritas Normal</h4>
                                        </div>
                                        <InputField value={settings.sla_normal_limit || ''} onChange={(val) => handleChange('sla_normal_limit', val)} label="Batas Waktu Maksimal (Jam)" type="number" placeholder="24" hint="Tiket akan ditandai terlambat setelah melewati batas ini" />
                                        <InputField value={settings.sla_normal_warning || ''} onChange={(val) => handleChange('sla_normal_warning', val)} label="Mulai Peringatan Sejak (Jam)" type="number" placeholder="18" hint="Notifikasi akan dikirim saat mencapai waktu ini" />
                                    </div>

                                    {/* High Priority */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 border border-slate-100 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/40" />
                                            <h4 className="font-bold text-slate-800 text-sm">Prioritas Tinggi & Urgent</h4>
                                        </div>
                                        <InputField value={settings.sla_high_limit || ''} onChange={(val) => handleChange('sla_high_limit', val)} label="Batas Waktu Maksimal (Jam)" type="number" placeholder="4" hint="Standar: 2-4 jam untuk tiket kritis" />
                                        <InputField value={settings.sla_high_warning || ''} onChange={(val) => handleChange('sla_high_warning', val)} label="Mulai Peringatan Sejak (Jam)" type="number" placeholder="2" hint="Peringatan dini sebelum batas waktu tercapai" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ===== FORMAT LAPORAN ===== */}
                        {activeMenu === 'Format Laporan' && (
                            <motion.div
                                key="laporan"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Pengaturan Format Cetak Laporan</h2>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Konfigurasi teks kop surat, catatan kaki, dan penandatangan yang tersemat otomatis pada hasil ekspor PDF/Excel.</p>
                                </div>

                                {/* Kop Surat */}
                                <TextAreaField
                                    value={settings.print_header || ''}
                                    onChange={(val) => handleChange('print_header', val)}
                                    label="Teks Kop Surat (Header)"
                                    placeholder={"Baris 1 (Nama Pemerintah)\nBaris 2 (Nama Dinas)\nBaris 3 (Nama RSUD/Instansi)"}
                                    rows={4}
                                    positionHint="Posisi: Tengah Atas"
                                    hint="Setiap baris baru akan menjadi baris terpisah pada kop surat."
                                />

                                {/* Penandatangan */}
                                <div className="pt-6 border-t border-slate-100 space-y-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4 text-primary" /> Penandatangan Default
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <InputField value={settings.nama_penandatangan || ''} onChange={(val) => handleChange('nama_penandatangan', val)} label="Nama Penandatangan" icon={User} placeholder="Dr. Mulyadi Saputra, MARS" />
                                        <InputField value={settings.jabatan_penandatangan || ''} onChange={(val) => handleChange('jabatan_penandatangan', val)} label="Jabatan Penandatangan" icon={ShieldCheck} placeholder="Direktur Utama" />
                                        <div className="sm:col-span-2">
                                            <InputField value={settings.nip_penandatangan || ''} onChange={(val) => handleChange('nip_penandatangan', val)} label="NIP (Opsional)" placeholder="19760512 200112 1 005" hint="Akan ditampilkan di bawah nama penandatangan jika diisi" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <TextAreaField
                                        value={settings.print_footer || ''}
                                        onChange={(val) => handleChange('print_footer', val)}
                                        label="Catatan Kaki (Footer)"
                                        placeholder="Dokumen ini digenerate secara otomatis oleh Sistem..."
                                        rows={3}
                                        positionHint="Posisi: Bawah Halaman"
                                        hint="Teks ini akan muncul di bagian bawah setiap halaman laporan yang dicetak."
                                    />
                                </div>

                                {/* Preview */}
                                <div className="pt-6 border-t border-slate-100">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-4">
                                        <FileText className="w-4 h-4 text-primary" /> Pratinjau Kop Surat
                                    </h3>
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-1">
                                        {(settings.print_header || '').split('\n').map((line, i) => (
                                            <p key={i} className={cn(
                                                "text-slate-800 font-bold",
                                                i === 0 ? "text-sm" : i === 1 ? "text-base" : "text-lg"
                                            )}>
                                                {line || '—'}
                                            </p>
                                        ))}
                                        <div className="border-b-2 border-slate-800 pt-2 mx-auto w-4/5" />
                                        <div className="border-b border-slate-800 pt-0.5 mx-auto w-4/5" />
                                        <p className="text-[10px] text-slate-400 pt-4 font-medium">{settings.alamat_instansi || 'Alamat belum diatur'}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
