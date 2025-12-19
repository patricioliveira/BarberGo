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
            className={`border-none rounded-xl transition-all cursor-pointer hover:bg-[#26272B] ${isSelected ? "bg-[#26272B] ring-1 ring-primary" : "bg-[#1A1B1F]"
                }`}
            onClick={onSelect} // Permite selecionar clicando em qualquer lugar do card
        >
            <CardContent className="p-3 flex items-center gap-3 sm:gap-4">
                {/* Imagem Responsiva */}
                <div className="relative h-24 w-24 min-h-[96px] min-w-[96px] sm:h-28 sm:w-28 sm:min-h-[112px] sm:min-w-[112px] overflow-hidden">
                    <Image
                        src={service.imageUrl}
                        fill
                        className="object-cover rounded-lg"
                        alt={service.name}
                    />
                </div>

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
                        <p className="text-sm sm:text-base font-bold text-primary">
                            {Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                            }).format(service.price)}
                        </p>

                        <Button
                            variant={isSelected ? "default" : "secondary"}
                            size="sm"
                            className={`text-[10px] sm:text-xs h-8 px-3 rounded-lg font-bold transition-all ${isSelected
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "bg-[#141518] text-white hover:bg-[#26272B] border border-secondary"
                                }`}
                            onClick={(e) => {
                                e.stopPropagation(); // Evita o clique duplo por causa do onClick do Card
                                onSelect();
                            }}
                        >
                            {/* No mobile muito pequeno, mostra apenas "Adicionar", em telas maiores mostra o texto completo */}
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