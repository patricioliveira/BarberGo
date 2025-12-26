"use client"

import { Barbershop, Rating } from "@prisma/client"
import { Card, CardContent, Button } from "@barbergo/ui"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, CreditCardIcon, StarIcon, Wifi, Car, Baby, Accessibility, Instagram, MessageCircle, Snowflake, Tv, Coffee, Beer, Gamepad2, PawPrint, Martini } from "lucide-react"
import { toast } from "sonner"

// Tipagem para os telefones salvos como JSON
type PhoneObj = { number: string; isWhatsapp: boolean }

interface SidebarRightProps {
    barbershop: Barbershop & {
        ratings?: Rating[]
    }
}

interface WorkingHour {
    day: string
    open: string
    close: string
    isOpen: boolean
}

// Mapeamento de ícones
const amenityIcons: any = {
    "WIFI": { icon: Wifi, label: "Wi-Fi" },
    "ACCESSIBILITY": { icon: Accessibility, label: "Acessibilidade" },
    "PARKING": { icon: Car, label: "Estacionamento" },
    "TV": { icon: Tv, label: "TV" },
    "COFFEE": { icon: Coffee, label: "Café" },
    "BEER": { icon: Beer, label: "Cerveja" },
    "BAR": { icon: Martini, label: "Bar" },
    "VIDEO_GAME": { icon: Gamepad2, label: "Video Game" },
    "KIDS": { icon: Baby, label: "Kids" },
    "PET_FRIENDLY": { icon: PawPrint, label: "Pet Friendly" },
    "AIR_CONDITIONING": { icon: Snowflake, label: "Ar Condicionado" },
}

const SidebarRight = ({ barbershop }: SidebarRightProps) => {
    const handleCopyAddress = () => {
        navigator.clipboard.writeText(barbershop.address)
        toast.success("Endereço copiado!")
    }

    const handleOpenMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`
        window.open(url, "_blank")
    }

    const openingHours = (barbershop.openingHours as unknown as WorkingHour[]) || []

    // Tratamento dos telefones
    let phones: PhoneObj[] = []
    if (Array.isArray(barbershop.phones)) {
        if (typeof barbershop.phones[0] === 'string') {
            phones = (barbershop.phones as string[]).map(p => ({ number: p, isWhatsapp: false }))
        } else {
            phones = barbershop.phones as PhoneObj[]
        }
    }

    // Rating (Resumo)
    const ratings = barbershop.ratings || []
    const totalRatings = ratings.length
    const averageRating = totalRatings > 0 ? ratings.reduce((acc, r) => acc + r.stars, 0) / totalRatings : 5.0

    return (
        <div className="sticky top-4">
            <Card className="bg-[#1A1B1F] border-none rounded-2xl p-5 shadow-xl">
                <CardContent className="p-0 space-y-6">

                    {/* Mapa */}
                    <div className="relative w-full h-[180px] rounded-xl overflow-hidden border border-secondary cursor-pointer group" onClick={handleOpenMap}>
                        <Image src="/map.png" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Mapa" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-primary p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                <MapPinIcon size={24} className="text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Info Básica */}
                    <div>
                        <h3 className="text-xl font-bold text-white">{barbershop.name}</h3>
                        <button onClick={handleCopyAddress} className="text-left text-sm text-gray-400 mt-1 hover:text-primary transition-colors flex items-start gap-1">
                            <MapPinIcon size={14} className="mt-0.5 shrink-0" />
                            {barbershop.address}
                        </button>
                    </div>

                    {/* Instagram */}
                    {barbershop.instagram && (
                        <Button variant="outline" className="w-full border-pink-500/30 text-pink-500 hover:bg-pink-500/10" onClick={() => window.open(`https://instagram.com/${barbershop.instagram?.replace('@', '')}`, '_blank')}>
                            <Instagram size={16} className="mr-2" /> {barbershop.instagram}
                        </Button>
                    )}

                    {/* Sobre */}
                    <div>
                        <h4 className="font-bold text-white text-xs mb-2 tracking-widest uppercase">SOBRE NÓS</h4>
                        <p className="text-sm text-gray-400 leading-relaxed text-justify">
                            {barbershop.description || "Descrição não disponível."}
                        </p>
                    </div>

                    {/* Comodidades */}
                    {barbershop.amenities && barbershop.amenities.length > 0 && (
                        <div className="border-y border-[#26272B] py-4">
                            <h4 className="font-bold text-white text-xs mb-3 tracking-widest uppercase">COMODIDADES</h4>
                            <div className="flex flex-wrap gap-3">
                                {barbershop.amenities.map(a => {
                                    const Item = amenityIcons[a]
                                    if (!Item) return null
                                    return (
                                        <div key={a} className="flex flex-col items-center gap-1.5 text-gray-400 w-[70px] mb-1">
                                            <div className="p-2.5 bg-black/40 rounded-2xl border border-secondary/50 group-hover:border-primary/50 transition-colors">
                                                <Item.icon size={18} className="text-gray-300" />
                                            </div>
                                            <span className="text-[9px] font-bold text-center leading-none">{Item.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Contatos */}
                    <div className="space-y-2">
                        {phones.map((phone, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-[#141518] rounded-xl px-4 py-3 border border-secondary/50">
                                <div className="flex items-center gap-2 text-white text-sm">
                                    <PhoneIcon size={16} /> {phone.number}
                                </div>
                                {phone.isWhatsapp ? (
                                    <Button variant="secondary" size="sm" className="h-7 text-xs bg-green-600/20 text-green-500 hover:bg-green-600/30 hover:text-green-400" onClick={() => window.open(`https://wa.me/55${phone.number.replace(/\D/g, "")}`, '_blank')}>
                                        <MessageCircle size={14} className="mr-1" /> Whats
                                    </Button>
                                ) : (
                                    <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(phone.number); toast.success("Copiado!") }}>
                                        Copiar
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 border-t border-[#26272B] pt-4">
                        <StarIcon className="fill-primary text-primary" size={20} />
                        <span className="text-xl font-bold text-white">{averageRating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({totalRatings} avaliações)</span>
                    </div>

                    {/* Horários */}
                    <div className="space-y-2 pt-2">
                        <h4 className="font-bold text-white text-xs mb-2 tracking-widest uppercase">HORÁRIOS</h4>
                        {openingHours.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-400">{item.day}</span>
                                <span className={item.isOpen ? "text-white font-medium" : "text-red-500 font-medium"}>
                                    {item.isOpen ? `${item.open} - ${item.close}` : "Fechado"}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Pagamento */}
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