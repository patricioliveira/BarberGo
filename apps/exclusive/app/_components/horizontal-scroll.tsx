"use client"

import { cn } from "@/_lib/utils"
import React, { useRef } from "react"

interface HorizontalScrollProps {
    children: React.ReactNode
    className?: string
}

const HorizontalScroll = ({ children, className }: HorizontalScrollProps) => {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Removido o useEffect com handleWheel para não travar a rolagem vertical da tela

    return (
        <div
            ref={scrollRef}
            className={cn(
                "flex flex-row gap-4 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden py-1 snap-x snap-proximity",
                className
            )}
        >
            {children}
        </div>
    )
}

export default HorizontalScroll