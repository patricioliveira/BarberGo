"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button, Input, Label } from "@barbergo/ui"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export const LoginForm = () => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (res?.error) throw new Error("Credenciais inválidas.")

            toast.success("Login realizado com sucesso!")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[400px] space-y-6">
            <div className="flex flex-col gap-4">
                <Button
                    variant="outline"
                    type="button"
                    className="w-full gap-2 border-[#26272B] bg-[#141518] hover:bg-[#26272B] text-white h-12 rounded-xl"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
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
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 w-full bg-primary hover:bg-primary/80 text-white font-bold h-12 rounded-xl"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar no CRM
                    </Button>
                </form>
            </div>
        </div>
    )
}