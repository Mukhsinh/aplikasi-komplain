'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import AppFooter from '@/components/AppFooter'
import { createClient } from '@/utils/supabase/client'

const MENUS = [
  { title: "Survei", speech: "Survei Kepuasan", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Person%20raising%20hand/Default/3D/person_raising_hand_3d_default.png", delay: 0.1, href: "/survei", color: "from-emerald-400 to-teal-500" },
  { title: "Komplain Pasien", speech: "Komplain Pasien", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Person%20frowning/Default/3D/person_frowning_3d_default.png", delay: 0.15, href: "/komplain", color: "from-amber-400 to-orange-500" },
  { title: "Lacak Tiket", speech: "Lacak Tiket", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Detective/Default/3D/detective_3d_default.png", delay: 0.2, href: "/lacak", color: "from-blue-400 to-indigo-500" },
  { title: "Informasi", speech: "Permintaan Informasi", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Woman%20student/Default/3D/woman_student_3d_default.png", delay: 0.25, href: "/informasi", color: "from-yellow-400 to-amber-500" },
  { title: "Aduan Internal", speech: "Aduan Internal", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Police%20officer/Default/3D/police_officer_3d_default.png", delay: 0.3, href: "/aduan-internal", color: "from-red-400 to-rose-500" },
  { title: "Kontak CS", speech: "Customer Service", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Telephone%20receiver/3D/telephone_receiver_3d.png", delay: 0.4, href: "https://wa.me/1234567890", color: "from-green-400 to-emerald-500" },
]

const FAQS = [
  { q: "Apa itu layanan PUAS?", a: "PUAS (Kanal Aduan, Survey, dan Informasi) adalah platform terintegrasi untuk memudahkan pasien dan masyarakat dalam menyampaikan keluhan, mengisi survei, dan meminta informasi secara transparan dan terpadu." },
  { q: "Bagaimana cara mengajukan komplain?", a: "Pilih menu 'Komplain Pasien' di beranda, lalu isi formulir dengan identitas Anda, kronologi kejadian, dan bukti pendukung. Laporan Anda akan menerima tiket untuk dilacak." },
  { q: "Bagaimana cara mengisi survei kepuasan?", a: "Pilih menu 'Survei' di beranda, lalu pilih poli atau layanan yang Anda kunjungi dan jawab pertanyaan sesuai dengan pengalaman Anda saat menerima pelayanan." },
  { q: "Bagaimana cara meminta informasi?", a: "Pilih menu 'Informasi', lengkapi formulir permohonan dengan detail informasi yang diinginkan. Tim kami akan mengevaluasi dan merespon secepatnya." },
  { q: "Bagaimana cara menghubungi petugas CS?", a: "Pilih menu 'Kontak CS' di beranda. Anda akan langsung diarahkan ke channel komunikasi resmi kami (WhatsApp) untuk chat dengan petugas." }
]

function timeAgo(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " tahun yang lalu"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " bulan yang lalu"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " hari yang lalu"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " jam yang lalu"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " menit yang lalu"
  return "Baru saja"
}

const TESTIMONIALS = [
  { name: "Budi Santoso", text: "Pelayanan sangat memuaskan dan cepat tanggap. Dokter dan perawat sangat ramah.", rating: 5, time: "2 hari yang lalu" },
  { name: "Siti Aminah", text: "Fasilitas rumah sakit bersih dan nyaman. Proses pendaftaran juga sangat mudah melalui aplikasi ini.", rating: 5, time: "1 minggu yang lalu" },
  { name: "Andi Wijaya", text: "Terima kasih atas pelayanannya. Keluhan saya ditangani dengan cepat melalui sistem portal informasi PUAS.", rating: 4, time: "3 minggu yang lalu" },
  { name: "Rina Kusuma", text: "Sangat terbantu dengan adanya sistem informasi otomatis ini. Sukses terus untuk rumah sakit!", rating: 5, time: "1 bulan yang lalu" },
  { name: "Hendra Gunawan", text: "Respons dari customer service sangat cepat dan informatif. Mantap pelayanannya sangat profesional.", rating: 5, time: "1 bulan yang lalu" },
]

function speak(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 0.8
    window.speechSynthesis.speak(utterance)
  }
}

export default function Beranda() {
  const [appName, setAppName] = useState('PUAS')
  const [appLogo, setAppLogo] = useState('')
  const [namaInstansi, setNamaInstansi] = useState('')
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const [testimonials, setTestimonials] = useState<any[]>([])
  const [isTestimoniOpen, setIsTestimoniOpen] = useState(false)
  const [tForm, setTForm] = useState({ name: '', text: '', rating: 5 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const initData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('app_settings').select('*')
      if (data) {
        const _appName = data.find((d: any) => d.setting_key === 'app_name')?.setting_value
        const _appLogo = data.find((d: any) => d.setting_key === 'app_logo')?.setting_value
        const _namaSub = data.find((d: any) => d.setting_key === 'nama_sub_instansi')?.setting_value
        const _namaInstansi = data.find((d: any) => d.setting_key === 'nama_instansi')?.setting_value
        if (_appName) setAppName(_appName)
        if (_appLogo) setAppLogo(_appLogo)
        if (_namaSub) setNamaInstansi(_namaSub)
        else if (_namaInstansi) setNamaInstansi(_namaInstansi)
      }
      const { data: testData } = await supabase.from('testimoni').select('*').order('created_at', { ascending: false }).limit(20)
      if (testData && testData.length > 0) {
        setTestimonials(testData)
      } else {
        setTestimonials(TESTIMONIALS.map(t => ({ ...t, created_at: null }))) // raw mock mapping
      }
    }
    initData()
  }, [])

  const submitTestimoni = async () => {
    if (!tForm.name || !tForm.text) return
    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('testimoni').insert([{ name: tForm.name, text: tForm.text, rating: tForm.rating }])
    if (error) {
      console.error('Testimoni insert error:', error)
      alert('Gagal menyimpan tanggapan: ' + error.message)
    } else {
      setIsTestimoniOpen(false)
      setTForm({ name: '', text: '', rating: 5 })
      // Reload testimonials from database
      const { data } = await supabase.from('testimoni').select('*').order('created_at', { ascending: false }).limit(20)
      if (data && data.length > 0) {
        setTestimonials(data)
      }
    }
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen pb-24 font-sans" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #1e40af 40%, #be185d 100%)' }}>

      {/* ===== HERO HEADER ===== */}
      <header className="relative pt-6 pb-16 px-6 overflow-hidden">
        {/* Abstract SVG background shapes */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.12]" viewBox="0 0 800 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="120" cy="100" r="180" fill="url(#g1)" />
          <ellipse cx="650" cy="200" rx="200" ry="120" fill="url(#g1)" />
          <path d="M0 400 Q200 300 400 450 T800 350 L800 600 L0 600 Z" fill="url(#g1)" opacity="0.5" />
          <polygon points="500,50 550,150 450,150" fill="url(#g1)" opacity="0.3" />
          <rect x="100" y="350" width="60" height="60" rx="12" fill="url(#g1)" opacity="0.2" transform="rotate(30 130 380)" />
        </svg>

        {/* Glowing orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-8 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-12 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          {/* Left: Logo + App Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-12 h-12 rounded-xl shadow-lg object-cover border-2 border-white/30" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-lg">
                <span className="text-xl font-black text-white">P</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide leading-none drop-shadow-lg" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.1em' }}>
                PUAS
              </h1>
              <p className="text-[9px] sm:text-xs font-bold text-white/80 uppercase tracking-widest mt-1">
                Kanal Aduan, Survey dan Informasi Integratif
              </p>
            </div>
          </motion.div>

          {/* Right: Floating 3D Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            className="relative"
          >
            <div style={{ animation: 'heroFloat 4s ease-in-out infinite' }}>
              <img
                src="/medical_team.png"
                alt="Medical Team"
                className="w-36 h-36 sm:w-48 sm:h-48 drop-shadow-2xl object-contain"
              />
            </div>
          </motion.div>
        </div>


      </header>

      {/* ===== MAIN CONTENT ===== */}
      <section className="bg-white/95 backdrop-blur-sm rounded-t-[2.5rem] px-6 pt-8 pb-4 -mt-10 relative z-20 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.15)] min-h-[55vh]">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100/50 p-5 rounded-2xl flex items-center justify-between mb-8 shadow-sm"
        >
          <div>
            <p className="text-xs text-slate-500 font-bold tracking-wide">Selamat Datang di</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg font-black text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-blue-600">
                {namaInstansi || appName}
              </p>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center p-1 transform hover:scale-105 transition-transform overflow-hidden">
            <img src="/medical_team.png" alt="Team App" className="w-full h-full object-contain animate-heroFloat" />
          </div>
        </motion.div>

        {/* Menu Grid */}
        <h2 className="text-xs font-extrabold text-slate-800 mb-6 pl-3 border-l-4 border-emerald-500 uppercase tracking-wider">Menu Layanan</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-8 gap-x-4" style={{ perspective: '1000px' }}>
          {MENUS.map((menu, idx) => (
            <Link key={idx} href={menu.href} className="outline-none" onClick={() => speak(menu.speech)}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: menu.delay, type: 'spring', stiffness: 100 }}
                className="flex flex-col items-center justify-start group cursor-pointer"
              >
                <motion.div
                  className="w-20 h-20 sm:w-24 sm:h-24 mb-3 flex items-center justify-center rounded-[1.5rem] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.15)] p-3 relative group-hover:shadow-[0_25px_40px_-5px_rgba(0,0,0,0.25)] transition-shadow"
                  style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
                  whileHover={{ y: -8, rotateX: 10, rotateY: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={`absolute inset-0 rounded-[1.5rem] bg-gradient-to-br ${menu.color} opacity-80 mix-blend-overlay`}></div>
                  <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center p-2 border border-white/20 z-0" style={{ transformStyle: 'preserve-3d' }}>
                  </div>
                  {/* Floating Icon */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none" style={{ transform: 'translateZ(50px)' }}>
                    <motion.img
                      src={menu.img}
                      alt={menu.title}
                      className="w-[110%] h-[110%] max-w-none object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]"
                      animate={{
                        y: [-4, 4, -4],
                        rotate: [-2, 2, -2]
                      }}
                      transition={{
                        duration: 3 + idx * 0.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </div>
                </motion.div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-700 text-center leading-tight">
                  {menu.title}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-14 max-w-2xl mx-auto px-1">
          <div className="flex flex-col items-center mb-8">
            <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-2">Bantuan</span>
            <h2 className="text-xl font-black text-slate-800 text-center">Pertanyaan Umum (FAQ)</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className={`bg-white rounded-2xl border transition-all duration-300 ${openFAQ === idx ? 'border-blue-300 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.2)] ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}`}>
                <button
                  onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                  className="w-full py-4 px-5 flex items-center justify-between text-left focus:outline-none group"
                >
                  <span className={`font-bold text-[14px] transition-colors pr-4 ${openFAQ === idx ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>{faq.q}</span>
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${openFAQ === idx ? 'bg-blue-100 text-blue-600 rotate-45' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                    <svg className="w-5 h-5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                </button>
                <AnimatePresence>
                  {openFAQ === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-[14.5px] text-slate-600 leading-relaxed overflow-hidden"
                    >
                      <div className="pb-5 px-5 pt-1 border-t border-slate-50 mt-1">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="mt-16 -mx-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 mb-8">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 pl-3 border-l-4 border-indigo-500 uppercase tracking-wider">Testimoni Layanan</h2>
              <p className="text-[10px] text-slate-500 mt-1 ml-3">Ulasan jujur dari pengguna sistem</p>
            </div>
            <button onClick={() => setIsTestimoniOpen(true)} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_25px_-5px_rgba(0,0,0,0.4)] transform hover:-translate-y-0.5 transition-all outline-none border border-slate-700">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              <span>Review Baru</span>
            </button>
          </div>
          <div className="relative flex w-full overflow-hidden pb-4 pt-1">
            <div className="flex animate-marquee cursor-default gap-4 px-4 hover:pause">
              {/* Duplicate array manually for seamless scroll */}
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="min-w-[280px] max-w-[280px] bg-white p-5 rounded-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] border border-slate-50 flex-shrink-0">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, star) => (
                      <svg key={star} className={`w-4 h-4 ${star < t.rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-xs text-slate-800">{t.name}</span>
                    <span className="text-[10px] text-slate-400">{t.created_at ? timeAgo(t.created_at) : t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
      <BottomNav />

      {/* Testimoni Modal */}
      <AnimatePresence>
        {isTestimoniOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTestimoniOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Tulis Tanggapan Anda</h3>
                <button onClick={() => setIsTestimoniOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nama <span className="text-red-500">*</span></label>
                  <input value={tForm.name} onChange={e => setTForm({ ...tForm, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Ketik nama Anda" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">Berapa bintang untuk kami?</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setTForm({ ...tForm, rating: star })} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${star <= tForm.rating ? 'bg-amber-100 text-amber-500' : 'bg-slate-50 border border-slate-200 text-slate-300 hover:text-slate-400'}`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tanggapan/Review <span className="text-red-500">*</span></label>
                  <textarea value={tForm.text} onChange={e => setTForm({ ...tForm, text: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24" placeholder="Ketik pengalaman menggunakan layanan kami..." />
                </div>
                <button onClick={submitTestimoni} disabled={isSubmitting || !tForm.name || !tForm.text} className="w-full py-2.5 mt-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition">
                  {isSubmitting ? 'Menyimpan...' : 'Kirim Tanggapan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(3deg); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </main>
  )
}
