'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Inbox,
    BarChart3,
    Settings,
    Users,
    Menu,
    X,
    LogOut,
    Home,
    Building2,
    FileText,
    PieChart,
    Bell
} from 'lucide-react'
import { cn } from '@/utils/cn'

const SIDEBAR_MENUS = [
    {
        group: 'Utama', items: [
            { name: 'Dasbor', href: '/admin', icon: LayoutDashboard },
            { name: 'Tiket & Laporan', href: '/admin/tiket', icon: Inbox },
        ]
    },
    {
        group: 'Analitik', items: [
            { name: 'Analisa Data', href: '/admin/analisa', icon: BarChart3 },
            { name: 'Analisis Kepuasan', href: '/admin/analisis-kepuasan', icon: PieChart },
            { name: 'Laporan', href: '/admin/laporan', icon: FileText },
        ]
    },
    {
        group: 'Konfigurasi', items: [
            { name: 'Master Unit', href: '/admin/unit', icon: Building2 },
            { name: 'Master Pengguna', href: '/admin/pengguna', icon: Users },
            { name: 'Pengaturan Sistem', href: '/admin/pengaturan', icon: Settings },
        ]
    }
]

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [unreadTicketsCount, setUnreadTicketsCount] = useState(0)
    const [isNotifOpen, setIsNotifOpen] = useState(false)
    const [appName, setAppName] = useState('PUAS')
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        const fetchUserData = async () => {
            const supabase = createClient()

            // Fetch app name from settings
            const { data: settingsData } = await supabase.from('app_settings').select('setting_key, setting_value').eq('setting_key', 'app_name').single()
            if (settingsData?.setting_value) setAppName(settingsData.setting_value)

            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, units(nama)')
                    .eq('id', session.user.id)
                    .single()

                setUserProfile(profile)

                let query = supabase.from('tickets').select('*', { count: 'exact', head: true }).neq('status', 'Selesai')

                if (profile?.role !== 'superadmin' && profile?.unit_id) {
                    query = query.eq('unit_tujuan', profile.unit_id)
                }

                const { count } = await query
                setUnreadTicketsCount(count || 0)
            }
        }
        fetchUserData()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transition-transform duration-300 lg:translate-x-0 lg:static lg:block flex flex-col",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold mr-3">{appName.charAt(0)}</div>
                    <span className="text-lg font-bold text-white tracking-wide">{appName} Admin</span>
                    <button className="ml-auto lg:hidden" onClick={() => setIsMobileOpen(false)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                    {SIDEBAR_MENUS.map((group, gIdx) => (
                        <div key={gIdx}>
                            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{group.group}</p>
                            <nav className="space-y-1">
                                {group.items.map((item, iIdx) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={iIdx}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors",
                                                isActive
                                                    ? "bg-primary text-white"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                            )}
                                        >
                                            <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500")} />
                                            <span className="text-sm">{item.name}</span>
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-2">
                    <button onClick={() => router.push('/')} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <Home className="w-5 h-5" />
                        <span className="text-sm">Kembali ke Beranda</span>
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl font-medium text-slate-400 hover:text-white hover:bg-destructive/20 hover:text-destructive transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm">Keluar Sesi</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0 relative z-40">
                    <div className="flex items-center gap-4">
                        <button className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Notifikasi */}
                        <div className="relative group cursor-pointer" onMouseEnter={() => setIsNotifOpen(true)} onMouseLeave={() => setIsNotifOpen(false)}>
                            <div className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
                                <Bell className="w-5 h-5" />
                            </div>
                            {unreadTicketsCount > 0 && (
                                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm ring-2 ring-white"></span>
                            )}

                            {/* Dropdown Notifikasi */}
                            <div className={cn(
                                "absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl transition-all p-2",
                                isNotifOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                            )}>
                                <p className="text-xs font-bold text-slate-700 px-2 py-1">Notifikasi</p>
                                <div className="border-t border-slate-100 my-1 font-medium"></div>
                                {unreadTicketsCount > 0 ? (
                                    <Link href="/admin/tiket" className="block px-3 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 font-medium rounded-lg transition-colors border border-transparent hover:border-emerald-100">
                                        Ada <span className="font-bold text-red-500">{unreadTicketsCount} tiket</span> butuh respon
                                    </Link>
                                ) : (
                                    <div className="px-3 py-4 text-xs text-slate-400 text-center flex flex-col items-center justify-center">
                                        <Inbox className="w-5 h-5 mb-1 opacity-50" />
                                        Tidak ada tiket baru
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profil */}
                        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-700 capitalize">
                                    {userProfile?.nama_lengkap || 'Administrator'}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                    {userProfile?.role === 'superadmin' ? 'Sistem Pusat' : (userProfile?.units?.nama || 'Global')}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden shadow-sm shrink-0">
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile?.nama_lengkap || 'Admin'}&backgroundColor=f8fafc`} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
