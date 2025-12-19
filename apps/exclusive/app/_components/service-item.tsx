"use client"

import { Button, Card, CardContent } from "@barbergo/ui"
import Image from "next/image"

// Adicione as props corretas baseadas no seu Prisma Schema
interface ServiceItemProps {
    service: any
    isAuthenticated?: boolean
    barbershop: any
}

const ServiceItem = ({ service, isAuthenticated, barbershop }: ServiceItemProps) => {
    return (
        <Card>
            <CardContent className="p-3 w-full flex flex-row items-center gap-4">
                <div className="relative min-h-[110px] min-w-[110px] max-h-[110px] max-w-[110px]">
                    <Image
                        className="rounded-lg object-cover"
                        src={service.imageUrl}
                        fill
                        alt={service.name}
                    />
                </div>

                <div className="flex flex-col w-full">
                    <h2 className="font-bold">{service.name}</h2>
                    <p className="text-sm text-gray-400">{service.description}</p>

                    <div className="flex items-center justify-between mt-3">
                        <p className="text-primary text-sm font-bold">
                            {Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                            }).format(Number(service.price))}
                        </p>
                        <Button variant="secondary" onClick={() => alert("Agendamento em breve!")}>
                            Adicionar serviço
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ServiceItem