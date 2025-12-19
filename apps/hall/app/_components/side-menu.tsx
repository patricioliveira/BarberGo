"use client"

import { Avatar, AvatarImage } from "@barbergo/ui"
import { Button } from "@barbergo/ui"
import { SheetHeader, SheetTitle } from "@barbergo/ui"
import { CalendarIcon, HomeIcon, LogInIcon, LogOutIcon, ShieldCheck, UserIcon, UserRoundPen } from "lucide-react"
import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"
import AuthDialog from "./auth-dialog"

const SideMenu = () => {
    const { data } = useSession()
    const [isAuthOpen, setIsAuthOpen] = useState(false)

    const handleLoginClick = () => setIsAuthOpen(true)
    const handleLogoutClick = () => signOut()

    return (
        <>
            <SheetHeader className="border-b border-solid border-secondary p-5 text-left">
                <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            {data?.user ? (
                <div className="flex justify-between px-5 py-6">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={data.user?.image ?? ""} />
                        </Avatar>

                        <h2 className="font-bold">{data.user.name}</h2>
                    </div>

                    <Button variant="secondary" size="icon">
                        <LogOutIcon onClick={handleLogoutClick} />
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-3 px-5 py-6">
                    <div className="flex items-center gap-2">
                        <UserIcon size={32} />
                        <h2 className="font-bold">Olá, faça seu login!</h2>
                    </div>
                    <Button variant="secondary" className="w-full justify-start" onClick={handleLoginClick}>
                        <LogInIcon className="mr-2" size={18} />
                        Fazer Login
                    </Button>
                </div>
            )}

            <div className="flex flex-col gap-3 px-5">
                <Button variant="outline" className="justify-start" asChild>
                    <Link href="/">
                        <HomeIcon size={18} className="mr-2" />
                        Início
                    </Link>
                </Button>

                {/* Idealmente, verifique se o usuário é admin antes de mostrar, mas por hora adicionamos a rota */}
                {data?.user && (
                    <Button variant="outline" className="justify-start" asChild>
                        <Link href="/admin">
                            <ShieldCheck size={18} className="mr-2" />
                            Painel Admin
                        </Link>
                    </Button>
                )}

                {data?.user && (
                    <Button variant="outline" className="justify-start" asChild>
                        <Link href="/profile">
                            <UserRoundPen size={18} className="mr-2" />
                            Editar Perfil
                        </Link>
                    </Button>
                )}
                
                {data?.user && (
                    <Button variant="outline" className="justify-start" asChild>
                        <Link href="/appointments">
                            <CalendarIcon size={18} className="mr-2" />
                            Agendamentos
                        </Link>
                    </Button>
                )}
            </div>
            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
        </>
    )
}

export default SideMenu