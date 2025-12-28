"use client"

import { useEffect, useRef } from "react"
import { registerView } from "@/_actions/register-view"

export function ViewTracker({ barbershopId }: { barbershopId: string }) {
    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            registerView(barbershopId)
        }
    }, [barbershopId])

    return null
}
