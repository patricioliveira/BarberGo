"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect, useRouter } from "next/navigation"
import {
    Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
    Badge
} from "@barbergo/ui"
import Header from "@/_components/header"
import {
    Loader2, KeyRound, Mail, ShieldCheck,
    Plus, Trash2, MessageCircle, Phone
} from "lucide-react"
import Image from "next/image"
import { changePassword, getUserProfile, updateProfile } from "@/_actions/update-user"
import Footer from "@/_components/footer"
import { toast } from "sonner"

interface UserPhone {
    number: string
    isWhatsApp: boolean
}

export default function ProfilePage() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

    // Estados do Perfil
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phones, setPhones] = useState<UserPhone[]>([])

    const isGoogleAccount = session?.user?.image?.includes("googleusercontent.com")

    // --- FUNÇÃO DE MÁSCARA ---
    const phoneMask = (value: string) => {
        if (!value) return ""
        let v = value.replace(/\D/g, "") // Remove tudo o que não é dígito
        if (v.length > 11) v = v.slice(0, 11) // Limita a 11 dígitos

        v = v.replace(/^(\d{2})(\d)/g, "($1) $2") // Coloca parênteses em volta dos dois primeiros dígitos
        v = v.replace(/(\d)(\d{4})$/, "$1-$2")    // Coloca hífen antes dos últimos quatro dígitos
        return v
    }

    // Funções para Gerenciar Telefones
    const addPhone = () => {
        setPhones([...phones, { number: "", isWhatsApp: false }])
    }

    const removePhone = (index: number) => {
        setPhones(phones.filter((_, i) => i !== index))
    }

    const updatePhone = (index: number, field: keyof UserPhone, value: string | boolean) => {
        const newPhones = [...phones]
        // Se for o campo número, aplica a máscara antes de salvar no estado
        const finalValue = field === "number" ? phoneMask(value as string) : value

        newPhones[index] = { ...newPhones[index], [field]: finalValue }
        setPhones(newPhones)
    }

    const [currentPass, setCurrentPass] = useState("")
    const [newPass, setNewPass] = useState("")
    const [confirmPass, setConfirmPass] = useState("")

    const defaultAvatar = "https://static.vecteezy.com/ti/vetor-gratis/p1/46533466-volta-pessoa-botao-icone-conta-e-meu-pagina-botao-vetor.jpg"
    const userImage = session?.user?.image || defaultAvatar

    useEffect(() => {
        const loadUserData = async () => {
            if (status === "authenticated") {
                setIsLoading(true)
                try {
                    const userData = await getUserProfile()
                    if (userData) {
                        setName(userData.name || "")
                        setEmail(userData.email || "")
                        const savedPhones = userData.UserPhone as any[]
                        if (savedPhones && Array.isArray(savedPhones)) {
                            setPhones(savedPhones)
                        }
                    }
                } catch (error) {
                    toast.error("Erro ao carregar dados do perfil")
                } finally {
                    setIsLoading(false)
                }
            }
        }
        loadUserData()
    }, [status])

    const handleUpdateProfile = async () => {
        // 1. Filtra telefones vazios (caso o usuário tenha clicado em adicionar e não preencheu)
        const activePhones = phones.filter(p => p.number.trim() !== "")

        // 2. Valida se os telefones preenchidos estão completos
        const hasInvalidPhone = activePhones.some(p => {
            const digits = p.number.replace(/\D/g, "")
            return digits.length < 10 // Mínimo de 10 dígitos (DDD + 8 números)
        })

        if (hasInvalidPhone) {
            return toast.error("Um ou mais telefones estão incompletos. Verifique o DDD e o número.")
        }

        setIsLoading(true)
        try {
            // Envia os telefones filtrados (sem campos vazios)
            const res = await updateProfile({ name, email, phones: activePhones })

            if (res.success) {
                await update({
                    ...session,
                    user: {
                        ...session?.user,
                        name: name,
                        UserPhone: activePhones,
                    }
                })

                // Atualiza o estado local para remover as linhas vazias que foram filtradas
                setPhones(activePhones)
                toast.success("Perfil atualizado com sucesso!")
            } else {
                toast.error(res.error || "Erro ao atualizar")
            }
        } catch (error) {
            toast.error("Erro na comunicação com o servidor")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChangePassword = async () => {
        if (newPass !== confirmPass) return toast.error("As senhas não coincidem.")
        if (newPass.length < 6) return toast.error("A nova senha deve ter no mínimo 6 caracteres.")

        setIsLoading(true)
        const res = await changePassword({ currentPass, newPass })

        if (res.success) {
            toast.success("Senha alterada com sucesso!")
            setIsPasswordModalOpen(false)
            setCurrentPass(""); setNewPass(""); setConfirmPass("")
        } else {
            toast.error(res.error || "Erro ao alterar senha")
        }
        setIsLoading(false)
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    if (!session?.user) redirect("/")

    return (
        <div className="min-h-screen bg-background text-white pb-10">
            <Header />

            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="bg-[#1A1B1F] border-secondary text-white max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 italic">
                            <KeyRound size={20} className="text-primary" /> Alterar Senha
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Confirme sua senha atual para definir uma nova.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Senha Atual</Label>
                            <Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} className="bg-secondary border-none h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="bg-secondary border-none h-12" />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Nova Senha</Label>
                            <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="bg-secondary border-none h-12" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={isLoading} className="border-secondary">Cancelar</Button>
                        <Button onClick={handleChangePassword} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 animate-spin" size={16} />}
                            Alterar Senha
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
                            <div className="absolute bottom-0 right-0 bg-background p-1 rounded-full border border-secondary shadow-md">
                                {isGoogleAccount ? (
                                    <Image src="/google.svg" alt="Google" width={18} height={18} />
                                ) : (
                                    <Mail size={16} className="text-primary" />
                                )}
                            </div>
                        </div>

                        <div className="text-center">
                            <CardTitle className="text-2xl font-bold">{name}</CardTitle>
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
                            <Label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Nome Completo</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-secondary border-none h-12 focus-visible:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">E-mail de Acesso</Label>
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-secondary border-none h-12 focus-visible:ring-primary"
                                disabled={isGoogleAccount}
                            />
                        </div>

                        <div className="space-y-4 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <Label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Meus Contatos</Label>
                                <Button variant="ghost" size="sm" onClick={addPhone} className="text-primary hover:bg-primary/10 h-7 text-xs gap-1">
                                    <Plus size={14} /> Adicionar
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {phones.map((phone, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="relative flex-1">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <Input
                                                placeholder="(00) 00000-0000"
                                                value={phone.number}
                                                onChange={(e) => updatePhone(index, "number", e.target.value)}
                                                className="bg-secondary border-none h-12 pl-10 focus-visible:ring-primary"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => updatePhone(index, "isWhatsApp", !phone.isWhatsApp)}
                                                className={`flex-1 sm:flex-none h-12 border-none transition-all gap-2 ${phone.isWhatsApp ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : 'bg-secondary text-gray-400'
                                                    }`}
                                            >
                                                <MessageCircle size={18} />
                                                <span className="text-xs font-bold uppercase tracking-tighter">WhatsApp</span>
                                            </Button>
                                            <Button variant="ghost" onClick={() => removePhone(index)} className="h-12 w-12 text-red-500 hover:bg-red-500/10">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {phones.length === 0 && (
                                    <p className="text-[11px] text-gray-500 italic text-center py-2">Nenhum telefone cadastrado.</p>
                                )}
                            </div>
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

                            {!isGoogleAccount && (
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-secondary bg-transparent hover:bg-secondary text-gray-300"
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    disabled={isLoading}
                                >
                                    <KeyRound size={18} className="mr-2" /> Alterar Senha
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </div>
    )
}