"use client"

import { Card, CardContent } from "@barbergo/ui"
import { Button } from "@barbergo/ui"
import { Badge } from "@barbergo/ui"
import Image from "next/image"
import { StarIcon } from "lucide-react"
import { Barbershop } from "@prisma/client"
import Link from "next/link"

interface BarbershopItemProps {
    barbershop: Barbershop
}

const BarbershopItem = ({ barbershop }: BarbershopItemProps) => {
    return (
        <Card className="min-w-[167px] max-w-[167px] rounded-2xl bg-card border-none shadow-md">
            <CardContent className="px-1 py-1 pb-4">
                {/* Imagem com Badge de Rating */}
                <div className="relative w-full h-[159px]">
                    <div className="absolute top-2 left-2 z-50">
                        <Badge variant="secondary" className="opacity-90 flex items-center gap-1 bg-[#1A1B1F]/70 backdrop-blur-sm text-white">
                            <StarIcon size={12} className="fill-primary text-primary" />
                            <span className="text-xs font-bold">5.0</span>
                        </Badge>
                    </div>

                    <Image
                        src={barbershop.imageUrl}
                        fill
                        className="rounded-2xl object-cover filter brightness-75"
                        alt={barbershop.name}
                    />
                </div>

                {/* Informações */}
                <div className="px-2 mt-3">
                    <h2 className="font-bold text-white overflow-hidden text-ellipsis text-nowrap">
                        {barbershop.name}
                    </h2>
                    <p className="text-sm text-gray-03 overflow-hidden text-ellipsis text-nowrap">
                        {barbershop.address}
                    </p>

                    <Button className="w-full mt-3 rounded-xl bg-[#26272B] hover:bg-[#3E3F45] text-white" variant="secondary" asChild>
                        <Link href={`/barbershop/${barbershop.id}`}>
                            Agendar
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default BarbershopItem