'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogIn, KeyRound } from 'lucide-react'
import FloatingLabelInput from '@/components/FloatingLabelInput'

import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [appName, setAppName] = useState('KASIH')

    useEffect(() => {
        const fetchAppName = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'app_name').single()
            if (data?.setting_value) setAppName(data.setting_value)
        }
        fetchAppName()
    }, [])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            alert(`Gagal login: ${error.message}`)
            setIsLoading(false)
        } else {
            window.location.href = '/admin'
        }
    }

    return (
        <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md mb-4 border border-white/20">
                        <KeyRound className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Portal Admin</h1>
                    <p className="text-slate-400 font-medium text-sm mt-1">{appName} Enterprise System</p>
                </div>

                <div className="glass-panel bg-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                    <form onSubmit={handleLogin} className="space-y-4">
                        <FloatingLabelInput
                            label="Email Pegawai"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            className="bg-transparent border-slate-300"
                        />

                        <FloatingLabelInput
                            label="Kata Sandi"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            className="bg-transparent border-slate-300"
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all drop-shadow-md"
                        >
                            {isLoading ? 'Memverifikasi...' : 'Masuk Sistem'}
                            {!isLoading && <LogIn className="w-4 h-4 ml-1" />}
                        </button>

                        <p className="text-center text-xs text-slate-500 font-medium mt-6">
                            © {new Date().getFullYear()} {appName} Enterprise
                        </p>
                    </form>
                </div>
            </motion.div>
        </main>
    )
}
