'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import AppFooter from '@/components/AppFooter'
import { createClient } from '@/utils/supabase/client'

const MENUS = [
  { title: "Survei", speech: "Survei Kepuasan", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Clipboard/3D/clipboard_3d.png", delay: 0.1, href: "/survei", color: "from-emerald-400 to-teal-500" },
  { title: "Komplain Pasien", speech: "Komplain Pasien", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Warning/3D/warning_3d.png", delay: 0.15, href: "/komplain", color: "from-amber-400 to-orange-500" },
  { title: "Lacak Tiket", speech: "Lacak Tiket", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Magnifying%20glass%20tilted%20right/3D/magnifying_glass_tilted_right_3d.png", delay: 0.2, href: "/lacak", color: "from-blue-400 to-indigo-500" },
  { title: "Informasi", speech: "Permintaan Informasi", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Light%20bulb/3D/light_bulb_3d.png", delay: 0.25, href: "/informasi", color: "from-yellow-400 to-amber-500" },
  { title: "Aduan Internal", speech: "Aduan Internal", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Police%20car%20light/3D/police_car_light_3d.png", delay: 0.3, href: "/aduan-internal", color: "from-red-400 to-rose-500" },
  { title: "Kontak CS", speech: "Customer Service", img: "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Telephone%20receiver/3D/telephone_receiver_3d.png", delay: 0.4, href: "https://wa.me/1234567890", color: "from-green-400 to-emerald-500" },
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
  const [appName, setAppName] = useState('KASIH')
  const [appLogo, setAppLogo] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('app_settings').select('setting_key, setting_value').in('setting_key', ['app_name', 'app_logo'])
      if (data) {
        data.forEach(d => {
          if (d.setting_key === 'app_name') setAppName(d.setting_value)
          if (d.setting_key === 'app_logo') setAppLogo(d.setting_value)
        })
      }
    }
    fetchSettings()
  }, [])

  return (
    <main className="min-h-screen pb-24 font-sans" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #1e40af 40%, #be185d 100%)' }}>

      {/* ===== HERO HEADER ===== */}
      <header className="relative pt-10 pb-24 px-6 overflow-hidden">
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
                <span className="text-xl font-black text-white">K</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide leading-none drop-shadow-lg" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", letterSpacing: '0.1em' }}>
                KASIH
              </h1>
              <p className="text-[9px] sm:text-xs font-bold text-white/80 uppercase tracking-widest mt-1">
                Kanal Aduan, Survey dan Informasi Integratif
              </p>
            </div>
          </motion.div>

          {/* Right: Floating 3D Hospital Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            className="relative"
          >
            <div style={{ animation: 'heroFloat 3s ease-in-out infinite' }}>
              <img
                src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Hospital/3D/hospital_3d.png"
                alt=""
                className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>


      </header>

      {/* ===== MAIN CONTENT ===== */}
      <section className="bg-white/95 backdrop-blur-sm rounded-t-[2.5rem] px-6 pt-8 pb-4 -mt-12 relative z-20 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.15)] min-h-[55vh]">
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
                {appName}
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
            <span className="text-2xl animate-wave origin-bottom-right">👋</span>
          </div>
        </motion.div>

        {/* Menu Grid */}
        <h2 className="text-xs font-extrabold text-slate-800 mb-6 pl-3 border-l-4 border-emerald-500 uppercase tracking-wider">Menu Layanan</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-8 gap-x-4">
          {MENUS.map((menu, idx) => (
            <Link key={idx} href={menu.href} className="outline-none" onClick={() => speak(menu.speech)}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: menu.delay, type: 'spring', stiffness: 100 }}
                className="flex flex-col items-center justify-start group cursor-pointer"
              >
                <motion.div
                  className="w-20 h-20 sm:w-24 sm:h-24 mb-3 flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br shadow-xl p-3"
                  style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
                  whileHover={{ y: -8, scale: 1.05, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${menu.color} flex items-center justify-center p-2 shadow-inner`}>
                    <img src={menu.img} alt={menu.title} className="w-full h-full object-contain drop-shadow-lg" loading="lazy" />
                  </div>
                </motion.div>
                <span className="text-xs sm:text-sm font-extrabold text-slate-700 text-center leading-tight">
                  {menu.title}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      <AppFooter />
      <BottomNav />

      <style jsx>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(4deg); }
          75% { transform: translateY(-5px) rotate(-3deg); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
      `}</style>
    </main>
  )
}
