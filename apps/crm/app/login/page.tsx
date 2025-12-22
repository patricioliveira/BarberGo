"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import AuthDialog from "../_components/auth-dialog"

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { status } = useSession()

    const callbackUrl = searchParams.get("callbackUrl") || "/admin"

    useEffect(() => {
        if (status === "authenticated") {
            router.push(callbackUrl)
        }
    }, [status, router, callbackUrl])

    const handleOpenChange = (open: boolean) => {
        if (!open) router.push("/")
    }

    if (status === "loading") {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <AuthDialog isOpen={true} onOpenChange={handleOpenChange} callbackUrl={callbackUrl} />
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
            <LoginContent />
        </Suspense>
    )
}