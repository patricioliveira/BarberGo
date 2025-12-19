"use client"

import Image from "next/image"
import { Card, CardContent, Button, Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, Avatar, AvatarImage, AvatarFallback } from "@barbergo/ui"
import { MenuIcon, CalendarIcon, HomeIcon, LogInIcon, LogOutIcon, UserIcon, LayoutDashboardIcon } from "lucide-react"
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

const Header = () => {
    const { data: session } = useSession()
    const [isAuthOpen, setIsAuthOpen] = useState(false)

    // Verifica se tem permissão de acesso ao painel
    const hasAdminAccess = session?.user?.role === "ADMIN" || session?.user?.role === "STAFF"

    return (
        <Card className="border-none rounded-none">
            <CardContent className="p-5 justify-between items-center flex flex-row">
                {/* Logo */}
                <Link href="/">
                    <Image src="/logo.png" alt="FSW Barber" height={22} width={120} />
                </Link>

                {/* Botão Menu Hamburguer (Mobile) */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MenuIcon size={16} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="p-0">
                            <SideMenu />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Menu Desktop (Dropdown) */}
                <div className="hidden md:flex gap-4 items-center">
                    {session?.user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2 font-bold">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={session.user.image ?? ""} />
                                        <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    {session.user.name}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-[#1A1B1F] border-[#26272B] text-white">
                                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>

                                {/* OPÇÃO DE ADMIN/STAFF */}
                                {hasAdminAccess && (
                                    <>
                                        <DropdownMenuItem asChild className="hover:bg-[#26272B] cursor-pointer">
                                            <Link href="/admin" className="flex items-center gap-2 w-full font-bold text-primary">
                                                <LayoutDashboardIcon size={16} />
                                                Painel {session.user.role === 'ADMIN' ? 'Admin' : 'Staff'}
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-[#26272B]" />
                                    </>
                                )}

                                <DropdownMenuItem asChild className="hover:bg-[#26272B] cursor-pointer">
                                    <Link href="/appointments" className="flex items-center gap-2 w-full">
                                        <CalendarIcon size={16} />
                                        Agendamentos
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-[#26272B]" />

                                <DropdownMenuItem
                                    onClick={() => signOut()}
                                    className="text-red-500 hover:bg-red-500/10 hover:text-red-500 cursor-pointer flex items-center gap-2"
                                >
                                    <LogOutIcon size={16} />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                            <Button
                                onClick={() => setIsAuthOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6"
                            >
                                <LogInIcon className="mr-2 h-4 w-4" />
                                Fazer Login
                            </Button>
                    )}
                </div>
                <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
            </CardContent>
        </Card>
    )
}

export default Header