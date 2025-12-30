"use client"

import Image, { ImageProps } from "next/image"
import { useState, useEffect } from "react"
import { Scissors } from "lucide-react"

interface BarbershopImageProps extends Omit<ImageProps, "onError" | "src"> {
    src?: string | null
}

export function BarbershopImage({ src, alt, className, ...props }: BarbershopImageProps) {
    const [hasError, setHasError] = useState(false)

    // Reset error state if src changes
    useEffect(() => {
        setHasError(false)
    }, [src])

    const isValidSrc = src && src.trim() !== "" && !hasError

    if (!isValidSrc) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1A1B1F] to-[#26272B] border border-white/5 ${props.fill ? "absolute inset-0 w-full h-full" : "w-full h-full"} ${className}`}>
                <Scissors className="text-white/10 mb-2" size={32} />
                <span className="text-[10px] text-white/20 font-medium uppercase tracking-widest text-center px-4">Sem imagem</span>
            </div>
        )
    }

    return (
        <Image
            src={src!}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
            {...props}
        />
    )
}
