"use client"

import { Barbershop } from "@prisma/client"
import { Card, CardContent, Button } from "@barbergo/ui"
import Image from "next/image"
import { StarIcon, PhoneIcon } from "lucide-react"
import { toast } from "sonner"

interface SidebarRightProps {
    barbershop: Barbershop
}

const SidebarRight = ({ barbershop }: SidebarRightProps) => {
    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone)
        toast.success("Telefone copiado!")
    }

    // Mock de horários (se não vier do banco, use esse padrão)
    const defaultHours = [
        { day: 'Segunda-Feira', time: '09:00 - 21:00' },
        { day: 'Terça-Feira', time: '09:00 - 21:00' },
        { day: 'Quarta-Feira', time: '09:00 - 21:00' },
        { day: 'Quinta-Feira', time: '09:00 - 21:00' },
        { day: 'Sexta-Feira', time: '08:00 - 17:00' },
        { day: 'Sábado', time: '08:00 - 17:00' },
        { day: 'Domingo', time: 'Fechado' },
    ]

    // Se barbershop.openingHours for null, usa o default
    const hours = barbershop.openingHours ? (barbershop.openingHours as any) : defaultHours

    return (
        <div className="sticky top-4">
            <Card className="bg-[#1A1B1F] border-none rounded-2xl p-5">
                <CardContent className="p-0 space-y-6">

                    {/* Mapa */}
                    <div className="relative w-full h-[180px] rounded-xl overflow-hidden">
                        <Image src="/map.png" fill className="object-cover" alt="Mapa" />
                    </div>

                    {/* Info Básica */}
                    <div>
                        <h3 className="text-xl font-bold text-white">{barbershop.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{barbershop.address}</p>
                    </div>

                    {/* Sobre */}
                    <div>
                        <h4 className="font-bold text-white text-sm mb-2">SOBRE NÓS</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {barbershop.description || "Descrição não disponível."}
                        </p>
                    </div>

                    {/* Contatos */}
                    <div className="space-y-2">
                        {barbershop.phones.map((phone, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-[#141518] rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2 text-white text-sm">
                                    <PhoneIcon size={16} /> {phone}
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleCopyPhone(phone)}
                                >
                                    Copiar
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 border-y border-[#26272B] py-4">
                        <StarIcon className="fill-primary text-primary" size={20} />
                        <span className="text-xl font-bold text-white">5.0</span>
                        <span className="text-sm text-gray-500">(889 avaliações)</span>
                    </div>

                    {/* Horários */}
                    <div className="space-y-2">
                        {hours.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-400">{item.day}</span>
                                <span className="text-white font-medium">{item.time}</span>
                            </div>
                        ))}
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

export default SidebarRight