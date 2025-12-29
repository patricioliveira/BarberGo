"use client"

import { useLayoutEffect } from "react"

interface ThemeProviderProps {
    primaryColor?: string
    secondaryColor?: string
    children: React.ReactNode
}

export function ThemeProvider({ primaryColor, secondaryColor, children }: ThemeProviderProps) {
    useLayoutEffect(() => {
        const root = document.documentElement
        if (primaryColor) {
            root.style.setProperty("--primary", primaryColor)
        }
        if (secondaryColor) {
            root.style.setProperty("--background", secondaryColor)
        }
    }, [primaryColor, secondaryColor])

    return <>{children}</>
}
