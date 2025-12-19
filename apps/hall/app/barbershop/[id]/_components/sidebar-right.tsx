"use client"

import { Barbershop } from "@prisma/client"
import { Card, CardContent, Button } from "@barbergo/ui"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, CreditCardIcon, StarIcon } from "lucide-react"
import { toast } from "sonner"

interface SidebarRightProps {
    barbershop: Barbershop
}

interface WorkingHour {
    day: string
    open: string
    close: string
    isOpen: boolean
}

const SidebarRight = ({ barbershop }: SidebarRightProps) => {
    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone)
        toast.success("Telefone copiado!")
    }

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(barbershop.address)
        toast.success("Endereço copiado!")
    }

    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`
        window.open(url, "_blank")
    }

    // Usa os horários do banco ou um padrão caso seja null
    const openingHours = (barbershop.openingHours as unknown as WorkingHour[]) || []

    return (
        <div className="sticky top-4">
            <Card className="bg-[#1A1B1F] border-none rounded-2xl p-5">
                <CardContent className="p-0 space-y-6">

                    {/* Mapa com o mesmo estilo do Mobile */}
                    <div
                        className="relative w-full h-[180px] rounded-xl overflow-hidden border border-secondary cursor-pointer group"
                        onClick={handleOpenMap}
                    >
                        <Image src="/map.png" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Mapa" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-primary p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                <MapPinIcon size={24} className="text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Info Básica com Clique no Endereço */}
                    <div>
                        <h3 className="text-xl font-bold text-white">{barbershop.name}</h3>
                        <button
                            onClick={handleCopyAddress}
                            className="text-left text-sm text-gray-400 mt-1 hover:text-primary transition-colors flex items-start gap-1"
                        >
                            <MapPinIcon size={14} className="mt-0.5 shrink-0" />
                            {barbershop.address}
                        </button>
                    </div>

                    {/* Sobre */}
                    <div>
                        <h4 className="font-bold text-white text-xs mb-2 tracking-widest uppercase">SOBRE NÓS</h4>
                        <p className="text-sm text-gray-400 leading-relaxed text-justify">
                            {barbershop.description || "Descrição não disponível."}
                        </p>
                    </div>

                    {/* Contatos */}
                    <div className="space-y-2">
                        {barbershop.phones.map((phone, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-[#141518] rounded-xl px-4 py-3 border border-secondary/50">
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

                    {/* Horários Corrigidos */}
                    <div className="space-y-2">
                        {openingHours.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-400">{item.day}</span>
                                <span className={item.isOpen ? "text-white font-medium" : "text-red-500 font-medium"}>
                                    {item.isOpen ? `${item.open} - ${item.close}` : "Fechado"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Pagamentos Adicionados no Desktop */}
                    <div className="pt-2">
                        <h4 className="font-bold text-white text-xs mb-3 tracking-widest uppercase">PAGAMENTO</h4>
                        <div className="flex flex-wrap gap-2">
                            {barbershop.paymentMethods.map((method) => (
                                <div key={method} className="flex items-center gap-2 px-3 py-1.5 bg-[#141518] rounded-full border border-secondary text-[10px] text-gray-300">
                                    <CreditCardIcon size={12} className="text-primary" />
                                    {method}
                                </div>
                            ))}
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

export default SidebarRight