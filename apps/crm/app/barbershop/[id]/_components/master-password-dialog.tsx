"use client"

import { useState, useEffect } from "react"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Label, Input } from "@barbergo/ui"
import { Shield, Lock, Copy, Key, Timer, AlertTriangle } from "lucide-react"
import { generateMasterPassword } from "@/app/_actions/users"
import { toast } from "sonner"
import { differenceInSeconds } from "date-fns"

interface MasterPasswordDialogProps {
    userId: string
    userEmail: string
    userName: string
}

export function MasterPasswordDialog({ userId, userEmail, userName }: MasterPasswordDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState<string | null>(null)
    const [expiresAt, setExpiresAt] = useState<Date | null>(null)
    const [timeLeft, setTimeLeft] = useState<string>("")

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await generateMasterPassword(userId)
            setPassword(res.rawPassword)
            setExpiresAt(new Date(res.expiresAt))
            toast.success("Contra-Senha gerada com sucesso!")
        } catch (error) {
            toast.error("Erro ao gerar contra-senha.")
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Copiado!")
    }

    useEffect(() => {
        if (!expiresAt) return

        const interval = setInterval(() => {
            const diff = differenceInSeconds(expiresAt, new Date())
            if (diff <= 0) {
                setTimeLeft("EXPIRADO")
                setPassword(null) // Clear password on expiration
                setExpiresAt(null)
                clearInterval(interval)
            } else {
                const minutes = Math.floor(diff / 60)
                const seconds = diff % 60
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [expiresAt])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 gap-2 font-bold w-full justify-start">
                    <Shield size={16} /> Gerar Acesso Mestre (Admin)
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1B1F] border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-amber-500">
                        <Lock size={20} /> Acesso Mestre (Admin)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!password ? (
                        <div className="space-y-4 text-center">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
                                <p className="text-sm text-gray-300 font-medium">
                                    Esta ação gera uma contra-senha temporária válida por 2 horas para o usuário <strong>{userName}</strong>.
                                </p>
                                <p className="text-xs text-secondary-foreground mt-2">Use apenas para suporte técnico.</p>
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-amber-600 hover:bg-amber-700 font-bold"
                            >
                                {loading ? "Gerando..." : "Gerar Contra-Senha de Acesso"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/10">
                                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                    <Timer size={16} className="animate-pulse" />
                                    Expira em: <span className="font-mono text-lg">{timeLeft}</span>
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase font-black">Validar Acesso</div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-400 uppercase font-bold">1. Email de Acesso</Label>
                                    <div className="flex gap-2">
                                        <Input value={userEmail} readOnly className="bg-black/20 border-white/10 font-mono text-gray-300" />
                                        <Button size="icon" variant="outline" onClick={() => copyToClipboard(userEmail)} className="border-white/10 hover:bg-white/5">
                                            <Copy size={16} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-400 uppercase font-bold">2. Contra-Senha (Master)</Label>
                                    <div className="flex gap-2">
                                        <div className="relative w-full">
                                            <Input value={password} readOnly className="bg-amber-500/10 border-amber-500/30 text-amber-500 font-mono font-black text-lg tracking-widest text-center" />
                                        </div>
                                        <Button size="icon" onClick={() => copyToClipboard(password)} className="bg-amber-600 hover:bg-amber-700 min-w-[40px]">
                                            <Copy size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-xs text-blue-300">
                                <strong>Instrução:</strong> Abra o Painel do Cliente em uma aba anônima e faça login usando as credenciais acima.
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
