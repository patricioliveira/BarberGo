"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import {
    Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
    Badge // Supondo que exista no seu @barbergo/ui, caso não, usaremos uma div estilizada
} from "@barbergo/ui"
import Header from "@/_components/header"
import { Loader2, KeyRound, Mail, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { changePassword, updateProfile } from "@/_actions/update-user"

export default function ProfilePage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

    // Estados do Perfil
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")

    // Identifica se é usuário Google (pela imagem ou ausência de senha se implementado no session)
    const isGoogleAccount = session?.user?.image?.includes("googleusercontent.com")

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }
        
    if (!session?.user) {
        redirect("/")
    }

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "")
            setEmail(session.user.email || "")
        }
    }, [status, session, router])

    const [currentPass, setCurrentPass] = useState("")
    const [newPass, setNewPass] = useState("")
    const [confirmPass, setConfirmPass] = useState("")

    const defaultAvatar = "https://static.vecteezy.com/ti/vetor-gratis/p1/46533466-volta-pessoa-botao-icone-conta-e-meu-pagina-botao-vetor.jpg"
    const userImage = session?.user?.image || defaultAvatar

    const handleUpdateProfile = async () => {
        setIsLoading(true)
        const res = await updateProfile({ name, email })

        if (res.success) {
            await update({ name, email })
            alert("Perfil atualizado com sucesso!")
        } else {
            alert(res.error)
        }
        setIsLoading(false)
    }

    const handleChangePassword = async () => {
        if (newPass !== confirmPass) return alert("As senhas não coincidem.")
        if (newPass.length < 6) return alert("A nova senha deve ter no mínimo 6 caracteres.")

        setIsLoading(true)
        const res = await changePassword({ currentPass, newPass })

        if (res.success) {
            alert("Senha alterada com sucesso!")
            setIsPasswordModalOpen(false)
            setCurrentPass(""); setNewPass(""); setConfirmPass("")
        } else {
            alert(res.error)
        }
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-background text-white pb-10">
            <Header />

            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="bg-[#1A1B1F] border-secondary text-white max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound size={20} className="text-primary" /> Alterar Senha
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Digite sua senha atual e a nova para realizar a troca.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Senha Atual</Label>
                            <Input
                                type="password"
                                value={currentPass}
                                onChange={(e) => setCurrentPass(e.target.value)}
                                className="bg-secondary border-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input
                                type="password"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                className="bg-secondary border-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Nova Senha</Label>
                            <Input
                                type="password"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                className="bg-secondary border-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleChangePassword} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 animate-spin" size={16} />}
                            Confirmar Troca
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="container mx-auto p-6 md:p-8 max-w-2xl">
                <Card className="bg-[#1A1B1F] border-none shadow-2xl">
                    <CardHeader className="flex flex-col items-center gap-4 pb-2">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden">
                                <Image
                                    src={userImage}
                                    alt="Avatar"
                                    width={96}
                                    height={96}
                                    className="object-cover"
                                    unoptimized={isGoogleAccount}
                                />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-background p-1 rounded-full border border-secondary">
                                {isGoogleAccount ? (
                                    <Image src="/google.svg" alt="Google" width={20} height={20} />
                                ) : (
                                    <Mail size={18} className="text-primary" />
                                )}
                            </div>
                        </div>

                        <div className="text-center">
                            <CardTitle className="text-2xl font-bold">{session?.user?.name}</CardTitle>
                            <div className="flex justify-center mt-2">
                                {isGoogleAccount ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold">
                                        <ShieldCheck size={14} /> Autenticado via Google
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                                        <Mail size={14} /> Conta BarberGo
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="text-gray-400">Nome Completo</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-secondary border-none h-12 focus-visible:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">E-mail de Acesso</Label>
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-secondary border-none h-12 focus-visible:ring-primary"
                                disabled={isGoogleAccount} // O e-mail do Google é a identidade, não deve ser alterado aqui
                            />
                            {isGoogleAccount && (
                                <p className="text-[10px] text-gray-500 italic">O e-mail de contas Google deve ser alterado no seu painel Google.</p>
                            )}
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button
                                className="w-full h-12 font-bold text-white transition-all hover:scale-[1.01]"
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 animate-spin" size={18} />}
                                Salvar Alterações
                            </Button>

                            <div className="relative group">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-secondary bg-transparent hover:bg-secondary text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    disabled={isLoading || isGoogleAccount}
                                >
                                    <KeyRound size={18} className="mr-2" /> Alterar Senha
                                </Button>

                                {isGoogleAccount && (
                                    <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-secondary shadow-xl">
                                        Usuários Google gerenciam senhas no Google.com
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}