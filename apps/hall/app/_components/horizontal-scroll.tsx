"use client"

import React, { useRef, useEffect } from "react"

interface HorizontalScrollProps {
    children: React.ReactNode
}

const HorizontalScroll = ({ children }: HorizontalScrollProps) => {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const handleWheel = (e: WheelEvent) => {
            // Se o movimento for maioritariamente vertical (roda do rato padrão),
            // transformamos o deltaY em deslocamento horizontal (scrollLeft).
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault()
                el.scrollLeft += e.deltaY
            }
        }

        // Adicionamos o listener nativo com passive: false para permitir o preventDefault
        el.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            el.removeEventListener("wheel", handleWheel)
        }
    }, [])

    return (
        <div
            ref={scrollRef}
            className="flex flex-row gap-4 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden py-1 snap-x snap-proximity"
        >
            {children}
        </div>
    )
}

export default HorizontalScroll