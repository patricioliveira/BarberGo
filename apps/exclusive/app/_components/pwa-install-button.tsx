"use client"

import { useState, useEffect } from "react"
import { Button } from "@barbergo/ui"
import { Download, Smartphone } from "lucide-react"

export default function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Verifica se já está instalado (standalone)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        const handler = (e: any) => {
            // Previne o banner automático do navegador
            e.preventDefault()
            // Guarda o evento para disparar quando o usuário clicar
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Mostra o prompt de instalação
        deferredPrompt.prompt()

        // Espera pela escolha do usuário
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setIsVisible(false)
        }
        setDeferredPrompt(null)
    }

    // Se já estiver instalado ou o navegador não suportar o prompt agora, não mostra nada
    if (isInstalled || !isVisible) return null

    return (
        <div className="px-5 py-3">
            <Button
                onClick={handleInstallClick}
                variant="default"
                className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 rounded-xl font-bold transition-all"
            >
                <Smartphone size={18} />
                Instalar Aplicativo
            </Button>
            <p className="text-[10px] text-gray-500 mt-2 px-1">
                Acesse o Exclusive mais rápido direto da sua tela inicial.
            </p>
        </div>
    )
}