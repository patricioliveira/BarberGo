"use client"

import { Barbershop, BarbershopService } from "@prisma/client"
import { Button, Card, CardContent } from "@barbergo/ui"
import Image from "next/image"

interface ServiceItemProps {
    service: Omit<BarbershopService, "price"> & { price: number, originalPrice?: number, promotion?: any }
    barbershop: Barbershop
    isSelected: boolean
    onSelect: () => void
}

const ServiceItem = ({ service, isSelected, onSelect }: ServiceItemProps) => {
    const discountPercentage = service.originalPrice
        ? Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)
        : 0

    return (
        <Card
            className={`border-none rounded-xl transition-all cursor-pointer hover:bg-[#26272B] relative overflow-hidden ${isSelected ? "bg-[#26272B] ring-1 ring-primary" : "bg-[#1A1B1F]"
                }`}
            onClick={onSelect}
        >
            {/* Tag de Desconto */}
            {service.originalPrice && service.originalPrice > service.price && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl z-20">
                    {discountPercentage}% OFF
                </div>
            )}

            <CardContent className="p-3 flex items-center gap-3 sm:gap-4 relative z-10">
                {/* Imagem Opcional */}
                {service.imageUrl && (
                    <div className="relative h-24 w-24 min-h-[96px] min-w-[96px] sm:h-28 sm:w-28 sm:min-h-[112px] sm:min-w-[112px] overflow-hidden">
                        <Image
                            src={service.imageUrl}
                            fill
                            className="object-cover rounded-lg"
                            alt={service.name}
                        />
                    </div>
                )}

                {/* Conteúdo Central */}
                <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">
                        {service.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {service.description}
                    </p>

                    {/* Rodapé do Card: Preço e Botão */}
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between mt-3 gap-2 xs:gap-0">
                        <div className="flex flex-col">
                            {service.originalPrice && (
                                <span className="text-xs text-gray-500 line-through">
                                    {Intl.NumberFormat("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                    }).format(service.originalPrice)}
                                </span>
                            )}
                            <p className="text-sm sm:text-base font-bold text-primary">
                                {Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                }).format(service.price)}
                            </p>
                        </div>

                        <Button
                            variant={isSelected ? "default" : "secondary"}
                            size="sm"
                            className={`text-[10px] sm:text-xs h-8 px-3 rounded-lg font-bold transition-all ${isSelected
                                ? "bg-primary text-white hover:bg-primary/90"
                                : "bg-[#141518] text-white hover:bg-[#26272B] border border-secondary"
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect();
                            }}
                        >
                            {isSelected ? "Selecionado" : (
                                <>
                                    <span className="xs:hidden">Adicionar</span>
                                    <span className="hidden xs:inline">Adicionar Serviço</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ServiceItem