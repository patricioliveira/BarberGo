"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button, SheetHeader, SheetTitle, Avatar, AvatarImage, AvatarFallback } from "@barbergo/ui"
import { CalendarIcon, HomeIcon, LogInIcon, LogOutIcon, UserIcon, LayoutDashboardIcon, UserRoundPen } from "lucide-react"
import Link from "next/link"
import PWAInstallButton from "./pwa-install-button" // Import do novo botão
import AuthDialog from "./auth-dialog"
import { useState } from "react"

const SideMenu = () => {
    const { data: session } = useSession()
    const [isAuthOpen, setIsAuthOpen] = useState(false)

    const handleLogoutClick = () => signOut()
    const handleLoginClick = () => setIsAuthOpen(true)

    return (
        <>
            <SheetHeader className="text-left border-b border-secondary p-5">
                <SheetTitle className="text-white">Menu</SheetTitle>
            </SheetHeader>

            {/* PERFIL / LOGIN */}
            <div className="flex flex-col px-5 py-6 gap-3">
                {session?.user ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-primary/20">
                                <AvatarImage src={session.user.image ?? ""} alt={session.user.name ?? ""} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {session.user.name?.[0] ?? "U"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col">
                                <p className="font-bold text-white">{session.user.name}</p>
                                <p className="text-xs text-gray-400">{session.user.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogoutClick} className="text-gray-500 hover:text-red-500">
                            <LogOutIcon size={18} />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <UserIcon size={32} className="text-gray-500" />
                            <h2 className="font-bold text-white">Olá, faça seu login!</h2>
                        </div>
                        <Button variant="secondary" className="w-full justify-start gap-2 rounded-xl" onClick={handleLoginClick}>
                            <LogInIcon size={18} />
                            Fazer Login
                        </Button>
                    </div>
                )}
            </div>

            {/* NAVEGAÇÃO */}
            <div className="flex flex-col gap-3 px-5">
                <Button variant="outline" className="justify-start gap-2 border-secondary rounded-xl" asChild>
                    <Link href="/">
                        <HomeIcon size={18} />
                        Início
                    </Link>
                </Button>

                {session?.user && (
                    <>
                        <Button variant="outline" className="justify-start gap-2 border-secondary rounded-xl" asChild>
                            <Link href="/appointments">
                                <CalendarIcon size={18} />
                                Agendamentos
                            </Link>
                        </Button>

                        <Button variant="outline" className="justify-start gap-2 border-secondary rounded-xl" asChild>
                            <Link href="/profile">
                                <UserRoundPen size={18} />
                                Editar Perfil
                            </Link>
                        </Button>

                        {(session.user.role === "ADMIN" || session.user.role === "STAFF") && (
                            <Button variant="default" className="justify-start gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white border-none rounded-xl font-bold" asChild>
                                <Link href="/admin">
                                    <LayoutDashboardIcon size={18} />
                                    Painel Administrativo
                                </Link>
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* BOTÃO PWA (Aparece apenas se não estiver instalado) */}
            <div className="mt-4 border-t border-white/5 pt-4">
                <PWAInstallButton />
            </div>
            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
        </>
    )
}

export default SideMenu