"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from "@barbergo/ui"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AuthDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    callbackUrl?: string // Adicionado para flexibilidade
}

const AuthDialog = ({ isOpen, onOpenChange, callbackUrl = "/" }: AuthDialogProps) => {
    const router = useRouter()
    const [variant, setVariant] = useState<"LOGIN" | "REGISTER">("LOGIN")
    const [isLoading, setIsLoading] = useState(false)

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const toggleVariant = () => {
        setVariant(variant === "LOGIN" ? "REGISTER" : "LOGIN")
    }

    const handleGoogleLogin = () => {
        setIsLoading(true)
        // Usa o callbackUrl passado via props
        signIn("google", { callbackUrl }).finally(() => setIsLoading(false))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (variant === "REGISTER") {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password }),
                })

                if (!res.ok) {
                    if (res.status === 409) throw new Error("Email já cadastrado.")
                    throw new Error("Erro ao registrar.")
                }

                toast.success("Conta criada! Faça login.")
                setVariant("LOGIN")
            }

            if (variant === "LOGIN") {
                const res = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                })

                if (res?.error) {
                    throw new Error("Credenciais inválidas.")
                }

                toast.success("Login realizado com sucesso!")
                onOpenChange(false)

                // Redireciona e recarrega
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90%] max-w-[400px] rounded-2xl bg-[#1A1B1F] border border-[#26272B] text-white">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                        {variant === "LOGIN" ? "Faça login na plataforma" : "Crie sua conta grátis"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <Button
                        variant="outline"
                        type="button"
                        className="w-full gap-2 border-[#26272B] bg-[#141518] hover:bg-[#26272B] text-white h-12 rounded-xl"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <Image src="/google.svg" alt="Google" width={18} height={18} />
                        Continuar com Google
                    </Button>

                    <div className="flex items-center gap-2">
                        <div className="h-[1px] w-full bg-[#26272B]" />
                        <span className="text-xs text-gray-500 whitespace-nowrap">OU EMAIL</span>
                        <div className="h-[1px] w-full bg-[#26272B]" />
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {variant === "REGISTER" && (
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Nome completo</Label>
                                <Input
                                    disabled={isLoading}
                                    placeholder="Seu nome"
                                    className="bg-[#141518] border-[#26272B] text-white rounded-xl h-11"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label className="text-xs text-gray-400">Email</Label>
                            <Input
                                disabled={isLoading}
                                type="email"
                                placeholder="seu@email.com"
                                className="bg-[#141518] border-[#26272B] text-white rounded-xl h-11"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-gray-400">Senha</Label>
                            <Input
                                disabled={isLoading}
                                type="password"
                                placeholder="******"
                                className="bg-[#141518] border-[#26272B] text-white rounded-xl h-11"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 w-full bg-primary hover:bg-primary/80 text-white font-bold h-12 rounded-xl"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {variant === "LOGIN" ? "Entrar" : "Criar conta"}
                        </Button>
                    </form>

                    <div className="text-center mt-2">
                        <p className="text-sm text-gray-400">
                            {variant === "LOGIN" ? "Novo por aqui?" : "Já tem uma conta?"}{" "}
                            <button
                                type="button"
                                onClick={toggleVariant}
                                className="text-primary hover:underline font-bold"
                            >
                                {variant === "LOGIN" ? "Cadastre-se" : "Faça login"}
                            </button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AuthDialog