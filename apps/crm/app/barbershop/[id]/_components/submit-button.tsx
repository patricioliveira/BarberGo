"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@barbergo/ui"
import { Loader2 } from "lucide-react"

interface SubscriptionSubmitButtonProps {
    label: string
    icon: React.ReactNode
    className?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function SubscriptionSubmitButton({ label, icon, className, variant = "default" }: SubscriptionSubmitButtonProps) {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            variant={variant}
            className={`w-full justify-start gap-2 font-bold transition-all active:scale-[0.98] ${className}`}
        >
            {pending ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                </>
            ) : (
                <>
                    {icon}
                    {label}
                </>
            )}
        </Button>
    )
}