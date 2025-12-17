"use client"

import { Button, Card, CardContent, Avatar, AvatarImage, AvatarFallback } from "@barbergo/ui"
import { MenuIcon, LogInIcon, LogOutIcon, LayoutDashboardIcon } from "lucide-react"
import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@barbergo/ui"

const Header = () => {
    const { data: session } = useSession()

    const handleLoginClick = () => signIn("google")
    const handleLogoutClick = () => signOut()

    return (
        <Card className="rounded-none border-0 border-b">
            <CardContent className="flex flex-row items-center justify-between p-5">
                <Link href="/">
                    <h1 className="text-xl font-bold">BarberGo</h1>
                </Link>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MenuIcon />
                        </Button>
                    </SheetTrigger>

                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle className="text-left">Menu</SheetTitle>
                        </SheetHeader>

                        <div className="flex flex-col gap-3 py-4">
                            {session?.user ? (
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 py-2">
                                        <Avatar>
                                            <AvatarImage src={session.user.image ?? ""} />
                                            <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{session.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{session.user.email}</span>
                                        </div>
                                    </div>

                                    {/* Link para o Dashboard (Só aparece se logado) */}
                                    <Button variant="outline" className="justify-start gap-2" asChild>
                                        <Link href="/admin">
                                            <LayoutDashboardIcon size={18} />
                                            Painel de Gestão
                                        </Link>
                                    </Button>

                                    <Button variant="destructive" className="justify-start gap-2" onClick={handleLogoutClick}>
                                        <LogOutIcon size={18} />
                                        Sair da conta
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outline" className="justify-start gap-2" asChild>
                                    <Link href="/login">
                                        <LogInIcon size={18} />
                                        Fazer Login
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </CardContent>
        </Card>
    )
}

export default Header