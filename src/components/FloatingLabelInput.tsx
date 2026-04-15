'use client'

import React, { useState } from 'react'

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
}

export default function FloatingLabelInput({ label, error, className, ...props }: FloatingLabelInputProps) {
    const [isFocused, setIsFocused] = useState(false)

    return (
        <div className="relative mb-5">
            <input
                {...props}
                onFocus={(e) => {
                    setIsFocused(true)
                    props.onFocus && props.onFocus(e)
                }}
                onBlur={(e) => {
                    setIsFocused(false)
                    props.onBlur && props.onBlur(e)
                }}
                className={`
          block w-full px-4 pt-6 pb-2 text-sm text-slate-900 font-semibold bg-slate-50 border-b-2 rounded-t-xl 
          appearance-none focus:outline-none focus:ring-0 transition-colors
          ${error ? 'border-destructive focus:border-destructive' : 'border-slate-200 focus:border-primary'}
          ${className || ''}
        `}
                placeholder=" "
            />
            <label
                className={`
          absolute left-4 top-4 text-sm transition-all duration-300 pointer-events-none
          ${(isFocused || (props.value && props.value !== '')) ? 'transform -translate-y-3 text-[10px] font-bold text-primary' : 'text-slate-500'}
          ${error && !isFocused ? 'text-destructive' : ''}
        `}
            >
                {label}
            </label>
            {error && <p className="absolute -bottom-5 left-1 text-[10px] text-destructive">{error}</p>}
        </div>
    )
}
