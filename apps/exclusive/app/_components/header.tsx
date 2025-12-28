"use client"

import Image from "next/image"
import { Card, CardContent, Button, Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, Avatar, AvatarImage, AvatarFallback } from "@barbergo/ui"
import { MenuIcon, CalendarIcon, HomeIcon, LogInIcon, LogOutIcon, UserIcon, LayoutDashboardIcon, UserRoundPen } from "lucide-react"
import { usePathname } from "next/navigation"

import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"
import SideMenu from "./side-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@barbergo/ui"
import AuthDialog from "./auth-dialog"
import { useState } from "react"
import UserNotificationBell from "./user-notification-bell"
import { NotificationBell } from "./notification-bell"

const Header = () => {
    const { data: session } = useSession()
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const pathname = usePathname()

    const hasAdminAccess = session?.user?.role === "ADMIN" || session?.user?.role === "STAFF"
    // const isCommonUser = session?.user?.role === "USER" // Removed strict check

    return (
        <Card className="border-none rounded-none bg-[#141518]/80 backdrop-blur-md sticky top-0 z-50 pt-safe transition-all duration-300">
            <CardContent className="p-5 justify-between items-center flex flex-row">
                {/* Logo */}
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Image src="/logo.png" alt="BarberGo" height={22} width={120} />
                </Link>

                {/* Área de Ações */}
                <div className="flex items-center gap-2">

                    {/* SININHO DE AGENDAMENTOS (PARA TODOS OS USUÁRIOS LOGADOS, EXCETO EM /admin) */}
                    {session?.user && !pathname?.startsWith("/admin") && (
                        <UserNotificationBell />
                    )}

                    {/* Botão Menu Hamburguer (Mobile) */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="rounded-xl">
                                    <MenuIcon size={16} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="p-0 pt-[calc(env(safe-area-inset-top)+1rem)] border-none">
                                <SideMenu />
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Menu Desktop */}
                    <div className="hidden md:flex gap-4 items-center">
                        {session?.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2 font-bold hover:bg-secondary rounded-xl transition-all">
                                        <Avatar className="h-8 w-8 border border-primary/20">
                                            <AvatarImage src={session.user.image ?? ""} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{session.user.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-white">{session.user.name?.split(" ")[0]}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-[#1A1B1F] border-[#26272B] text-white rounded-2xl p-2 shadow-2xl">
                                    <DropdownMenuLabel className="text-gray-400 text-[10px] uppercase font-black px-3 py-2 tracking-widest">Minha Conta</DropdownMenuLabel>

                                    {hasAdminAccess && (
                                        <>
                                            <DropdownMenuItem asChild className="hover:bg-[#26272B] cursor-pointer rounded-xl">
                                                <Link href="/admin" className="flex items-center gap-2 w-full font-bold text-primary">
                                                    <LayoutDashboardIcon size={16} />
                                                    Painel {session.user.role === 'ADMIN' ? 'Admin' : 'Staff'}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-[#26272B] my-2" />
                                        </>
                                    )}

                                    <DropdownMenuItem asChild className="hover:bg-[#26272B] cursor-pointer rounded-xl">
                                        <Link href="/profile" className="flex items-center gap-2 w-full">
                                            <UserRoundPen size={16} className="text-gray-400" />
                                            Editar Perfil
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem asChild className="hover:bg-[#26272B] cursor-pointer rounded-xl">
                                        <Link href="/appointments" className="flex items-center gap-2 w-full">
                                            <CalendarIcon size={16} className="text-gray-400" />
                                            Agendamentos
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-[#26272B] my-2" />

                                    <DropdownMenuItem
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500 cursor-pointer rounded-xl flex items-center gap-2 font-medium"
                                    >
                                        <LogOutIcon size={16} />
                                        Sair da conta
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                onClick={() => setIsAuthOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-10 transition-all active:scale-95"
                            >
                                <LogInIcon className="mr-2 h-4 w-4" />
                                Fazer Login
                            </Button>
                        )}
                    </div>
                </div>
                <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
            </CardContent>
        </Card>
    )
}

export default Header