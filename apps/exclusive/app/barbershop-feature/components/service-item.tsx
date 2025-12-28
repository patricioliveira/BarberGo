"use client"

import { Barbershop, BarbershopService } from "@prisma/client"
import { Button, Card, CardContent } from "@barbergo/ui"
import Image from "next/image"

interface ServiceItemProps {
    service: Omit<BarbershopService, "price"> & { price: number }
    barbershop: Barbershop
    isSelected: boolean
    onSelect: () => void
}

const ServiceItem = ({ service, isSelected, onSelect }: ServiceItemProps) => {
    return (
        <Card
            className={`group relative border-none rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${isSelected ? "ring-2 ring-primary bg-primary/5" : "bg-[#1A1B1F] hover:bg-[#202125]"
                }`}
            onClick={onSelect}
        >
            {/* Efeito de Glow no Hover */}
            <div className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

            <CardContent className="p-4 flex items-start gap-4 z-10 relative">
                {/* Imagem Opcional */}
                {service.imageUrl && (
                    <div className="relative h-24 w-24 min-h-[96px] min-w-[96px] rounded-lg overflow-hidden shadow-md group-hover:shadow-primary/20 transition-all duration-300">
                        <Image
                            src={service.imageUrl}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            alt={service.name}
                        />
                    </div>
                )}

                {/* Conteúdo Central */}
                <div className="flex flex-col flex-1 min-w-0 h-full justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-base text-white group-hover:text-primary transition-colors duration-300 truncate">
                            {service.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {service.description}
                        </p>
                    </div>

                    {/* Rodapé do Card: Preço e Botão */}
                    <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-white">
                            {Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                            }).format(service.price)}
                        </p>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-full px-4 font-medium transition-all duration-300 ${isSelected
                                ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25"
                                : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect();
                            }}
                        >
                            {isSelected ? "Selecionado" : "Adicionar"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ServiceItem