"use client"

import { Card, CardContent } from "@barbergo/ui"
import { Button } from "@barbergo/ui"
import { MenuIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import SideMenu from "./side-menu"
import { Sheet, SheetContent, SheetTrigger } from "@barbergo/ui"

const Header = () => {
    return (
        <Card>
            <CardContent className="flex flex-row items-center justify-between p-5">
                <Link href="/">
                    <Image src="/logo.png" height={18} width={120} alt="BarberGo" />
                </Link>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button size="icon" variant="outline">
                            <MenuIcon />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="p-0">
                        <SideMenu />
                    </SheetContent>
                </Sheet>
            </CardContent>
        </Card>
    )
}

export default Header