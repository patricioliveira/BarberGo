"use client"

import { Card, CardContent, Button, Sheet, SheetTrigger, SheetContent, Avatar, AvatarImage, AvatarFallback } from "@barbergo/ui"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@barbergo/ui"
import { MenuIcon, LogInIcon, LogOutIcon, CalendarIcon, UserIcon, ChevronDownIcon } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import SideMenu from "./side-menu"
import AuthDialog from "./auth-dialog"
import { useState } from "react"

const Header = () => {
    const { data: session } = useSession()
    const [isAuthOpen, setIsAuthOpen] = useState(false)

    return (
        <>
            <Card className="rounded-none border-none bg-card shadow-md z-50 relative">
                <CardContent className="flex flex-row items-center justify-between p-3 md:px-10">

                    {/* LOGO */}
                    <Link href="/" className="flex items-center">
                        <div className="flex items-center">
                            <img src="/logo.svg" alt="Logo BarberGO" className="h-[2.6rem]" />
                        </div>
                    </Link>

                    {/* DESKTOP ACTIONS */}
                    <div className="hidden md:flex items-center gap-8">
                        {/* O link "Início" pode ficar visível ou ir para o dropdown também, dependendo da preferência. Vou manter aqui para acesso rápido. */}
                        <Link href="/" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Início
                        </Link>

                        {session?.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-3 hover:bg-transparent p-0">
                                        <div className="flex items-center gap-2 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-white leading-none">{session.user.name}</span>
                                                <span className="text-xs text-gray-500">Cliente</span>
                                            </div>
                                            <Avatar className="h-10 w-10 border border-[#26272B]">
                                                <AvatarImage src={session.user.image ?? ""} />
                                                <AvatarFallback className="bg-[#26272B]">{session.user.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <ChevronDownIcon size={16} className="text-gray-500" />
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent className="w-56 bg-[#1A1B1F] border-[#26272B] text-white">
                                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-[#26272B]" />

                                    <DropdownMenuItem className="cursor-pointer focus:bg-[#26272B]" asChild>
                                        <Link href="/appointments" className="flex items-center gap-2 w-full">
                                            <CalendarIcon size={16} />
                                            Agendamentos
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-[#26272B]" />

                                    <DropdownMenuItem
                                        className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                        onClick={() => signOut()}
                                    >
                                        <div className="flex items-center gap-2">
                                            <LogOutIcon size={16} />
                                            Sair
                                        </div>
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

                    {/* MOBILE MENU */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-transparent">
                                    <MenuIcon size={24} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="p-0 border-l border-secondary">
                                <SideMenu />
                            </SheetContent>
                        </Sheet>
                    </div>

                </CardContent>
            </Card>

            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
        </>
    )
}

export default Header