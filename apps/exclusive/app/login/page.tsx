"use client"

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@barbergo/ui"
import { signIn } from "next-auth/react"
import { ScissorsIcon } from "lucide-react"
import Image from "next/image"
import { appConfig } from "../config"

export default function LoginPage() {
    const handleLoginClick = async () => {
        // Redireciona para o Google e depois volta para a Home (ou Admin se preferir)
        await signIn("google", { callbackUrl: "/admin" })
    }

    return (
        <div className="flex h-screen items-center justify-center bg-muted/20 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <ScissorsIcon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">BarberGo</CardTitle>
                    <CardDescription>
                        Faça login para gerenciar seus agendamentos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        className="w-full gap-2"
                        variant="outline"
                        onClick={handleLoginClick}
                    >
                        <Image
                            src="/google.svg"
                            alt="Google"
                            width={18}
                            height={18}
                        />
                        Entrar com Google
                    </Button>

                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        <p>Acesso exclusivo para clientes e colaboradores.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}