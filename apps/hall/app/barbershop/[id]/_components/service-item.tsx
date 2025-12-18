"use client"

import { Barbershop, BarbershopService } from "@prisma/client"
import { Button, Card, CardContent } from "@barbergo/ui"
import Image from "next/image"

interface ServiceItemProps {
    service: Omit<BarbershopService, "price"> & { price: number }
    barbershop: Barbershop
    isSelected: boolean // Novo
    onSelect: () => void // Novo
}

const ServiceItem = ({ service, isSelected, onSelect }: ServiceItemProps) => {
    return (
        <Card className={`border-none rounded-xl transition-all ${isSelected ? "bg-[#26272B] ring-1 ring-primary" : "bg-[#1A1B1F]"}`}>
            <CardContent className="p-3 flex items-center gap-4">

                <div className="relative min-h-[110px] min-w-[110px] max-h-[110px] max-w-[110px]">
                    <Image
                        src={service.imageUrl}
                        fill
                        className="object-cover rounded-lg"
                        alt={service.name}
                    />
                </div>

                <div className="flex flex-col w-full">
                    <h3 className="font-bold text-sm text-white">{service.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{service.description}</p>

                    <div className="flex items-center justify-between mt-3">
                        <p className="text-sm font-bold text-white">
                            {Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                            }).format(service.price)}
                        </p>

                        <Button
                            variant={isSelected ? "default" : "secondary"}
                            className={`text-xs h-8 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-[#141518] text-white hover:bg-[#26272B]"}`}
                            onClick={onSelect}
                        >
                            {isSelected ? "Selecionado" : "Reservar"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ServiceItem