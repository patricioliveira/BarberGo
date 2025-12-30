"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import AuthDialog from "../_components/auth-dialog"
import { Loader2 } from "lucide-react"

// Criamos um sub-componente para isolar o uso do useSearchParams
function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { status } = useSession()

    // Pega o callbackUrl da URL (se existir) ou define /admin por padrão
    const callbackUrl = searchParams.get("callbackUrl") || "/admin"

    // Se já estiver logado, manda direto para o callback ou admin
    useEffect(() => {
        if (status === "authenticated") {
            router.push(callbackUrl)
        }
    }, [status, router, callbackUrl])

    // Função para lidar com o fechamento do diálogo
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Se o usuário fechar o modal na página de login, volta para a home
            router.push("/")
        }
    }

    // Enquanto carrega a sessão, mostra um loading simples no fundo
    if (status === "loading") {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            {/* O modal abre automaticamente porque isOpen é true */}
            <AuthDialog
                isOpen={true}
                onOpenChange={handleOpenChange}
                callbackUrl={callbackUrl}
            />

            {/* Fundo opaco para manter o foco no modal */}
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-white opacity-20">BarberGo</h1>
                <p className="text-muted-foreground opacity-20">Autenticação necessária...</p>
            </div>
        </div>
    )
}

// O componente principal agora apenas envolve o conteúdo em um Suspense
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}