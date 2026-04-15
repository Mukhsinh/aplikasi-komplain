'use client'

import React from 'react'

interface FormHeaderProps {
    title: string
    subtitle: string
    icon?: React.ReactNode
    iconUrl?: string
}

export default function FormHeader({ title, subtitle, icon, iconUrl }: FormHeaderProps) {
    return (
        <div className="relative w-full overflow-hidden bg-slate-900 rounded-b-[2rem] pt-14 pb-12 px-6 shadow-xl text-white">
            {/* Asymmetrical Graphical Backgrounds */}
            <div
                className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-bl from-primary/80 to-accent/80 rounded-full"
                style={{ transform: 'translate(40%, -50%) rotate(-15deg)', filter: 'blur(40px)', opacity: 0.8 }}
            />
            <div
                className="absolute bottom-0 left-0 w-[100%] h-[100%] bg-gradient-to-tr from-accent/90 to-transparent rounded-full"
                style={{ transform: 'translate(-30%, 40%) rotate(25deg)', filter: 'blur(30px)', opacity: 0.6 }}
            />

            {/* Geometric Accents */}
            <svg className="absolute top-4 right-4 w-24 h-24 text-white/10" viewBox="0 0 100 100">
                <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" fill="currentColor" />
            </svg>
            <svg className="absolute bottom-4 left-8 w-16 h-16 text-white/5" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="50" fill="currentColor" />
            </svg>

            <div className="relative z-10 flex items-end justify-between gap-4">
                {/* Text content - left */}
                <div className="flex flex-col items-start gap-1 flex-1">
                    {icon && !iconUrl && (
                        <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-sm mb-3">
                            {icon}
                        </div>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-sm leading-tight bg-gradient-to-r from-white to-white/80 bg-clip-text">
                        {title}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm font-semibold text-emerald-50/90 max-w-[280px] drop-shadow-sm leading-snug">
                        {subtitle}
                    </p>
                </div>

                {/* Floating 3D Icon - right side */}
                {iconUrl && (
                    <div
                        className="shrink-0 relative"
                        style={{ animation: 'floatBounce 3s ease-in-out infinite' }}
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-75" />
                        <img src={iconUrl} alt="" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-2xl relative z-10" />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes floatBounce {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-8px) rotate(3deg); }
                    75% { transform: translateY(-4px) rotate(-2deg); }
                }
            `}</style>
        </div>
    )
}
