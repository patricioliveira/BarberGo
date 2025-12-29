"use client"

import { Switch } from "@barbergo/ui"
import { toggleRatingVisibility } from "@/_actions/ratings"
import { useState } from "react"
import { toast } from "sonner"

export function RatingVisibilityToggle({ ratingId, initialValue }: { ratingId: string, initialValue: boolean }) {
    const [checked, setChecked] = useState(initialValue)

    const handleChange = async (val: boolean) => {
        setChecked(val) // Atualiza visualmente na hora (otimista)
        try {
            await toggleRatingVisibility(ratingId, val)
            toast.success(val ? "Comentário visível." : "Comentário ocultado.")
        } catch {
            setChecked(!val) // Reverte se der erro
            toast.error("Erro ao atualizar.")
        }
    }

    return (
        <Switch checked={checked} onCheckedChange={handleChange} />
    )
}
