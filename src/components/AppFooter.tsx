'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AppFooter() {
    const [appName, setAppName] = useState('KASIH')
    const [footerText, setFooterText] = useState('')

    useEffect(() => {
        const fetchSettings = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('app_settings').select('setting_key, setting_value').in('setting_key', ['app_name', 'pdf_footer_text'])
            if (data) {
                data.forEach(d => {
                    if (d.setting_key === 'app_name') setAppName(d.setting_value)
                    if (d.setting_key === 'pdf_footer_text') setFooterText(d.setting_value)
                })
            }
        }
        fetchSettings()
    }, [])

    return (
        <footer className="w-full py-4 px-6 bg-slate-800 text-center border-t border-slate-700" style={{ marginBottom: '80px' }}>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                &copy; {new Date().getFullYear()} {appName}. All rights reserved.
            </p>
            {footerText && (
                <p className="text-[9px] text-slate-500 mt-0.5">{footerText}</p>
            )}
        </footer>
    )
}
