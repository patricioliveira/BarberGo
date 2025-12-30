"use client"

import { Card, CardContent } from "@barbergo/ui"
import { Button } from "@barbergo/ui"
import { Badge } from "@barbergo/ui"
import { BarbershopImage } from "./barbershop-image"
import { StarIcon } from "lucide-react"
import { Barbershop, Rating } from "@prisma/client"
import Link from "next/link"

interface BarbershopItemProps {
    barbershop: Barbershop & {
        ratings?: Rating[] // Torna ratings opcional para compatibilidade
    }
}

const BarbershopItem = ({ barbershop }: BarbershopItemProps) => {
    // Lógica de cálculo da média
    const ratings = barbershop.ratings || []
    const averageRating = ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length
        : 5.0

    return (
        <Card className="w-[167px] min-w-[167px] rounded-2xl bg-card border-none shadow-md flex-none group">
            <CardContent className="px-1 py-1 pb-4">
                {/* Imagem com Badge de Rating */}
                <div className="relative w-full h-[159px] overflow-hidden rounded-2xl">
                    <div className="absolute top-2 left-2 z-50">
                        <Badge variant="secondary" className="opacity-90 flex items-center gap-1 bg-[#1A1B1F]/70 backdrop-blur-sm text-white border-white/10">
                            <StarIcon size={12} className="fill-primary text-primary" />
                            <span className="text-xs font-bold">{averageRating.toFixed(1)}</span>
                        </Badge>
                    </div>

                    <BarbershopImage
                        src={barbershop.imageUrl}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={barbershop.name}
                    />
                </div>

                {/* Informações */}
                <div className="px-2 mt-3">
                    <h2 className="font-bold text-white overflow-hidden text-ellipsis text-nowrap">
                        {barbershop.name}
                    </h2>
                    <p className="text-sm text-gray-400 overflow-hidden text-ellipsis text-nowrap">
                        {barbershop.address}
                    </p>

                    <Button className="w-full mt-3 rounded-xl bg-[#26272B] hover:bg-primary hover:text-white transition-colors text-gray-300" variant="secondary" asChild>
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